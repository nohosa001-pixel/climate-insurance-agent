"""
FastAPI Server for Trade-Enabling Climate & Compliance Oracle Subsystem (v3.0)
Provides physical climate risk, EUDR deforestation audits, and USDC billing
for EUDR, Minerals Oracle, and global trade systems alongside global-earthquake.
"""

from typing import Optional, List
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from core.security_gate import AutonomousSecurityGate
from core.trade_oracle import (
    TradeClimateOracle,
    TRADE_HUB_PRESETS,
    UNIFIED_TRADE_HAZARD_SCHEMA,
)
from core.usdc_billing_engine import usdc_billing_engine

security_gate = AutonomousSecurityGate()
trade_oracle = TradeClimateOracle(security_gate=security_gate)

app = FastAPI(
    title="Trade-Enabling Climate & Compliance Oracle Subsystem",
    description="Physical climate, EUDR deforestation, and supply-chain disruption oracle feeding EUDR, Minerals Oracle, and global trade systems",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TradeAssetAssessRequest(BaseModel):
    asset_id: str = Field(..., min_length=1)
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    asset_type: str = "PORT"  # MINE | PORT | FARM | SMELTER | WAREHOUSE
    commodity: str = "GENERAL"
    region_id: Optional[str] = None
    polygon_id: Optional[str] = None
    canopy_loss_pct: float = Field(default=0.0, ge=0.0, le=100.0)
    use_live_feed: bool = True


class TradeRouteAssessRequest(BaseModel):
    waypoints: List[TradeAssetAssessRequest] = Field(..., min_length=1)
    use_live_feed: bool = True


class EudrAuditRequest(BaseModel):
    region_id: str = Field(..., min_length=1)
    polygon_id: str = Field(..., min_length=1)
    canopy_loss_pct: float = Field(..., ge=0.0, le=100.0)


class CreateBillingSessionRequest(BaseModel):
    plan_id: str
    chain: str  # "Arbitrum One" or "Solana Mainnet"
    payer_wallet: Optional[str] = None


class VerifyBillingPaymentRequest(BaseModel):
    session_id: str
    payer_wallet: str
    tx_hash: Optional[str] = None


@app.get("/")
def service_root():
    return {
        "system": "Trade-Enabling Climate & Compliance Oracle Subsystem",
        "subsystem": TradeClimateOracle.SUBSYSTEM_ID,
        "schema_version": UNIFIED_TRADE_HAZARD_SCHEMA["schema_version"],
        "status": "OPERATIONAL",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {
        "status": "OK",
        "circuit_breaker_active": security_gate.circuit_breaker_active,
    }


# --- Trade-Enabling Climate & Compliance Oracle Endpoints ---
@app.get("/api/trade-oracle/schema")
def get_trade_oracle_schema():
    """Returns unified Trade Hazard Oracle schema shared with sibling seismic subsystem"""
    return UNIFIED_TRADE_HAZARD_SCHEMA


@app.get("/api/trade-oracle/presets")
def get_trade_oracle_presets():
    """Returns global Minerals Oracle mines, maritime corridors, and EUDR export presets"""
    return {"presets": TRADE_HUB_PRESETS}


@app.post("/api/trade-oracle/assess")
def assess_trade_asset(req: TradeAssetAssessRequest):
    """Evaluates physical climate disruption, BFT consensus, and EUDR compliance for a trade asset"""
    return trade_oracle.assess_asset(
        asset_id=req.asset_id,
        lat=req.lat,
        lng=req.lng,
        asset_type=req.asset_type,
        commodity=req.commodity,
        region_id=req.region_id,
        polygon_id=req.polygon_id,
        canopy_loss_pct=req.canopy_loss_pct,
        use_live_feed=req.use_live_feed,
    )


@app.post("/api/trade-oracle/assess-route")
def assess_trade_route(req: TradeRouteAssessRequest):
    """Evaluates an end-to-end multi-waypoint supply chain route (e.g., Mine -> Port -> Port)"""
    return trade_oracle.assess_route(
        waypoints=[wp.model_dump() for wp in req.waypoints],
        use_live_feed=req.use_live_feed,
    )


# --- Security Gate & EUDR Compliance Endpoints ---
@app.get("/api/security-gate/status")
def get_security_gate_status():
    """Returns real-time Security Gate telemetry, audit log, and circuit breaker state"""
    return security_gate.get_security_status()


@app.post("/api/security-gate/trip-circuit-breaker")
def trip_circuit_breaker(reason: Optional[str] = "Manual Operator Emergency Kill-Switch"):
    """Emergency kill-switch to freeze automated oracle approvals"""
    security_gate.trip_circuit_breaker(reason)
    return {"status": "CIRCUIT_BREAKER_TRIPPED", "gate": security_gate.get_security_status()}


@app.post("/api/security-gate/reset-circuit-breaker")
def reset_circuit_breaker():
    """Restores system to operational status after operator review"""
    security_gate.reset_circuit_breaker()
    return {"status": "CIRCUIT_BREAKER_RESET", "gate": security_gate.get_security_status()}


@app.post("/api/security/eudr/audit")
def audit_eudr_polygon(req: EudrAuditRequest):
    """Audits farm polygon for EUDR deforestation-free compliance"""
    passed, risk, verdict = security_gate.audit_eudr_compliance(
        region_id=req.region_id,
        farm_polygon_id=req.polygon_id,
        canopy_cover_loss_pct=req.canopy_loss_pct,
    )
    return {
        "is_compliant": passed,
        "risk_score": risk,
        "verdict": verdict,
        "gate_status": security_gate.get_security_status(),
    }


# --- Multi-Chain USDC Billing & Subscription Gateway Endpoints ---
@app.get("/api/billing/catalog")
def get_billing_catalog():
    """Returns the full multi-chain USDC billing catalog, treasury balances, and active subscription"""
    return usdc_billing_engine.get_catalog()


@app.post("/api/billing/session")
def create_billing_session(req: CreateBillingSessionRequest):
    """Creates a payment invoice session with EIP-712 or Solana Pay URI"""
    return usdc_billing_engine.create_payment_session(
        plan_id=req.plan_id,
        chain=req.chain,
        payer_wallet=req.payer_wallet,
    )


@app.post("/api/billing/verify")
def verify_billing_payment(req: VerifyBillingPaymentRequest):
    """Verifies onchain USDC transfer and activates license"""
    return usdc_billing_engine.verify_and_activate(
        session_id=req.session_id,
        payer_wallet=req.payer_wallet,
        tx_hash=req.tx_hash,
    )


if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
