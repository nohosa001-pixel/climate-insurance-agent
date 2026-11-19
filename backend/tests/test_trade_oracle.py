import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from core.trade_oracle import TradeClimateOracle, UNIFIED_TRADE_HAZARD_SCHEMA
from server import app


def test_trade_oracle_asset_clear_and_schema():
    oracle = TradeClimateOracle()
    res = oracle.assess_asset(
        asset_id="MINE-CL-ATACAMA",
        lat=-23.50,
        lng=-68.25,
        asset_type="MINE",
        commodity="LITHIUM",
        use_live_feed=False,
    )
    for field in UNIFIED_TRADE_HAZARD_SCHEMA["required_fields"]:
        assert field in res
    assert res["subsystem"] == "CLIMATE_ORACLE"
    assert res["trade_action"] in UNIFIED_TRADE_HAZARD_SCHEMA["trade_actions"]
    assert res["eudr_compliant"] is True
    assert res["bft_verified"] is True


def test_trade_oracle_eudr_hold_compliance():
    oracle = TradeClimateOracle()
    res = oracle.assess_asset(
        asset_id="FARM-BR-9999",
        lat=-12.54,
        lng=-55.72,
        asset_type="FARM",
        commodity="SOYBEAN",
        region_id="BRAZIL_MATO_GROSSO_SOY",
        polygon_id="FARM-BR-9999",
        canopy_loss_pct=4.5,
        use_live_feed=False,
    )
    assert res["eudr_compliant"] is False
    assert res["hazard_type"] == "DEFORESTATION"
    assert res["trade_action"] == "HOLD_COMPLIANCE"
    assert res["severity_score"] >= 85.0


def test_trade_oracle_route_assessment():
    oracle = TradeClimateOracle()
    route = oracle.assess_route(
        waypoints=[
            {"asset_id": "MINE-CL-ATACAMA", "lat": -23.50, "lng": -68.25, "asset_type": "MINE", "commodity": "LITHIUM"},
            {"asset_id": "PORT-PA-PANAMA", "lat": 9.10, "lng": -79.92, "asset_type": "PORT", "commodity": "MARITIME_CORRIDOR"},
        ],
        use_live_feed=False,
    )
    assert route["waypoint_count"] == 2
    assert route["route_trade_action"] in UNIFIED_TRADE_HAZARD_SCHEMA["trade_actions"]
    assert len(route["waypoints"]) == 2


def test_api_trade_oracle_endpoints_and_validation():
    client = TestClient(app)

    assert client.get("/").json()["subsystem"] == "CLIMATE_ORACLE"
    assert client.get("/health").json()["status"] == "OK"
    assert client.get("/api/trade-oracle/schema").json()["schema_version"] == "trade-hazard-oracle/1.0"
    presets = client.get("/api/trade-oracle/presets").json()["presets"]
    assert len(presets) == 8
    preset_ids = {p["asset_id"] for p in presets}
    assert {"FAB-TW-TSMC", "PORT-ID-BELAWAN", "MINE-CL-ATACAMA", "PORT-PA-PANAMA"}.issubset(preset_ids)

    # Invalid coordinates / empty route should fail Pydantic validation (422)
    bad_coord = client.post(
        "/api/trade-oracle/assess",
        json={"asset_id": "BAD", "lat": 95.0, "lng": 200.0, "use_live_feed": False},
    )
    assert bad_coord.status_code == 422

    empty_route = client.post(
        "/api/trade-oracle/assess-route",
        json={"waypoints": [], "use_live_feed": False},
    )
    assert empty_route.status_code == 422

    # Valid asset & route assessments
    assess_resp = client.post(
        "/api/trade-oracle/assess",
        json={
            "asset_id": "MINE-ID-MOROWALI",
            "lat": -2.82,
            "lng": 122.15,
            "asset_type": "MINE",
            "commodity": "NICKEL",
            "use_live_feed": False,
        },
    )
    assert assess_resp.status_code == 200
    assert assess_resp.json()["asset_id"] == "MINE-ID-MOROWALI"

    route_resp = client.post(
        "/api/trade-oracle/assess-route",
        json={
            "waypoints": [
                {"asset_id": "FARM-BR-8891", "lat": -12.54, "lng": -55.72, "asset_type": "FARM", "commodity": "SOYBEAN", "canopy_loss_pct": 0.4},
                {"asset_id": "PORT-BR-SANTOS", "lat": -23.96, "lng": -46.33, "asset_type": "PORT", "commodity": "GRAIN_EXPORT"},
            ],
            "use_live_feed": False,
        },
    )
    assert route_resp.status_code == 200
    assert route_resp.json()["all_eudr_compliant"] is True


def test_circuit_breaker_and_billing_flow():
    client = TestClient(app)

    # Trip circuit breaker -> trade oracle must hold clearances
    trip = client.post("/api/security-gate/trip-circuit-breaker?reason=Test+Halt")
    assert trip.status_code == 200
    assert trip.json()["gate"]["circuit_breaker_active"] is True

    halted = client.post(
        "/api/trade-oracle/assess",
        json={"asset_id": "PORT-BR-SANTOS", "lat": -23.96, "lng": -46.33, "use_live_feed": False},
    )
    assert halted.status_code == 200
    assert halted.json()["trade_action"] == "HOLD_COMPLIANCE"
    assert halted.json()["bft_verified"] is False

    # Reset circuit breaker
    reset = client.post("/api/security-gate/reset-circuit-breaker")
    assert reset.status_code == 200
    assert reset.json()["gate"]["circuit_breaker_active"] is False

    # EUDR direct audit & USDC billing session + verify
    eudr = client.post(
        "/api/security/eudr/audit",
        json={"region_id": "BRAZIL_MATO_GROSSO_SOY", "polygon_id": "FARM-BR-01", "canopy_loss_pct": 0.2},
    )
    assert eudr.status_code == 200
    assert eudr.json()["is_compliant"] is True

    session = client.post(
        "/api/billing/session",
        json={"plan_id": "EUDR_AUDIT_PACK", "chain": "Arbitrum One", "payer_wallet": "0x1234567890abcdef"},
    )
    assert session.status_code == 200
    session_id = session.json()["session_id"]

    verify = client.post(
        "/api/billing/verify",
        json={"session_id": session_id, "payer_wallet": "0x1234567890abcdef"},
    )
    assert verify.status_code == 200
    assert verify.json()["success"] is True


def test_impact_accuracy_by_asset_and_commodity():
    oracle = TradeClimateOracle()

    # 1. Atacama Lithium Brine: dry/hot desert weather is NORMAL (not a drought false-positive)
    atacama_dry = oracle.assess_asset(
        asset_id="MINE-CL-ATACAMA",
        lat=-23.50,
        lng=-68.25,
        asset_type="MINE",
        commodity="LITHIUM",
        telemetry_override={
            "temp_c": 31.0,
            "precip_mm": 0.0,
            "wind_kmh": 15.0,
            "max_temp_3d_c": 34.0,
            "temp_30d_avg_c": 30.0,
            "precip_sum_3d_mm": 0.0,
            "precip_30d_mm": 2.0,
            "wind_max_3d_kmh": 20.0,
        },
    )
    assert atacama_dry["trade_action"] == "CLEAR"
    assert atacama_dry["impact_assessment"]["profile_used"] == "MINE:LITHIUM_BRINE"

    # 2. Atacama Lithium Brine: unexpected heavy rain dilutes evaporation ponds -> REROUTE
    atacama_rain = oracle.assess_asset(
        asset_id="MINE-CL-ATACAMA",
        lat=-23.50,
        lng=-68.25,
        asset_type="MINE",
        commodity="LITHIUM",
        telemetry_override={
            "temp_c": 18.0,
            "precip_mm": 15.0,
            "wind_kmh": 25.0,
            "max_temp_3d_c": 20.0,
            "temp_30d_avg_c": 22.0,
            "precip_sum_3d_mm": 55.0,
            "precip_30d_mm": 60.0,
            "wind_max_3d_kmh": 30.0,
        },
    )
    assert atacama_rain["trade_action"] == "REROUTE"
    assert atacama_rain["impact_assessment"]["operational_impact"] == "BRINE_DILUTION_RISK"

    # 3. Panama Canal Maritime Corridor: severe 30d basin rainfall deficit -> DRAFT_RESTRICTION_RISK
    panama_low_water = oracle.assess_asset(
        asset_id="PORT-PA-PANAMA",
        lat=9.10,
        lng=-79.92,
        asset_type="PORT",
        commodity="MARITIME_CORRIDOR",
        telemetry_override={
            "temp_c": 30.0,
            "precip_mm": 0.0,
            "wind_kmh": 12.0,
            "max_temp_3d_c": 32.0,
            "temp_30d_avg_c": 31.0,
            "precip_sum_3d_mm": 1.0,
            "precip_30d_mm": 15.0,  # vs 160mm tropical norm -> <10%
            "wind_max_3d_kmh": 18.0,
        },
    )
    assert panama_low_water["trade_action"] == "REROUTE"
    assert panama_low_water["impact_assessment"]["operational_impact"] == "DRAFT_RESTRICTION_RISK"
    assert panama_low_water["impact_assessment"]["estimated_delay_days"] > 0.0

    # 4. Grain Export Port: moderate 3d rain halts open-hatch grain loading
    santos_rain = oracle.assess_asset(
        asset_id="PORT-BR-SANTOS",
        lat=-23.96,
        lng=-46.33,
        asset_type="PORT",
        commodity="GRAIN_EXPORT",
        telemetry_override={
            "temp_c": 24.0,
            "precip_mm": 10.0,
            "wind_kmh": 22.0,
            "max_temp_3d_c": 26.0,
            "temp_30d_avg_c": 25.0,
            "precip_sum_3d_mm": 65.0,
            "precip_30d_mm": 110.0,
            "wind_max_3d_kmh": 30.0,
        },
    )
    assert santos_rain["trade_action"] == "CAUTION"
    assert santos_rain["impact_assessment"]["operational_impact"] == "SHIPLOADING_HALT_RISK"


def test_climatology_override_and_multisource_bft_divergence():
    oracle = TradeClimateOracle()
    base_weather = {
        "temp_c": 26.0,
        "precip_mm": 0.0,
        "wind_kmh": 14.0,
        "max_temp_3d_c": 28.0,
        "temp_30d_avg_c": 25.0,
        "precip_sum_3d_mm": 5.0,
        "precip_30d_mm": 20.0,
        "wind_max_3d_kmh": 18.0,
    }

    # Same 20mm 30d rainfall at a normally wet copper mine (norm=100mm) -> drought water shortage
    wet_norm = oracle.assess_asset(
        asset_id="MINE-COPPER-WETNORM",
        lat=-10.0,
        lng=-75.0,
        asset_type="MINE",
        commodity="COPPER",
        telemetry_override=base_weather,
        climatology_override={"expected_30d_precip_mm": 100.0, "norm_temp_max_c": 26.0},
        secondary_feed_override={"temp_c": 25.5, "precip_3d_mm": 6.0},
    )
    assert wet_norm["bft_mode"] == "MULTI_SOURCE_LIVE_BFT"
    assert wet_norm["bft_verified"] is True
    assert wet_norm["impact_assessment"]["operational_impact"] == "WATER_SUPPLY_SHORTAGE"

    # When NASA POWER secondary feed strongly diverges (>8.5% proxy spread), BFT rejects consensus
    divergent = oracle.assess_asset(
        asset_id="PORT-DIVERGE-TEST",
        lat=9.10,
        lng=-79.92,
        asset_type="PORT",
        commodity="GENERAL",
        telemetry_override=base_weather,
        climatology_override={"expected_30d_precip_mm": 150.0, "norm_temp_max_c": 30.0},
        secondary_feed_override={"temp_c": 22.0, "precip_3d_mm": 120.0},
    )
    assert divergent["bft_mode"] == "MULTI_SOURCE_LIVE_BFT"
    assert divergent["bft_verified"] is False
    assert "Abnormal oracle divergence" in divergent["bft_verdict"]
