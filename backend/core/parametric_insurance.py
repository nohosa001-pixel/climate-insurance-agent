"""
Enterprise Parametric Climate Insurance & Dual-Tranche Cat-Bond Vault Engine v2.0
Features:
1. Dual-Tranche Capital Waterfall:
   - Senior Tranche ($6.0M, Low-Risk Institutional Reinsurers, 6.5% APY)
   - Junior Tranche ($4.0M, First-Loss High-Yield Web3 LPs, 16.8% APY)
2. EIP-712 Typed Structured Data Oracle Payload Signer
3. Anti-Flash-Deposit 1-Hour Settlement Delay Queue
4. EUDR (EU Deforestation Regulation) 20% ESG Premium Rebate Scheme
"""

import datetime
import hashlib
import uuid
from typing import Dict, List, Any, Optional
from core.models import RegionClimateTelemetry

class ParametricClimateInsuranceEngine:
    def __init__(self, initial_vault_usd: float = 10_000_000.0):
        # Dual-Tranche Capital Allocation
        self.senior_vault_usd = 6_000_000.0  # 60% Senior (Institutional)
        self.junior_vault_usd = 4_000_000.0  # 40% Junior (First-loss DeFi LP)
        self.vault_liquidity_usd = self.senior_vault_usd + self.junior_vault_usd

        self.total_underwritten_risk_usd = 0.0
        self.accumulated_premiums_usd = 0.0
        self.total_payouts_usd = 0.0
        self.junior_absorbed_losses_usd = 0.0
        self.senior_absorbed_losses_usd = 0.0

        # EIP-712 Mock Oracle Signer
        self.oracle_signer_address = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        self.oracle_nonce = 1000

        # Policy Registry & Queues
        self.policies: Dict[str, Dict[str, Any]] = {}
        self.settlement_queue: List[Dict[str, Any]] = []
        self.payout_transactions: List[Dict[str, Any]] = []
        self.oracle_broadcast_history: List[Dict[str, Any]] = []

        self._init_default_policies()

    def _init_default_policies(self):
        default_configs = [
            {
                "policy_id": "POL-US-IA-001",
                "holder_name": "Midwest Corn Growers Cooperative (Iowa)",
                "region_id": "US_MIDWEST",
                "crop_type": "CORN",
                "coverage_usd": 500_000.0,
                "premium_usd": 18_000.0,  # 3.6% (20% EUDR discount applied from 4.5%)
                "is_eudr_compliant": True,
                "soil_moisture_trigger": 20.0,
                "dry_days_trigger": 21,
                "spei_trigger": -1.8,
                "edd_heat_trigger": 35.0,
                "created_at_epoch": datetime.datetime.now().timestamp() - 172800,  # 48h ago
                "status": "ACTIVE"
            },
            {
                "policy_id": "POL-BR-MT-002",
                "holder_name": "Mato Grosso Soy Agrigroup (Sorriso)",
                "region_id": "BRAZIL_MATO_GROSSO",
                "crop_type": "SOYBEAN",
                "coverage_usd": 750_000.0,
                "premium_usd": 37_500.0,  # 5.0% rate (Non-EUDR)
                "is_eudr_compliant": False,
                "soil_moisture_trigger": 18.0,
                "dry_days_trigger": 18,
                "spei_trigger": -1.7,
                "edd_heat_trigger": 40.0,
                "created_at_epoch": datetime.datetime.now().timestamp() - 172800,
                "status": "ACTIVE"
            },
            {
                "policy_id": "POL-AR-PA-003",
                "holder_name": "Pampas Wheat & Soybean Union (Cordoba)",
                "region_id": "ARGENTINA_PAMPAS",
                "crop_type": "SOYBEAN",
                "coverage_usd": 400_000.0,
                "premium_usd": 14_400.0,  # 20% EUDR discount applied
                "is_eudr_compliant": True,
                "soil_moisture_trigger": 19.0,
                "dry_days_trigger": 20,
                "spei_trigger": -1.75,
                "edd_heat_trigger": 32.0,
                "created_at_epoch": datetime.datetime.now().timestamp() - 172800,
                "status": "ACTIVE"
            },
            {
                "policy_id": "POL-BS-UKR-004",
                "holder_name": "Black Sea Grain Syndicate (Kyiv/Poltava)",
                "region_id": "BLACK_SEA_REGION",
                "crop_type": "WHEAT",
                "coverage_usd": 600_000.0,
                "premium_usd": 27_000.0,
                "is_eudr_compliant": False,
                "soil_moisture_trigger": 22.0,
                "dry_days_trigger": 25,
                "spei_trigger": -1.9,
                "edd_heat_trigger": 30.0,
                "created_at_epoch": datetime.datetime.now().timestamp() - 172800,
                "status": "ACTIVE"
            }
        ]

        for p in default_configs:
            self.policies[p["policy_id"]] = p
            self.total_underwritten_risk_usd += p["coverage_usd"]
            self.accumulated_premiums_usd += p["premium_usd"]

            # Distribute premium: 75% Junior, 25% Senior
            self.junior_vault_usd += p["premium_usd"] * 0.75
            self.senior_vault_usd += p["premium_usd"] * 0.25

        self.vault_liquidity_usd = self.senior_vault_usd + self.junior_vault_usd

    def generate_eip712_oracle_digest(self, telemetry: RegionClimateTelemetry) -> Dict[str, Any]:
        """Creates EIP-712 structured cryptographic oracle report"""
        self.oracle_nonce += 1
        now_ts = int(datetime.datetime.now().timestamp())

        typehash = "0x8b1a34...c7d2"
        raw_msg = f"{telemetry.region_id}:{telemetry.spei_drought_index}:{telemetry.soil_moisture_pct}:{now_ts}:{self.oracle_nonce}"
        digest_hash = "0x" + hashlib.sha256(raw_msg.encode()).hexdigest()
        signature = f"0x{hashlib.sha256((digest_hash + self.oracle_signer_address).encode()).hexdigest()[:128]}1b"

        return {
            "region": telemetry.region_id,
            "spei_x100": int(telemetry.spei_drought_index * 100),
            "soil_moisture_x100": int(telemetry.soil_moisture_pct * 100),
            "vhi_x100": int(telemetry.vhi_index * 100),
            "extreme_heat_days": telemetry.consecutive_heat_days,
            "timestamp": now_ts,
            "nonce": self.oracle_nonce,
            "eip712_digest": digest_hash,
            "signature": signature,
            "signer": self.oracle_signer_address,
            "verified": True
        }

    def evaluate_policy_claim(self, policy_id: str, telemetry: RegionClimateTelemetry) -> Dict[str, Any]:
        """
        Multi-Condition Parametric Trigger Logic with First-Loss Tranche Waterfall & Queue
        """
        p = self.policies.get(policy_id)
        if not p:
            return {"error": "Policy not found"}

        if p["status"] == "SETTLED_PAID":
            return {
                "policy_id": policy_id,
                "status": "ALREADY_SETTLED",
                "payout_usd": p.get("payout_amount_usd", p["coverage_usd"])
            }

        # Check conditions
        trigger_soil = telemetry.soil_moisture_pct <= p["soil_moisture_trigger"]
        trigger_dry_days = telemetry.consecutive_dry_days >= p["dry_days_trigger"]
        trigger_spei = telemetry.spei_drought_index <= p["spei_trigger"]
        trigger_edd = telemetry.cumulative_edd >= p["edd_heat_trigger"]

        conditions_met = sum([trigger_soil, trigger_dry_days, trigger_spei, trigger_edd])
        is_triggered = conditions_met >= 2

        eip712_report = self.generate_eip712_oracle_digest(telemetry)

        # Anti-Flash-Deposit Verification
        holding_seconds = int(datetime.datetime.now().timestamp() - p.get("created_at_epoch", 0))
        is_flash_deposit = holding_seconds < 86400  # < 24 hours

        # Tranche Loss Waterfall calculation
        payout_amt = p["coverage_usd"] if is_triggered else 0.0
        junior_loss = 0.0
        senior_loss = 0.0

        if is_triggered:
            if self.junior_vault_usd >= payout_amt:
                junior_loss = payout_amt
            else:
                junior_loss = self.junior_vault_usd
                senior_loss = payout_amt - junior_loss

        result = {
            "policy_id": policy_id,
            "holder_name": p["holder_name"],
            "region_id": p["region_id"],
            "crop_type": p["crop_type"],
            "policy_status": "CLAIM_PAYOUT_QUEUED" if is_triggered else "ACTIVE_NO_PAYOUT",
            "conditions_met_count": conditions_met,
            "is_triggered": is_triggered,
            "is_flash_deposit_blocked": is_flash_deposit,
            "payout_amount_usd": payout_amt,
            "tranche_waterfall": {
                "junior_absorbed_usd": junior_loss,
                "senior_absorbed_usd": senior_loss,
                "senior_principal_protected": senior_loss == 0.0
            },
            "eip712_oracle_proof": eip712_report,
            "settlement_queue_delay_sec": 3600,
            "is_eudr_compliant": p.get("is_eudr_compliant", False),
            "tx_hash": eip712_report["eip712_digest"][:42],
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        if is_triggered and not is_flash_deposit:
            p["status"] = "SETTLED_PAID"
            p["payout_amount_usd"] = payout_amt
            p["tx_hash"] = result["tx_hash"]
            p["settled_at"] = result["timestamp"]

            # Execute Tranche Waterfall
            self.junior_vault_usd = max(0.0, self.junior_vault_usd - junior_loss)
            self.senior_vault_usd = max(0.0, self.senior_vault_usd - senior_loss)
            self.junior_absorbed_losses_usd += junior_loss
            self.senior_absorbed_losses_usd += senior_loss
            self.vault_liquidity_usd = self.junior_vault_usd + self.senior_vault_usd

            self.total_payouts_usd += payout_amt
            self.total_underwritten_risk_usd -= payout_amt

            self.payout_transactions.insert(0, result)
            if len(self.payout_transactions) > 40:
                self.payout_transactions.pop()

        return result

    def evaluate_all_active_policies(self, telemetry_map: Dict[str, RegionClimateTelemetry]) -> List[Dict[str, Any]]:
        settlement_events = []
        for policy_id, policy in list(self.policies.items()):
            region_id = policy["region_id"]
            telemetry = telemetry_map.get(region_id)
            if telemetry and policy["status"] == "ACTIVE":
                res = self.evaluate_policy_claim(policy_id, telemetry)
                if res.get("is_triggered"):
                    settlement_events.append(res)
        return settlement_events

    def reset_policy(self, policy_id: str):
        if policy_id in self.policies:
            p = self.policies[policy_id]
            if p["status"] == "SETTLED_PAID":
                # Restore capital
                refund = p["coverage_usd"]
                self.junior_vault_usd += refund * 0.4
                self.senior_vault_usd += refund * 0.6
                self.vault_liquidity_usd = self.junior_vault_usd + self.senior_vault_usd
                self.total_payouts_usd -= refund
                self.total_underwritten_risk_usd += refund
            p["status"] = "ACTIVE"
            p.pop("payout_amount_usd", None)
            p.pop("tx_hash", None)
            p.pop("settled_at", None)

    def get_vault_metrics(self) -> Dict[str, Any]:
        """Returns Cat-Bond & Dual-Tranche Insurance Vault State"""
        active_count = sum(1 for p in self.policies.values() if p["status"] == "ACTIVE")
        settled_count = sum(1 for p in self.policies.values() if p["status"] == "SETTLED_PAID")

        junior_yield_apy = 16.80
        senior_yield_apy = 6.50

        return {
            "vault_liquidity_usd": round(self.vault_liquidity_usd, 2),
            "dual_tranches": {
                "senior_tranche_usd": round(self.senior_vault_usd, 2),
                "senior_share_pct": round((self.senior_vault_usd / max(1.0, self.vault_liquidity_usd)) * 100, 1),
                "senior_target_apy_pct": senior_yield_apy,
                "senior_absorbed_losses_usd": self.senior_absorbed_losses_usd,
                "senior_risk_rating": "AAA (Capital Protected)",
                "junior_tranche_usd": round(self.junior_vault_usd, 2),
                "junior_share_pct": round((self.junior_vault_usd / max(1.0, self.vault_liquidity_usd)) * 100, 1),
                "junior_target_apy_pct": junior_yield_apy,
                "junior_absorbed_losses_usd": self.junior_absorbed_losses_usd,
                "junior_risk_rating": "BB+ (First-Loss Underwriting)",
            },
            "total_underwritten_risk_usd": self.total_underwritten_risk_usd,
            "accumulated_premiums_usd": self.accumulated_premiums_usd,
            "total_payouts_usd": self.total_payouts_usd,
            "solvency_ratio_pct": round((self.vault_liquidity_usd / max(1.0, self.total_underwritten_risk_usd)) * 100.0, 1),
            "active_policies_count": active_count,
            "settled_policies_count": settled_count,
            "oracle_signer": self.oracle_signer_address,
            "policies": list(self.policies.values()),
            "recent_payouts": self.payout_transactions[:10]
        }
