"""
AgriPulse AI Autonomous Climate-Agri Insurance & CBOT Quant Terminal Demo
Executes simulated global climate shock scenarios and prints complete telemetry,
ML predictions, CBOT quant trades and Parametric Insurance payout receipts.
"""

import sys
import os
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.models import RegionClimateTelemetry, MarketData
from core.climate_satellite import ClimateSatelliteIngestionEngine
from core.ml_yield_engine import AgriMLYieldEngine
from core.cbot_quant_engine import CBOTQuantEngine
from core.parametric_insurance import ParametricClimateInsuranceEngine
from core.autonomous_agent import AutonomousClimateAgent

def run_full_simulation():
    print("=" * 90)
    print(" 🛰️ [AGRIPULSE AI] Global Climate Satellite & CBOT Quant Dual Monetization Agent")
    print("=" * 90)

    agent = AutonomousClimateAgent()

    # Scenario 1: Severe Midwest Iowa Mega Drought Injection
    print("\n" + "─" * 90)
    print(" [SCENARIO 1] 🌽 US Corn Belt (Iowa) Extreme Drought & Heatwave Injection")
    print("─" * 90)
    
    agent.set_enso_mode("EL_NINO_STRONG", 1.8)
    state = agent.set_region_shock("US_MIDWEST", 0.85)

    tel = state["telemetry_map"]["US_MIDWEST"]
    print(f"📍 Region: {tel['region_name']} | Crop: {tel['crop_type']} ({tel['current_growth_stage']})")
    print(f"📡 Ingested Telemetry: Soil Moisture: {tel['soil_moisture_pct']}% | SPEI: {tel['spei_drought_index']} | EDD: {tel['cumulative_edd']}°C-days | Dry Days: {tel['consecutive_dry_days']}d")

    crop_eval = state["ml_yield"]["evaluations"]["US_MIDWEST_CORN"]
    print(f"📉 ML Predicted Yield: {crop_eval['predicted_yield']} {crop_eval['yield_unit']} (Baseline: {crop_eval['baseline_yield']})")
    print(f"⚠️ Yield Anomaly (Delta Y): {crop_eval['delta_yield_pct']}% | Damage Ratio: {crop_eval['crop_damage_ratio_pct']}% | VaR 95%: {crop_eval['monte_carlo_metrics']['var_95_delta_pct']}%")

    print("\n[MODULE A: CBOT Quant Futures Hedging]")
    cbot_corn = state["cbot_quant"]["positions"]["ZC"]
    print(f"  • Corn (ZC) Position: {cbot_corn['side']} {cbot_corn['lots']} Lots @ {cbot_corn['avg_entry']}¢ | Target: {cbot_corn['target_price']}¢")
    print(f"  • Portfolio Equity: ${state['cbot_quant']['portfolio_equity_usd']:,.2f} | Margin Used: ${state['cbot_quant']['used_margin_usd']:,.2f} ({state['cbot_quant']['margin_utilization_pct']}%)")

    print("\n[MODULE B: Parametric Smart Contract Auto-Payout]")
    payouts = state["parametric_insurance"]["recent_payouts"]
    for p in payouts:
        print(f"  • Policy: {p['policy_id']} ({p['holder_name']})")
        print(f"  • Status: {p['policy_status']} | Payout: ${p['payout_amount_usd']:,.2f} USDC")
        print(f"  • Smart Contract TxHash: {p['tx_hash']}")

    print("\n[AUTONOMOUS AGENT CHAIN-OF-THOUGHT LOGS]")
    for log in state["recent_actions"][:3]:
        print(f"\n  [{log['timestamp']}] {log['event_type']} ({log['severity']}):")
        print(f"   {log['thought_chain'].replace(chr(10), ' ')}")
        print(f"   ➔ Action: {log['action_taken']}")
        print(f"   ✔ Result: {log['execution_result']}")

    print("\n" + "=" * 90)
    print(" ✅ Complete End-to-End Dual Monetization Pipeline Successfully Executed!")
    print("=" * 90)

if __name__ == "__main__":
    run_full_simulation()
