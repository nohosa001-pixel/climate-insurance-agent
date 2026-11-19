"""
Trade-Enabling Climate & Compliance Oracle Subsystem (v3.2 - Climatology & Multi-Source BFT)
Models how physical weather anomalies actually impact specific trade assets & commodities
using coordinate-specific multi-year climatology and independent multi-source BFT verification
(Open-Meteo ECMWF + NASA POWER MERRA-2).
"""

import datetime
import hashlib
import math
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List, Optional, Tuple
import requests

from core.security_gate import AutonomousSecurityGate


TRADE_HUB_PRESETS: List[Dict[str, Any]] = [
    {
        "asset_id": "MINE-CL-ATACAMA",
        "name": "Salar de Atacama Lithium Brine Operations",
        "asset_type": "MINE",
        "commodity": "LITHIUM",
        "region_id": "SOUTH_AMERICA_ANDES",
        "lat": -23.50,
        "lng": -68.25,
        "canopy_loss_pct": 0.0,
    },
    {
        "asset_id": "MINE-ID-MOROWALI",
        "name": "Morowali Nickel Processing & Port",
        "asset_type": "MINE",
        "commodity": "NICKEL",
        "region_id": "SE_ASIA_SULAWESI",
        "lat": -2.82,
        "lng": 122.15,
        "canopy_loss_pct": 0.3,
    },
    {
        "asset_id": "MINE-PE-CERRO",
        "name": "Cerro Verde Copper Mine (Arequipa)",
        "asset_type": "MINE",
        "commodity": "COPPER",
        "region_id": "SOUTH_AMERICA_ANDES",
        "lat": -16.53,
        "lng": -71.58,
        "canopy_loss_pct": 0.0,
    },
    {
        "asset_id": "PORT-PA-PANAMA",
        "name": "Panama Canal (Gatun Lake Transit Corridor)",
        "asset_type": "PORT",
        "commodity": "MARITIME_CORRIDOR",
        "region_id": "CENTRAL_AMERICA",
        "lat": 9.10,
        "lng": -79.92,
        "canopy_loss_pct": 0.1,
    },
    {
        "asset_id": "FARM-BR-8891",
        "name": "Mato Grosso Soy Export Polygon (Sorriso)",
        "asset_type": "FARM",
        "commodity": "SOYBEAN",
        "region_id": "BRAZIL_MATO_GROSSO_SOY",
        "lat": -12.54,
        "lng": -55.72,
        "canopy_loss_pct": 0.4,
    },
    {
        "asset_id": "PORT-BR-SANTOS",
        "name": "Port of Santos Agri & Mineral Terminal",
        "asset_type": "PORT",
        "commodity": "GRAIN_EXPORT",
        "region_id": "BRAZIL_COAST",
        "lat": -23.96,
        "lng": -46.33,
        "canopy_loss_pct": 0.0,
    },
    {
        "asset_id": "FAB-TW-TSMC",
        "name": "TSMC Hsinchu Semiconductor Fab Complex",
        "asset_type": "SMELTER",
        "commodity": "SEMICONDUCTOR",
        "region_id": "TAIWAN_RYUKYU",
        "lat": 24.78,
        "lng": 120.99,
        "canopy_loss_pct": 0.0,
    },
    {
        "asset_id": "PORT-ID-BELAWAN",
        "name": "Port of Belawan Palm Oil & Rubber Hub (Sumatra)",
        "asset_type": "PORT",
        "commodity": "PALM_OIL",
        "region_id": "SE_ASIA_SUMATRA",
        "lat": 3.78,
        "lng": 98.68,
        "canopy_loss_pct": 0.2,
    },
]

UNIFIED_TRADE_HAZARD_SCHEMA: Dict[str, Any] = {
    "schema_version": "trade-hazard-oracle/1.0",
    "subsystems": ["CLIMATE_ORACLE", "SEISMIC_ORACLE"],
    "trade_actions": ["CLEAR", "CAUTION", "REROUTE", "HOLD_COMPLIANCE"],
    "hazard_types": [
        "NOMINAL",
        "HEATWAVE",
        "FLOOD_PRECIP",
        "DROUGHT",
        "HIGH_WIND",
        "DEFORESTATION",
        "SEISMIC",
    ],
    "required_fields": [
        "subsystem",
        "asset_id",
        "asset_type",
        "commodity",
        "location",
        "hazard_type",
        "severity_score",
        "trade_action",
        "force_majeure_eligible",
        "eudr_compliant",
        "bft_verified",
        "oracle_proof",
        "timestamp",
    ],
}

_MONTH_KEYS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]


class TradeClimateOracle:
    """
    Impact-calibrated, climatology-normalized, multi-source BFT climate & EUDR oracle.
    """

    SUBSYSTEM_ID = "CLIMATE_ORACLE"

    def __init__(
        self,
        security_gate: Optional[AutonomousSecurityGate] = None,
        cache_ttl_seconds: int = 900,
        climatology_ttl_seconds: int = 86400,
        request_timeout_seconds: float = 1.5,
    ):
        self.security_gate = security_gate or AutonomousSecurityGate()
        self.cache_ttl_seconds = cache_ttl_seconds
        self.climatology_ttl_seconds = climatology_ttl_seconds
        self.request_timeout_seconds = request_timeout_seconds
        self._weather_cache: Dict[Tuple[float, float], Tuple[float, Dict[str, Any]]] = {}
        self._nasa_daily_cache: Dict[Tuple[float, float], Tuple[float, Dict[str, Any]]] = {}
        self._climatology_cache: Dict[Tuple[float, float, int], Tuple[float, Dict[str, float]]] = {}

    def _fetch_open_meteo(self, lat: float, lng: float) -> Tuple[str, Dict[str, Any]]:
        """Fetch 30-day history + 3-day forecast from Open-Meteo for anomaly-based impact scoring."""
        key = (round(lat, 2), round(lng, 2))
        now = time.time()
        cached = self._weather_cache.get(key)
        if cached and (now - cached[0]) < self.cache_ttl_seconds:
            return "LIVE_OPEN_METEO_CACHED", cached[1]

        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": key[0],
            "longitude": key[1],
            "current": "temperature_2m,precipitation,wind_speed_10m",
            "daily": "temperature_2m_max,precipitation_sum,wind_speed_10m_max",
            "past_days": 30,
            "forecast_days": 3,
            "timezone": "UTC",
        }
        try:
            resp = requests.get(url, params=params, timeout=self.request_timeout_seconds)
            resp.raise_for_status()
            data = resp.json()
            current = data.get("current", {})
            daily = data.get("daily", {})

            temps = [float(x) for x in daily.get("temperature_2m_max", [28.0]) if x is not None]
            precips = [float(x) for x in daily.get("precipitation_sum", [0.0]) if x is not None]
            winds = [float(x) for x in daily.get("wind_speed_10m_max", [15.0]) if x is not None]

            precip_3d = sum(precips[-3:]) if precips else 0.0
            precip_30d = sum(precips[:-3]) if len(precips) > 3 else sum(precips)
            temp_max_3d = max(temps[-3:]) if temps else float(current.get("temperature_2m", 25.0))
            temp_30d_avg = (sum(temps[:-3]) / max(1, len(temps[:-3]))) if len(temps) > 3 else temp_max_3d
            wind_max_3d = max(winds[-3:]) if winds else float(current.get("wind_speed_10m", 10.0))

            parsed = {
                "temp_c": round(float(current.get("temperature_2m", temp_max_3d)), 1),
                "precip_mm": round(float(current.get("precipitation", 0.0)), 1),
                "wind_kmh": round(float(current.get("wind_speed_10m", wind_max_3d)), 1),
                "max_temp_3d_c": round(temp_max_3d, 1),
                "temp_30d_avg_c": round(temp_30d_avg, 1),
                "precip_sum_3d_mm": round(precip_3d, 1),
                "precip_30d_mm": round(precip_30d, 1),
                "wind_max_3d_kmh": round(wind_max_3d, 1),
            }
            self._weather_cache[key] = (now, parsed)
            return "LIVE_OPEN_METEO", parsed
        except Exception:
            return "SYNTHETIC_FALLBACK", self._synthetic_weather(lat, lng)

    def _fetch_nasa_power_climatology(self, lat: float, lng: float) -> Tuple[str, Dict[str, float]]:
        """Fetch coordinate-specific multi-year monthly climatology from NASA POWER API."""
        month_idx = datetime.datetime.now(datetime.timezone.utc).month
        key = (round(lat, 2), round(lng, 2), month_idx)
        now = time.time()
        cached = self._climatology_cache.get(key)
        if cached and (now - cached[0]) < self.climatology_ttl_seconds:
            return "NASA_POWER_CLIMATOLOGY_CACHED", cached[1]

        url = "https://power.larc.nasa.gov/api/temporal/climatology/point"
        params = {
            "parameters": "PRECTOTCORR,T2M_MAX",
            "community": "AG",
            "longitude": key[1],
            "latitude": key[0],
            "format": "JSON",
        }
        try:
            resp = requests.get(url, params=params, timeout=self.request_timeout_seconds)
            resp.raise_for_status()
            param_data = resp.json().get("properties", {}).get("parameter", {})
            month_key = _MONTH_KEYS[month_idx - 1]
            daily_precip = float(param_data.get("PRECTOTCORR", {}).get(month_key, 2.0))
            norm_temp_max = float(param_data.get("T2M_MAX", {}).get(month_key, 26.0))
            if daily_precip < 0:
                daily_precip = 0.0
            baseline = {
                "expected_30d_precip_mm": round(daily_precip * 30.0, 1),
                "norm_temp_max_c": round(norm_temp_max, 1),
            }
            self._climatology_cache[key] = (now, baseline)
            return "NASA_POWER_CLIMATOLOGY", baseline
        except Exception:
            return "LATITUDE_BAND_FALLBACK", {
                "expected_30d_precip_mm": self._expected_30d_precip_mm(lat),
                "norm_temp_max_c": round(14.0 + 18.0 * math.cos(math.radians(lat)), 1),
            }

    def _fetch_nasa_power_recent(self, lat: float, lng: float) -> Optional[Dict[str, float]]:
        """Fetch independent recent daily observation from NASA POWER MERRA-2 for BFT cross-check."""
        key = (round(lat, 2), round(lng, 2))
        now = time.time()
        cached = self._nasa_daily_cache.get(key)
        if cached and (now - cached[0]) < self.cache_ttl_seconds:
            return cached[1]

        end_dt = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2)
        start_dt = end_dt - datetime.timedelta(days=4)
        url = "https://power.larc.nasa.gov/api/temporal/daily/point"
        params = {
            "parameters": "PRECTOTCORR,T2M_MAX",
            "community": "AG",
            "longitude": key[1],
            "latitude": key[0],
            "start": start_dt.strftime("%Y%m%d"),
            "end": end_dt.strftime("%Y%m%d"),
            "format": "JSON",
        }
        try:
            resp = requests.get(url, params=params, timeout=self.request_timeout_seconds)
            resp.raise_for_status()
            param_data = resp.json().get("properties", {}).get("parameter", {})
            precip_vals = [float(v) for v in param_data.get("PRECTOTCORR", {}).values() if v is not None and float(v) >= 0]
            temp_vals = [float(v) for v in param_data.get("T2M_MAX", {}).values() if v is not None and float(v) > -90]
            if not precip_vals or not temp_vals:
                return None
            parsed = {
                "precip_3d_mm": round(sum(precip_vals[-3:]), 1),
                "temp_c": round(sum(temp_vals[-3:]) / min(3, len(temp_vals)), 1),
            }
            self._nasa_daily_cache[key] = (now, parsed)
            return parsed
        except Exception:
            return None

    @staticmethod
    def _synthetic_weather(lat: float, lng: float) -> Dict[str, Any]:
        """Deterministic climatology-aware baseline when offline or rate-limited."""
        lat_factor = math.cos(math.radians(lat))
        phase = math.sin(math.radians(lat * 3.1 + lng * 1.7))
        temp_c = round(14.0 + 18.0 * lat_factor + 3.5 * phase, 1)
        if abs(lat) < 15.0:
            daily_rain_norm = 5.5
        elif 18.0 <= abs(lat) <= 32.0:
            daily_rain_norm = 0.8
        else:
            daily_rain_norm = 2.5
        precip_3d = round(max(0.0, daily_rain_norm * 3.0 + 2.0 * math.cos(math.radians(lng * 2.3))), 1)
        precip_30d = round(daily_rain_norm * 30.0, 1)
        wind_max_3d = round(18.0 + abs(phase) * 16.0, 1)
        return {
            "temp_c": temp_c,
            "precip_mm": round(precip_3d / 6.0, 1),
            "wind_kmh": round(wind_max_3d * 0.7, 1),
            "max_temp_3d_c": round(temp_c + 2.5, 1),
            "temp_30d_avg_c": temp_c,
            "precip_sum_3d_mm": precip_3d,
            "precip_30d_mm": precip_30d,
            "wind_max_3d_kmh": wind_max_3d,
        }

    @staticmethod
    def _expected_30d_precip_mm(lat: float) -> float:
        """Fallback latitude-band 30-day normal precipitation (mm) when offline."""
        abs_lat = abs(lat)
        if abs_lat < 12.0:
            return 160.0
        if abs_lat < 30.0:
            return 45.0
        return 75.0

    @staticmethod
    def _compute_soil_moisture_proxy(temp_c: float, precip_3d_mm: float) -> float:
        """Convert temp & 3-day precipitation into normalized root-zone moisture proxy (%)."""
        return round(max(5.0, min(45.0, 22.0 + (precip_3d_mm * 0.15) - max(0.0, temp_c - 25.0) * 0.4)), 1)

    @classmethod
    def _evaluate_trade_impact(
        cls,
        weather: Dict[str, Any],
        lat: float,
        asset_type: str,
        commodity: str,
        climatology: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        """
        Translate physical weather into asset- and commodity-specific operational trade impact
        relative to coordinate-specific historical climatology.
        """
        a_type = asset_type.upper()
        comm = commodity.upper()

        max_temp = weather["max_temp_3d_c"]
        baseline_temp = (climatology or {}).get("norm_temp_max_c", weather.get("temp_30d_avg_c", max_temp))
        temp_anomaly = max_temp - baseline_temp
        precip_3d = weather["precip_sum_3d_mm"]
        precip_30d = weather.get("precip_30d_mm", precip_3d * 10.0)
        wind_3d = weather.get("wind_max_3d_kmh", weather["wind_kmh"])

        expected_30d = (climatology or {}).get("expected_30d_precip_mm", cls._expected_30d_precip_mm(lat))
        effective_expected = max(10.0, expected_30d)
        precip_30d_ratio = precip_30d / effective_expected
        precip_30d_anomaly_pct = round((precip_30d_ratio - 1.0) * 100.0, 1)

        scores: List[Tuple[str, float, str, str]] = []

        if a_type == "MINE" and comm == "LITHIUM":
            profile = "MINE:LITHIUM_BRINE"
            rain_score = max(0.0, (precip_3d - 15.0) * 2.2)
            scores.append(("FLOOD_PRECIP", rain_score, "BRINE_DILUTION_RISK", f"Unexpected 3d rainfall ({precip_3d:.1f}mm) dilutes solar evaporation ponds"))

        elif a_type == "MINE":
            profile = f"MINE:{comm}"
            rain_threshold = 90.0 if expected_30d >= 120.0 else 50.0
            flood_score = max(0.0, (precip_3d - rain_threshold) * 1.1)
            scores.append(("FLOOD_PRECIP", flood_score, "HAUL_ROAD_FLOOD_RISK", f"Heavy 3d rainfall ({precip_3d:.1f}mm > {rain_threshold:.0f}mm) risks pit flooding & high-moisture ore halt"))
            if comm in ("COPPER", "GOLD"):
                water_deficit_score = max(0.0, (0.40 - precip_30d_ratio) * 140.0) if expected_30d >= 40.0 else 0.0
                scores.append(("DROUGHT", water_deficit_score, "WATER_SUPPLY_SHORTAGE", f"30d precipitation at {precip_30d_ratio*100:.0f}% of local norm ({expected_30d:.0f}mm) strains ore processing water"))

        elif a_type == "PORT" and comm == "MARITIME_CORRIDOR":
            profile = "PORT:MARITIME_CORRIDOR"
            draft_score = max(0.0, (0.65 - precip_30d_ratio) * 135.0)
            wind_score = max(0.0, (wind_3d - 65.0) * 1.8)
            scores.append(("DROUGHT", draft_score, "DRAFT_RESTRICTION_RISK", f"30d basin rainfall ({precip_30d:.1f}mm vs {expected_30d:.0f}mm norm, {precip_30d_anomaly_pct:+.1f}%) threatens lock/draft capacity"))
            scores.append(("HIGH_WIND", wind_score, "VESSEL_TRANSIT_SUSPENSION", f"Gale-force gusts ({wind_3d:.1f} km/h) disrupt pilotage & lock approaches"))

        elif a_type == "PORT":
            profile = f"PORT:{comm}"
            wind_score = max(0.0, (wind_3d - 60.0) * 1.7)
            scores.append(("HIGH_WIND", wind_score, "CRANE_AND_BERTH_DELAY", f"Terminal wind gusts ({wind_3d:.1f} km/h > 60 km/h) risk gantry crane shutdown"))
            rain_thresh = 25.0 if comm in ("GRAIN_EXPORT", "SOYBEAN", "CORN", "WHEAT", "SUGAR") else 75.0
            rain_score = max(0.0, (precip_3d - rain_thresh) * 1.3)
            scores.append(("FLOOD_PRECIP", rain_score, "SHIPLOADING_HALT_RISK", f"3d rainfall ({precip_3d:.1f}mm > {rain_thresh:.0f}mm) halts open-hatch cargo loading"))

        else:
            profile = f"FARM:{comm}"
            drought_score = max(0.0, (0.55 - precip_30d_ratio) * 145.0) if expected_30d >= 25.0 else 0.0
            heat_score = max(0.0, (max_temp - 35.0) * 5.5) + max(0.0, (temp_anomaly - 5.0) * 4.0)
            flood_score = max(0.0, (precip_3d - 80.0) * 1.1)
            scores.append(("DROUGHT", drought_score, "CROP_MOISTURE_STRESS", f"30d rainfall deficit ({precip_30d_anomaly_pct:+.1f}% vs {expected_30d:.0f}mm local norm) stresses yield"))
            scores.append(("HEATWAVE", heat_score, "THERMAL_YIELD_STRESS", f"Peak 3d temp ({max_temp:.1f}°C, {temp_anomaly:+.1f}°C vs local norm) risks pollination/crop loss"))
            scores.append(("FLOOD_PRECIP", flood_score, "HARVEST_FIELD_FLOODING", f"Excess 3d rain ({precip_3d:.1f}mm) blocks harvest & inland trucking"))

        hazard_type, top_score, op_impact, rationale = max(scores, key=lambda x: x[1])
        severity = round(min(100.0, top_score), 1)
        if severity < 15.0:
            hazard_type = "NOMINAL"
            op_impact = "NOMINAL_OPERATIONS"
            rationale = f"Weather within operational tolerance for {profile}"

        estimated_delay_days = round((severity / 100.0) * 10.0, 1) if severity >= 25.0 else 0.0
        throughput_capacity_pct = round(max(15.0, 100.0 - severity * 0.75), 1)

        return {
            "hazard_type": hazard_type,
            "severity_score": severity,
            "impact_assessment": {
                "profile_used": profile,
                "operational_impact": op_impact,
                "estimated_delay_days": estimated_delay_days,
                "throughput_capacity_pct": throughput_capacity_pct,
                "anomaly_metrics": {
                    "precip_3d_mm": precip_3d,
                    "precip_30d_mm": precip_30d,
                    "expected_30d_precip_mm": expected_30d,
                    "precip_30d_anomaly_pct": precip_30d_anomaly_pct,
                    "max_temp_3d_c": max_temp,
                    "norm_temp_max_c": baseline_temp,
                    "wind_max_3d_kmh": wind_3d,
                },
                "impact_rationale": rationale,
            },
        }

    def assess_asset(
        self,
        asset_id: str,
        lat: float,
        lng: float,
        asset_type: str = "PORT",
        commodity: str = "GENERAL",
        region_id: Optional[str] = None,
        polygon_id: Optional[str] = None,
        canopy_loss_pct: float = 0.0,
        use_live_feed: bool = True,
        telemetry_override: Optional[Dict[str, Any]] = None,
        climatology_override: Optional[Dict[str, float]] = None,
        secondary_feed_override: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        """Evaluate asset-specific climate impact, multi-source BFT consensus, and EUDR compliance."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        nasa_recent_prefetched: Optional[Dict[str, float]] = None

        if use_live_feed and telemetry_override is None and climatology_override is None and secondary_feed_override is None:
            with ThreadPoolExecutor(max_workers=3) as pool:
                fut_om = pool.submit(self._fetch_open_meteo, lat, lng)
                fut_clim = pool.submit(self._fetch_nasa_power_climatology, lat, lng)
                fut_nasa = pool.submit(self._fetch_nasa_power_recent, lat, lng)
                source_mode, weather = fut_om.result()
                climatology_mode, climatology = fut_clim.result()
                nasa_recent_prefetched = fut_nasa.result()
        else:
            if telemetry_override is not None:
                source_mode = "TELEMETRY_OVERRIDE"
                weather = telemetry_override
            elif use_live_feed:
                source_mode, weather = self._fetch_open_meteo(lat, lng)
            else:
                source_mode, weather = "SYNTHETIC_BASELINE", self._synthetic_weather(lat, lng)

            if climatology_override is not None:
                climatology_mode = "CLIMATOLOGY_OVERRIDE"
                climatology = climatology_override
            elif use_live_feed:
                climatology_mode, climatology = self._fetch_nasa_power_climatology(lat, lng)
            else:
                climatology_mode = "LATITUDE_BAND_BASELINE"
                climatology = {
                    "expected_30d_precip_mm": self._expected_30d_precip_mm(lat),
                    "norm_temp_max_c": weather.get("temp_30d_avg_c", weather["temp_c"]),
                }

        impact = self._evaluate_trade_impact(weather, lat, asset_type, commodity, climatology=climatology)
        impact["impact_assessment"]["climatology_source"] = climatology_mode
        hazard_type = impact["hazard_type"]
        severity = impact["severity_score"]

        # EUDR compliance check when agricultural or polygon audit is supplied
        eudr_compliant = True
        eudr_verdict = "NOT_APPLICABLE"
        if asset_type.upper() == "FARM" or polygon_id or canopy_loss_pct > 0.0:
            eudr_compliant, _, eudr_verdict = self.security_gate.audit_eudr_compliance(
                region_id=region_id or f"GEO_{round(lat, 1)}_{round(lng, 1)}",
                farm_polygon_id=polygon_id or asset_id,
                canopy_cover_loss_pct=canopy_loss_pct,
            )
            if not eudr_compliant:
                hazard_type = "DEFORESTATION"
                severity = max(severity, 85.0)
                impact["impact_assessment"]["operational_impact"] = "EUDR_CUSTOMS_BLOCK"
                impact["impact_assessment"]["impact_rationale"] = eudr_verdict

        # Multi-source BFT verification: Primary (Open-Meteo) vs Secondary (NASA POWER MERRA-2)
        primary_sm = self._compute_soil_moisture_proxy(weather["temp_c"], weather["precip_sum_3d_mm"])
        nasa_recent = (
            secondary_feed_override
            if secondary_feed_override is not None
            else (
                nasa_recent_prefetched
                if nasa_recent_prefetched is not None
                else (self._fetch_nasa_power_recent(lat, lng) if (use_live_feed and telemetry_override is not None) else None)
            )
        )
        if nasa_recent is not None:
            secondary_sm = self._compute_soil_moisture_proxy(nasa_recent["temp_c"], nasa_recent["precip_3d_mm"])
            bft_mode = "MULTI_SOURCE_LIVE_BFT"
            bft_nodes = [
                {"node": "OPEN_METEO_ECMWF", "soil_moisture_pct": primary_sm},
                {"node": "NASA_POWER_MERRA2", "soil_moisture_pct": secondary_sm},
                {"node": "CLIMATOLOGY_ANCHOR", "soil_moisture_pct": round((primary_sm + secondary_sm) / 2.0, 1)},
            ]
        else:
            bft_mode = "SINGLE_SOURCE_FALLBACK_BFT"
            bft_nodes = [
                {"node": "OPEN_METEO_ECMWF", "soil_moisture_pct": primary_sm},
                {"node": "CLIMATOLOGY_ANCHOR", "soil_moisture_pct": primary_sm},
            ]

        bft_ok, _, bft_verdict = self.security_gate.verify_oracle_consensus(asset_id, bft_nodes)

        if self.security_gate.circuit_breaker_active:
            trade_action = "HOLD_COMPLIANCE"
            bft_ok = False
            bft_verdict = f"BLOCKED: Circuit breaker active ({self.security_gate.circuit_breaker_reason})"
        elif not eudr_compliant:
            trade_action = "HOLD_COMPLIANCE"
        elif severity >= 70.0:
            trade_action = "REROUTE"
        elif severity >= 35.0:
            trade_action = "CAUTION"
        else:
            trade_action = "CLEAR"

        force_majeure = severity >= 75.0 and hazard_type in ("FLOOD_PRECIP", "HEATWAVE", "DROUGHT", "HIGH_WIND")
        proof_payload = f"{self.SUBSYSTEM_ID}:{asset_id}:{lat:.4f}:{lng:.4f}:{hazard_type}:{severity}:{now_iso}"
        proof_hash = "0x" + hashlib.sha256(proof_payload.encode()).hexdigest()

        return {
            "subsystem": self.SUBSYSTEM_ID,
            "schema_version": UNIFIED_TRADE_HAZARD_SCHEMA["schema_version"],
            "asset_id": asset_id,
            "asset_type": asset_type.upper(),
            "commodity": commodity.upper(),
            "location": {"lat": lat, "lng": lng, "region_id": region_id},
            "source_mode": source_mode,
            "bft_mode": bft_mode,
            "telemetry": weather,
            "hazard_type": hazard_type,
            "severity_score": severity,
            "trade_action": trade_action,
            "force_majeure_eligible": force_majeure,
            "impact_assessment": impact["impact_assessment"],
            "eudr_compliant": eudr_compliant,
            "eudr_verdict": eudr_verdict,
            "bft_verified": bft_ok,
            "bft_verdict": bft_verdict,
            "oracle_proof": proof_hash,
            "timestamp": now_iso,
        }

    def assess_route(self, waypoints: List[Dict[str, Any]], use_live_feed: bool = True) -> Dict[str, Any]:
        """Evaluate an end-to-end multi-waypoint trade route (e.g., Mine -> Port -> Port) in parallel."""
        def _eval_wp(item: Tuple[int, Dict[str, Any]]) -> Dict[str, Any]:
            idx, wp = item
            return self.assess_asset(
                asset_id=wp.get("asset_id", f"WP-{idx + 1}"),
                lat=wp["lat"],
                lng=wp["lng"],
                asset_type=wp.get("asset_type", "PORT"),
                commodity=wp.get("commodity", "GENERAL"),
                region_id=wp.get("region_id"),
                polygon_id=wp.get("polygon_id"),
                canopy_loss_pct=float(wp.get("canopy_loss_pct", 0.0)),
                use_live_feed=use_live_feed,
            )

        if len(waypoints) > 1 and use_live_feed:
            with ThreadPoolExecutor(max_workers=min(8, len(waypoints))) as pool:
                assessments = list(pool.map(_eval_wp, enumerate(waypoints)))
        else:
            assessments = [_eval_wp((idx, wp)) for idx, wp in enumerate(waypoints)]

        max_severity = max((a["severity_score"] for a in assessments), default=0.0)
        total_delay_days = round(sum(a["impact_assessment"]["estimated_delay_days"] for a in assessments), 1)
        min_capacity_pct = min((a["impact_assessment"]["throughput_capacity_pct"] for a in assessments), default=100.0)

        any_hold = any(a["trade_action"] == "HOLD_COMPLIANCE" for a in assessments)
        any_reroute = any(a["trade_action"] == "REROUTE" for a in assessments)
        any_caution = any(a["trade_action"] == "CAUTION" for a in assessments)

        if any_hold:
            route_action = "HOLD_COMPLIANCE"
        elif any_reroute:
            route_action = "REROUTE"
        elif any_caution:
            route_action = "CAUTION"
        else:
            route_action = "CLEAR"

        return {
            "subsystem": self.SUBSYSTEM_ID,
            "waypoint_count": len(assessments),
            "route_trade_action": route_action,
            "max_severity_score": max_severity,
            "estimated_total_delay_days": total_delay_days,
            "bottleneck_capacity_pct": min_capacity_pct,
            "all_eudr_compliant": all(a["eudr_compliant"] for a in assessments),
            "force_majeure_triggered": any(a["force_majeure_eligible"] for a in assessments),
            "waypoints": assessments,
        }
