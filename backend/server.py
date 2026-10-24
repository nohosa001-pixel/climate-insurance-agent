"""
FastAPI Server & WebSocket Stream for Autonomous Climate-Agri Insurance & CBOT Quant Platform
"""

import asyncio
import os
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os

from core.autonomous_agent import AutonomousClimateAgent

app = FastAPI(
    title="Autonomous Climate-Agri Insurance & CBOT Quant Platform",
    description="Full-stack AI Agent for Satellite Ingestion, ML Yield Prediction, CBOT Quant Positioning & Parametric Insurance",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Agent Instance
agent = AutonomousClimateAgent()

# Connected WebSocket clients
active_websockets: list[WebSocket] = []

class ShockRequest(BaseModel):
    region_id: str
    shock_level: float # 0.0 to 1.0

class EnsoRequest(BaseModel):
    phase: str # EL_NINO_STRONG, LA_NINA_MODERATE, NEUTRAL
    oni: float

class PolicyResetRequest(BaseModel):
    policy_id: str

class ManualTradeRequest(BaseModel):
    ticker: str # ZC, ZS, ZW
    side: str   # BUY_LONG, SELL_SHORT
    lots: int

class CreatePolicyRequest(BaseModel):
    holder_name: str
    region_id: str
    crop_type: str
    coverage_usd: float
    soil_moisture_trigger: float
    dry_days_trigger: int
    spei_trigger: float
    edd_heat_trigger: float

@app.post("/api/cbot/order")
def manual_cbot_order(req: ManualTradeRequest):
    """Allows user to manually execute CBOT futures orders"""
    spec = agent.quant_engine.contracts.get(req.ticker.upper())
    if not spec:
        return {"error": "Invalid ticker"}
    
    pos = agent.quant_engine.positions.get(req.ticker.upper())
    delta_lots = req.lots if "BUY" in req.side.upper() else -req.lots
    new_lots = pos["lots"] + delta_lots
    
    fill_p = spec["current_price"] + (0.50 if delta_lots > 0 else -0.50)
    pos["lots"] = new_lots
    pos["avg_entry"] = round(fill_p, 2)
    pos["side"] = "LONG" if new_lots > 0 else ("SHORT" if new_lots < 0 else "FLAT")
    
    trade_record = {
        "timestamp": os.path.basename(__file__), # placeholder
        "ticker": req.ticker.upper(),
        "crop": spec["name"].split()[1],
        "side": req.side.upper(),
        "executed_lots": abs(req.lots),
        "new_total_lots": new_lots,
        "fill_price": fill_p,
        "notional_value_usd": abs(req.lots) * spec["unit_size"] * (fill_p / 100.0),
        "trigger_reason": f"Manual Operator Order Desk ({req.side})",
        "alpha_gap_pct": 0.0
    }
    agent.quant_engine.trade_history.insert(0, trade_record)
    agent.quant_engine._update_portfolio_mark_to_market()
    
    return {"status": "ORDER_FILLED", "trade": trade_record, "portfolio": agent.quant_engine.get_portfolio_summary()}

@app.post("/api/policy/create")
def create_custom_policy(req: CreatePolicyRequest):
    """Allows user to issue a new parametric climate insurance smart contract"""
    import uuid
    p_id = f"POL-CUSTOM-{str(uuid.uuid4())[:6].upper()}"
    premium = req.coverage_usd * 0.045 # 4.5%
    
    new_p = {
        "policy_id": p_id,
        "holder_name": req.holder_name,
        "region_id": req.region_id,
        "crop_type": req.crop_type,
        "coverage_usd": req.coverage_usd,
        "premium_usd": premium,
        "soil_moisture_trigger": req.soil_moisture_trigger,
        "dry_days_trigger": req.dry_days_trigger,
        "spei_trigger": req.spei_trigger,
        "edd_heat_trigger": req.edd_heat_trigger,
        "status": "ACTIVE"
    }
    agent.insurance_engine.policies[p_id] = new_p
    agent.insurance_engine.total_underwritten_risk_usd += req.coverage_usd
    agent.insurance_engine.accumulated_premiums_usd += premium
    agent.insurance_engine.vault_liquidity_usd += premium
    
    return {"status": "POLICY_ISSUED", "policy": new_p, "vault": agent.insurance_engine.get_vault_metrics()}

@app.get("/api/state")
def get_system_state():
    """Returns complete snapshot of climate satellite, ML, CBOT quant and parametric insurance states"""
    return agent.run_orchestration_cycle()

@app.post("/api/simulate/shock")
def inject_climate_shock(req: ShockRequest):
    """Allows UI to inject heatwave / drought shocks into specified region"""
    updated_state = agent.set_region_shock(req.region_id, req.shock_level)
    return {
        "status": "SHOCK_APPLIED",
        "region_id": req.region_id,
        "shock_level": req.shock_level,
        "state": updated_state
    }

@app.post("/api/simulate/enso")
def set_enso_climate(req: EnsoRequest):
    """Sets global ENSO phase (El Niño / La Niña / Neutral)"""
    updated_state = agent.set_enso_mode(req.phase, req.oni)
    return {
        "status": "ENSO_UPDATED",
        "phase": req.phase,
        "oni": req.oni,
        "state": updated_state
    }

@app.post("/api/policy/reset")
def reset_policy_endpoint(req: PolicyResetRequest):
    """Resets settled policy back to active for testing"""
    agent.insurance_engine.reset_policy(req.policy_id)
    return {"status": "POLICY_RESET", "policy_id": req.policy_id}

@app.post("/api/agent/trigger-cycle")
def trigger_agent_cycle():
    """Manually triggers one complete orchestration step"""
    state = agent.run_orchestration_cycle()
    return {"status": "CYCLE_COMPLETED", "state": state}

@app.get("/api/security-gate/status")
def get_security_gate_status():
    """Returns real-time Security Gate telemetry, audit log, and circuit breaker state"""
    return agent.security_gate.get_security_status()

@app.post("/api/security-gate/trip-circuit-breaker")
def trip_circuit_breaker(reason: Optional[str] = "Manual Operator Emergency Kill-Switch"):
    """Emergency kill-switch to freeze all automated payouts and trading"""
    agent.security_gate.trip_circuit_breaker(reason)
    return {"status": "CIRCUIT_BREAKER_TRIPPED", "gate": agent.security_gate.get_security_status()}

@app.post("/api/security-gate/reset-circuit-breaker")
def reset_circuit_breaker():
    """Restores system to operational status after operator review"""
    agent.security_gate.reset_circuit_breaker()
    return {"status": "CIRCUIT_BREAKER_RESET", "gate": agent.security_gate.get_security_status()}

@app.get("/api/eliza-brain/memories")
def get_eliza_brain_memories():
    """Returns 20-year episodic climate analogs and post-mortem self-correction history"""
    return agent.eliza_brain.get_brain_summary()

@app.get("/api/onchain-finance/vaults")
def get_onchain_finance_vaults():
    """Returns ERC-4626 Lending Yield status, Perp Delta-Hedge positions, and Cat-Bond market"""
    return agent.eliza_brain.onchain_finance

@app.get("/api/cbot/history/{ticker}")
def get_cbot_price_history(ticker: str):
    """Returns candlestick history for ZC, ZS, ZW"""
    series = agent.quant_engine.price_series.get(ticker.upper(), [])
    return {"ticker": ticker.upper(), "series": series}

@app.get("/api/crosschain/bridge")
def get_crosschain_bridge_status():
    """Returns Chainlink CCIP cross-chain hedging bridge state"""
    return agent.crosschain_bridge.get_bridge_metrics()

class MultiSigSignRequest(BaseModel):
    signer_address: str
    sign: bool

@app.post("/api/security/multisig/sign")
def toggle_multisig_signature(req: MultiSigSignRequest):
    """Toggles Gnosis Safe 3/5 multi-sig signature state for demonstration"""
    for s in agent.security_gate.multisig_signers:
        if s.address.lower() in req.signer_address.lower() or req.signer_address.lower() in s.address.lower():
            s.has_signed = req.sign
            break
    return agent.security_gate.get_multisig_status()

class EudrAuditRequest(BaseModel):
    region_id: str
    polygon_id: str
    canopy_loss_pct: float

@app.post("/api/security/eudr/audit")
def audit_eudr_polygon(req: EudrAuditRequest):
    """Audits farm polygon for EUDR deforestation-free compliance"""
    passed, risk, verdict = agent.security_gate.audit_eudr_compliance(
        region_id=req.region_id,
        farm_polygon_id=req.polygon_id,
        canopy_cover_loss_pct=req.canopy_loss_pct
    )
    return {
        "is_compliant": passed,
        "risk_score": risk,
        "verdict": verdict,
        "gate_status": agent.security_gate.get_security_status()
    }

@app.get("/api/contracts/source/{contract_name}")
def get_contract_source(contract_name: str):
    """Returns Solidity contract code for verification"""
    contract_dir = os.path.join(base_dir, "backend", "contracts")
    target_file = os.path.join(contract_dir, f"{contract_name}.sol")
    if os.path.exists(target_file):
        with open(target_file, "r", encoding="utf-8") as f:
            return {"name": f"{contract_name}.sol", "code": f.read()}
    return {"error": "Contract not found"}

# --- Multi-Chain USDC Billing & Subscription Gateway Endpoints ---
from core.usdc_billing_engine import usdc_billing_engine

class CreateBillingSessionRequest(BaseModel):
    plan_id: str
    chain: str # "Arbitrum One" or "Solana Mainnet"
    payer_wallet: Optional[str] = None

class VerifyBillingPaymentRequest(BaseModel):
    session_id: str
    payer_wallet: str
    tx_hash: Optional[str] = None

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
        payer_wallet=req.payer_wallet
    )

@app.post("/api/billing/verify")
def verify_billing_payment(req: VerifyBillingPaymentRequest):
    """Verifies onchain USDC transfer and activates license"""
    return usdc_billing_engine.verify_and_activate(
        session_id=req.session_id,
        payer_wallet=req.payer_wallet,
        tx_hash=req.tx_hash
    )

# Path to frontend dist
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dist_path = os.path.join(base_dir, "frontend", "dist")
assets_path = os.path.join(dist_path, "assets")

if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

@app.get("/favicon.svg")
@app.get("/favicon.ico")
def serve_favicon():
    fav = os.path.join(dist_path, "favicon.svg")
    if os.path.exists(fav):
        return FileResponse(fav)
    return FileResponse(os.path.join(dist_path, "index.html"))

@app.get("/icons.svg")
def serve_icons():
    icons = os.path.join(dist_path, "icons.svg")
    if os.path.exists(icons):
        return FileResponse(icons)
    return FileResponse(os.path.join(dist_path, "index.html"))

@app.get("/")
def serve_index():
    index_file = os.path.join(dist_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "system": "Autonomous Climate-Agri Insurance & CBOT Quant Platform",
        "status": "OPERATIONAL",
        "enso_phase": agent.satellite_engine.enso_phase,
        "active_cycles": agent.cycle_count
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    try:
        while True:
            # Broadcast state every 2.5 seconds
            state = agent.run_orchestration_cycle()
            await websocket.send_json(state)
            await asyncio.sleep(2.5)
    except WebSocketDisconnect:
        active_websockets.remove(websocket)
    except Exception:
        if websocket in active_websockets:
            active_websockets.remove(websocket)

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
