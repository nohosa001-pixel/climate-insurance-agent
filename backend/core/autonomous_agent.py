"""
Autonomous Climate-Agri Insurance & CBOT Quant Orchestrator Agent
Orchestrates:
1. Ingestion of Global Climate Satellites (NOAA, ECMWF, NASA SMAP)
2. ML Yield Anomaly & EDD Heat Stress Inference
3. Dual Monetization Execution:
   - Module A: CBOT Grain Futures Quant Rebalancing (Alpha long/short)
   - Module B: Parametric Climate Smart Contract Oracle Payout Execution
4. Real-time CoT (Chain of Thought) Decision Log Generation
"""

import uuid
import datetime
import time
import numpy as np
from typing import Dict, List, Any, Optional

from core.models import RegionClimateTelemetry, MarketData, AgentActionLog
from core.climate_satellite import ClimateSatelliteIngestionEngine, GLOBAL_BREADBASKETS
from core.ml_yield_engine import AgriMLYieldEngine
from core.cbot_quant_engine import CBOTQuantEngine
from core.parametric_insurance import ParametricClimateInsuranceEngine
from core.security_gate import AutonomousSecurityGate
from core.eliza_brain import ElizaClimateBrain
from core.crosschain_bridge import CrossChainHedgingBridge

class AutonomousClimateAgent:
    def __init__(self):
        self.satellite_engine = ClimateSatelliteIngestionEngine()
        self.yield_engine = AgriMLYieldEngine()
        self.quant_engine = CBOTQuantEngine(initial_capital_usd=25_000_000.0)
        self.insurance_engine = ParametricClimateInsuranceEngine(initial_vault_usd=10_000_000.0)
        
        # Next-Gen Enterprise Layers
        self.security_gate = AutonomousSecurityGate()
        self.eliza_brain = ElizaClimateBrain()
        self.crosschain_bridge = CrossChainHedgingBridge()

        # Simulation shock scenario overrides {region_id: shock_level (0.0 to 1.0)}
        self.shock_overrides = {
            "US_MIDWEST": 0.75,         # Seed with active severe heat/drought shock in Iowa/Midwest
            "BRAZIL_MATO_GROSSO": 0.40, # Moderate heatwave
            "ARGENTINA_PAMPAS": 0.15,
            "BLACK_SEA_REGION": 0.10
        }

        self.action_logs: List[Dict[str, Any]] = []
        self.cycle_count = 0
        self.is_auto_running = True

        # Run initial cycle
        self.run_orchestration_cycle()

    def run_orchestration_cycle(self) -> Dict[str, Any]:
        """
        Executes one full autonomous cycle across the dual monetization pipeline:
        Observation -> ML Inference -> Quant Alpha -> Parametric Payout -> Verification
        """
        self.cycle_count += 1
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Step 1: Ingest Satellite & Soil Telemetry
        satellite_data = self.satellite_engine.fetch_all_regions_telemetry(self.shock_overrides)
        regions_raw = satellite_data["regions"]

        # Convert to standardized RegionClimateTelemetry
        telemetry_map: Dict[str, RegionClimateTelemetry] = {}
        for region_id, raw in regions_raw.items():
            primary_crop = "CORN" if region_id in ["US_MIDWEST", "BRAZIL_MATO_GROSSO"] else ("SOYBEAN" if region_id == "ARGENTINA_PAMPAS" else "WHEAT")
            growth_stage = "SILKING" if region_id in ["US_MIDWEST", "BRAZIL_MATO_GROSSO"] else "FILLING"
            
            # Cumulative EDD proxy from raw telemetry
            daily_edd = raw.get("edd_heat_stress", 0.0)
            heat_days = raw.get("consecutive_heat_days", 0)
            cumulative_edd = round(daily_edd * (10.0 + heat_days * 1.5), 1)

            t = RegionClimateTelemetry(
                region_id=region_id,
                region_name=raw["region_name"],
                crop_type=primary_crop,
                current_growth_stage=growth_stage,
                soil_moisture_pct=raw["smap_soil_moisture_pct"],
                consecutive_dry_days=raw["dry_spell_days"],
                cumulative_edd=cumulative_edd,
                spei_drought_index=raw["spei_drought_index"],
                noaa_temp_max_c=raw["noaa_temp_max_c"],
                noaa_temp_min_c=raw["noaa_temp_min_c"],
                noaa_precip_daily_mm=raw["noaa_precip_daily_mm"],
                modis_ndvi=raw["modis_ndvi"],
                vhi_index=raw["vhi_index"],
                consecutive_heat_days=heat_days,
                timestamp=now_str
            )
            telemetry_map[region_id] = t

        # Step 1.5: Security Gate - BFT Oracle Consensus Verification
        oracle_verdict_map = {}
        analogs_map = {}
        for r_id, t in telemetry_map.items():
            # Create synthetic independent 3-node oracle readings for testing BFT consensus
            sim_nodes = [
                {"node": "NASA_SMAP_L4", "soil_moisture_pct": t.soil_moisture_pct},
                {"node": "ECMWF_ERA5_LAND", "soil_moisture_pct": round(t.soil_moisture_pct + np.random.uniform(-1.2, 1.2), 1)},
                {"node": "GROUND_AWS_STATION", "soil_moisture_pct": round(t.soil_moisture_pct + np.random.uniform(-1.8, 1.8), 1)}
            ]
            passed, risk, verdict = self.security_gate.verify_oracle_consensus(r_id, sim_nodes)
            oracle_verdict_map[r_id] = {"passed": passed, "risk": risk, "verdict": verdict}

            # Eliza Brain: Recall historical climate disaster analogs from 20-year memory
            analogs = self.eliza_brain.recall_historical_analogs(
                t.soil_moisture_pct,
                t.cumulative_edd,
                t.spei_drought_index,
                top_k=2
            )
            analogs_map[r_id] = analogs

        # Step 2: ML Yield Anomaly Prediction (With Eliza Brain Meta-Learned Bias Correction)
        ml_results = self.yield_engine.evaluate_all_crops(satellite_data)
        global_shocks = ml_results["global_crop_shocks"]

        # Step 3: Module A - CBOT Futures Quant Rebalance with Security Gate Audit
        raw_trade_actions = self.quant_engine.execute_quant_rebalance(global_shocks)
        approved_trades = []
        for trade in raw_trade_actions:
            # Audit trade through Pre-Execution Sandbox & Anti-MEV Gate
            ok, risk_score, audit_verdict = self.security_gate.audit_quant_order(
                ticker=trade["ticker"],
                side=trade["side"],
                lots=trade["executed_lots"],
                estimated_notional_usd=trade["notional_value_usd"],
                slippage_bps=12
            )
            if ok:
                trade["security_gate_audit"] = audit_verdict
                approved_trades.append(trade)
                # Dispatch Cross-chain CCIP sync message to Solana/Hyperliquid
                self.crosschain_bridge.dispatch_hedge_sync_message(
                    ticker=trade["ticker"],
                    delta_action=f"{trade['side']}_{trade['executed_lots']}L",
                    notional_usd=trade["notional_value_usd"]
                )
            else:
                trade["security_gate_status"] = "BLOCKED_BY_GATE"
                trade["blocked_reason"] = audit_verdict

        # Step 4: Module B - Parametric Climate Insurance Oracle Settlement with Security Gate Audit
        raw_insurance_payouts = self.insurance_engine.evaluate_all_active_policies(telemetry_map)
        approved_payouts = []
        for payout in raw_insurance_payouts:
            # Audit payout claim through Security Gate
            p_id = payout.get("policy_id", "")
            amt = payout.get("payout_amount_usd", 0.0)
            holder = payout.get("holder_name", "")
            trig_count = payout.get("conditions_met_count", 0)

            ok, risk_score, audit_verdict = self.security_gate.audit_parametric_payout(
                policy_id=p_id,
                recipient_name=holder,
                amount_usd=amt,
                triggers_met=trig_count
            )
            if ok:
                payout["security_gate_audit"] = audit_verdict
                approved_payouts.append(payout)
            else:
                payout["security_gate_status"] = "BLOCKED_BY_GATE"
                payout["blocked_reason"] = audit_verdict

        # Step 5: Onchain Finance Ecosystem Tick (Aave compounding & Perp Mark-to-Market)
        self.eliza_brain.tick_onchain_finance(elapsed_seconds=2.5)

        # Step 6: Generate Autonomous Agent CoT Logs
        self._generate_cot_logs(telemetry_map, ml_results, approved_trades, approved_payouts, analogs_map, oracle_verdict_map)

        # Tick market slightly
        self.quant_engine.tick_market_prices()

        return {
            "cycle": self.cycle_count,
            "timestamp": now_str,
            "satellite_data": satellite_data,
            "telemetry_map": {k: v.to_dict() for k, v in telemetry_map.items()},
            "ml_yield": ml_results,
            "cbot_quant": self.quant_engine.get_portfolio_summary(),
            "parametric_insurance": self.insurance_engine.get_vault_metrics(),
            "security_gate": self.security_gate.get_security_status(),
            "crosschain_bridge": self.crosschain_bridge.get_bridge_metrics(),
            "eliza_brain": self.eliza_brain.get_brain_summary(),
            "recent_actions": self.action_logs[:12]
        }

    def _generate_cot_logs(
        self,
        telemetry_map: Dict[str, RegionClimateTelemetry],
        ml_results: Dict[str, Any],
        trade_actions: List[Dict[str, Any]],
        insurance_payouts: List[Dict[str, Any]],
        analogs_map: Dict[str, List[Dict[str, Any]]],
        oracle_verdict_map: Dict[str, Dict[str, Any]]
    ):
        """Generates clear, explainable Chain-of-Thought logs for the operator UI with Security Gate & Eliza Brain context"""
        now_str = datetime.datetime.now().strftime("%H:%M:%S")

        # 1. Check for extreme climate events
        for r_id, t in telemetry_map.items():
            if t.spei_drought_index <= -1.8 or t.soil_moisture_pct <= 18.0 or t.cumulative_edd >= 30.0:
                crop_eval = ml_results["evaluations"].get(f"{r_id}_{t.crop_type}", {})
                dy = crop_eval.get("delta_yield_pct", 0.0)
                analogs = analogs_map.get(r_id, [])
                analog_text = f"Top Analog: {analogs[0]['event_name']} ({analogs[0]['year']}, Match: {analogs[0]['similarity_score_pct']}%) -> {analogs[0]['key_lesson']}" if analogs else "No direct analog match"
                sec_v = oracle_verdict_map.get(r_id, {}).get("verdict", "BFT Verified")

                log = AgentActionLog(
                    id=str(uuid.uuid4())[:8],
                    timestamp=now_str,
                    region_id=r_id,
                    event_type="CLIMATE_ANOMALY",
                    severity="CRITICAL" if dy <= -15.0 else "WARNING",
                    thought_chain=(
                        f"[OBSERVATION] {t.region_name} SMAP Soil Moisture={t.soil_moisture_pct}%, "
                        f"Consecutive Dry Days={t.consecutive_dry_days}d, SPEI={t.spei_drought_index:.2f}, "
                        f"Accumulated EDD={t.cumulative_edd}°C-days.\n"
                        f"[SECURITY GATE] {sec_v}\n"
                        f"[ELIZA LONG-TERM MEMORY] {analog_text}\n"
                        f"[DECISION] ML Yield Anomaly estimated at {dy:+.1f}%. Dispatched to dual monetization."
                    ),
                    action_taken=f"BFT Oracle Consensus Validated & Eliza Brain Hedging Triggered for {t.crop_type}",
                    execution_result=f"Security Gate Approved. Crop Yield Anomaly: {dy:+.1f}%. Status: DISPATCHED",
                    details=t.to_dict()
                )
                self.action_logs.insert(0, log.to_dict())

        # 2. Log Quant trades
        for trade in trade_actions:
            sec_audit = trade.get("security_gate_audit", "Approved by Pre-Execution Sandbox")
            log = AgentActionLog(
                id=str(uuid.uuid4())[:8],
                timestamp=now_str,
                region_id="CBOT_EXCHANGE",
                event_type="QUANT_EXECUTION",
                severity="INFO",
                thought_chain=(
                    f"[OBSERVATION] Global {trade['crop']} yield anomaly diverged from USDA WASDE consensus.\n"
                    f"[SECURITY GATE AUDIT] {sec_audit}\n"
                    f"[VALUATION] Computed equilibrium price shift = {trade['alpha_gap_pct']:+.2f}%. "
                    f"Market pricing has not fully factored in satellite soil depletion.\n"
                    f"[EXECUTION] Submitting {trade['side']} order of {trade['executed_lots']} contracts on {trade['ticker']}."
                ),
                action_taken=f"CBOT {trade['side']} {trade['ticker']} x {trade['executed_lots']} Lots @ {trade['fill_price']}¢",
                execution_result=f"Filled. Notional: ${trade['notional_value_usd']:,.2f} | MEV Protected",
                details=trade
            )
            self.action_logs.insert(0, log.to_dict())

        # 3. Log Parametric Insurance settlements
        for p_res in insurance_payouts:
            sec_audit = p_res.get("security_gate_audit", "Verified by Pre-Execution Sandbox")
            log = AgentActionLog(
                id=str(uuid.uuid4())[:8],
                timestamp=now_str,
                region_id=p_res["region_id"],
                event_type="PARAMETRIC_PAYOUT",
                severity="ALERT",
                thought_chain=(
                    f"[SECURITY GATE AUDIT] {sec_audit}\n"
                    f"[ORACLE VERIFICATION] Policy {p_res['policy_id']} for '{p_res['holder_name']}' matched >= 2 parametric triggers.\n"
                    f"[EIP-712 PROOF] {p_res.get('eip712_oracle_proof', p_res.get('oracle_proof', {}))}\n"
                    f"[SMART CONTRACT] Invoking AgriParametricInsuranceV2.sol::submitOracleReportAndQueueSettlement(). Dual-tranche waterfall executed."
                ),
                action_taken=f"Instant Smart Contract Payout of ${p_res['payout_amount_usd']:,.2f} to {p_res['holder_name']}",
                execution_result=f"Tx Hash: {p_res['tx_hash']} | Security Gate: VERIFIED_PAID | Finalized",
                details=p_res
            )
            self.action_logs.insert(0, log.to_dict())

        if len(self.action_logs) > 60:
            self.action_logs = self.action_logs[:60]

    def set_region_shock(self, region_id: str, shock_level: float):
        """Allows interactive UI to inject climate shocks into specific breadbaskets"""
        self.shock_overrides[region_id] = float(np.clip(shock_level, 0.0, 1.0))
        return self.run_orchestration_cycle()

    def set_enso_mode(self, phase: str, oni: float):
        """Allows interactive UI to test El Niño vs La Niña vs Neutral"""
        self.satellite_engine.set_enso_shock(phase, oni)
        return self.run_orchestration_cycle()
