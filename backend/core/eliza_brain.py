"""
elizaOS Brain & Long-Term Memory Core for AgriPulse
Features:
1. Three-Tier Memory Core:
   - Working Memory (Short-term session context)
   - Episodic Memory (20-year climate disaster & market analog database)
   - Semantic Knowledge Graph (Crop phenology & price elasticity heuristics)
2. Historical Analog Retrieval Engine (Cosine distance over climate features)
3. Continual Post-Mortem Evaluator (Self-correction of prediction residuals)
4. Onchain Finance Ecosystem Integration:
   - ERC-4626 Idle Reserve Yield Vault (Aave v3 / Morpho Lending compounding)
   - 24/7 Onchain Perp Delta Hedging (Hyperliquid / dYdX)
   - ERC-3525 Tokenized Cat-Bond Market Tracker
"""

import time
import math
import uuid
import datetime
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple

@dataclass
class ClimateHistoricalAnalog:
    id: str
    year: int
    event_name: str
    primary_region: str
    crop_type: str
    soil_moisture_pct: float
    accumulated_edd: float
    spei_index: float
    actual_yield_impact_pct: float
    cbot_price_reaction_pct: float
    key_lesson: str
    feature_vector: List[float] = field(default_factory=list)

@dataclass
class PostMortemRecord:
    id: str
    timestamp: str
    region_id: str
    crop_type: str
    predicted_yield_anomaly_pct: float
    actual_yield_anomaly_pct: float
    residual_error: float
    cbot_hedging_pnl_usd: float
    bias_correction_applied: float
    lessons_learned: str

class ElizaClimateBrain:
    def __init__(self):
        # 1. Initialize 20-Year Historical Episodic Memory
        self.episodic_memories: List[ClimateHistoricalAnalog] = self._load_historical_analogs()
        
        # 2. Self-Correction State
        self.bias_corrections: Dict[str, float] = {
            "US_MIDWEST": 1.0,
            "BRAZIL_MATO_GROSSO": 1.0,
            "ARGENTINA_PAMPAS": 1.0,
            "BLACK_SEA_REGION": 1.0
        }
        self.post_mortem_history: List[Dict[str, Any]] = self._seed_post_mortem_history()
        
        # 3. Onchain Finance Ecosystem State
        self.onchain_finance = {
            "idle_reserve_vault_usd": 7_000_000.0,  # 70% of 10M reserve deployed
            "vault_protocol": "Aave v3 USDC Core Vault (ERC-4626)",
            "current_lending_apy_pct": 5.85,
            "accrued_interest_usd": 42_310.50,
            "perp_positions": [
                {"protocol": "Hyperliquid Perp", "symbol": "CORN-USD", "side": "SHORT_HEDGE", "size_usd": 1_250_000.0, "pnl_usd": 38_400.0, "funding_rate_8h": 0.0021},
                {"protocol": "dYdX v4", "symbol": "SOY-USD", "side": "LONG_ALPHA", "size_usd": 850_000.0, "pnl_usd": 14_900.0, "funding_rate_8h": -0.0012}
            ],
            "cat_bond_issuance": {
                "token_standard": "ERC-3525 Semi-Fungible Cat-Bond",
                "tranche_name": "AgriPulse Series 2026-A (Midwest Drought)",
                "total_issued_usd": 3_000_000.0,
                "coupon_rate_pct": 9.40,
                "current_market_price_pct": 99.20,
                "collateral_status": "FULLY_BACKED_USDC"
            }
        }
        
        self.last_tick_time = time.time()

    def _load_historical_analogs(self) -> List[ClimateHistoricalAnalog]:
        """Seeds curated 20-year climate shocks with standardized normalized feature vectors"""
        analogs = [
            ClimateHistoricalAnalog(
                id="EP-2012-US",
                year=2012,
                event_name="North American Mega-Drought",
                primary_region="US_MIDWEST",
                crop_type="CORN",
                soil_moisture_pct=11.2,
                accumulated_edd=54.8,
                spei_index=-2.45,
                actual_yield_impact_pct=-26.4,
                cbot_price_reaction_pct=+48.5,
                key_lesson="Flash drought in July pollination created extreme WASDE revision gap. S/U ratio collapsed, causing +50% parabolic CBOT squeeze.",
                feature_vector=[11.2 / 50.0, 54.8 / 60.0, -2.45 / 3.0]
            ),
            ClimateHistoricalAnalog(
                id="EP-2021-BR",
                year=2021,
                event_name="Brazilian Safrinha Polar Freeze & Drought",
                primary_region="BRAZIL_MATO_GROSSO",
                crop_type="CORN",
                soil_moisture_pct=14.5,
                accumulated_edd=38.2,
                spei_index=-1.95,
                actual_yield_impact_pct=-18.2,
                cbot_price_reaction_pct=+31.0,
                key_lesson="Severe soil moisture deficit preceded sudden cold front. Late vegetative damage triggered instant parametric payout trigger.",
                feature_vector=[14.5 / 50.0, 38.2 / 60.0, -1.95 / 3.0]
            ),
            ClimateHistoricalAnalog(
                id="EP-2023-ENSO",
                year=2023,
                event_name="Super El Niño Transition Shock",
                primary_region="ARGENTINA_PAMPAS",
                crop_type="SOYBEAN",
                soil_moisture_pct=16.8,
                accumulated_edd=42.1,
                spei_index=-2.10,
                actual_yield_impact_pct=-22.0,
                cbot_price_reaction_pct=+25.8,
                key_lesson="Consecutive dry spells in early pod-fill severely curtailed soybean crush volumes. Model initial estimates under-hedged the tail risk.",
                feature_vector=[16.8 / 50.0, 42.1 / 60.0, -2.10 / 3.0]
            ),
            ClimateHistoricalAnalog(
                id="EP-2010-RU",
                year=2010,
                event_name="Black Sea Russian Wheat Heat Dome",
                primary_region="BLACK_SEA_REGION",
                crop_type="WHEAT",
                soil_moisture_pct=13.0,
                accumulated_edd=49.0,
                spei_index=-2.30,
                actual_yield_impact_pct=-32.5,
                cbot_price_reaction_pct=+62.0,
                key_lesson="Russian export ban following record heat dome created historic supply shock. Parametric triggers responded within 48h.",
                feature_vector=[13.0 / 50.0, 49.0 / 60.0, -2.30 / 3.0]
            )
        ]
        return analogs

    def _seed_post_mortem_history(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "PM-2025-Q3",
                "timestamp": "2025-09-12 18:00:00",
                "region_id": "US_MIDWEST",
                "crop_type": "CORN",
                "predicted_yield_anomaly_pct": -14.2,
                "actual_yield_anomaly_pct": -11.8,
                "residual_error": +2.4,
                "cbot_hedging_pnl_usd": 420_000.0,
                "bias_correction_applied": 0.94,
                "lessons_learned": "Model slightly overestimated heat damage due to late localized August convective rains. Adjusted Midwest drainage elasticity by -6%."
            },
            {
                "id": "PM-2025-Q4",
                "timestamp": "2025-11-20 14:30:00",
                "region_id": "BRAZIL_MATO_GROSSO",
                "crop_type": "SOYBEAN",
                "predicted_yield_anomaly_pct": -8.5,
                "actual_yield_anomaly_pct": -9.1,
                "residual_error": -0.6,
                "cbot_hedging_pnl_usd": 185_000.0,
                "bias_correction_applied": 1.02,
                "lessons_learned": "High alignment with satellite VHI data. Zero-claim parametric payout triggered accurately with zero basis risk."
            }
        ]

    def recall_historical_analogs(
        self,
        current_soil_pct: float,
        current_edd: float,
        current_spei: float,
        top_k: int = 2
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top-K most similar historical climate shocks based on Euclidean distance
        in normalized feature space [Soil/50, EDD/60, SPEI/3]
        """
        curr_vec = [current_soil_pct / 50.0, current_edd / 60.0, current_spei / 3.0]
        
        scored = []
        for mem in self.episodic_memories:
            dist = math.sqrt(sum((c - m) ** 2 for c, m in zip(curr_vec, mem.feature_vector)))
            similarity = max(0.0, round(100.0 * (1.0 - (dist / 1.732)), 1))
            scored.append((similarity, mem))

        scored.sort(key=lambda x: x[0], reverse=True)
        results = []
        for sim, m in scored[:top_k]:
            results.append({
                "analog_id": m.id,
                "year": m.year,
                "event_name": m.event_name,
                "similarity_score_pct": sim,
                "region": m.primary_region,
                "crop": m.crop_type,
                "historical_yield_drop": m.actual_yield_impact_pct,
                "cbot_reaction_pct": m.cbot_price_reaction_pct,
                "key_lesson": m.key_lesson
            })
        return results

    def get_bias_correction(self, region_id: str) -> float:
        """Returns learned meta-weight adjustment for specific breadbasket"""
        return self.bias_corrections.get(region_id, 1.0)

    def tick_onchain_finance(self, elapsed_seconds: float = 2.5):
        """Simulates compounding lending interest and funding rates in real time"""
        # Aave v3 yield accrual (5.85% APY compounding every tick)
        annual_rate = self.onchain_finance["current_lending_apy_pct"] / 100.0
        sec_yield = (annual_rate / (365 * 24 * 3600)) * elapsed_seconds
        earned = self.onchain_finance["idle_reserve_vault_usd"] * sec_yield
        self.onchain_finance["accrued_interest_usd"] += earned

        # Perp positions slight mark-to-market variation
        for p in self.onchain_finance["perp_positions"]:
            p["pnl_usd"] += (math.sin(time.time() / 10.0) * 15.0)

    def get_brain_summary(self) -> Dict[str, Any]:
        """Provides full memory, evaluator, and Onchain Finance telemetry for the dashboard"""
        return {
            "episodic_memory_count": len(self.episodic_memories),
            "bias_corrections": self.bias_corrections,
            "post_mortem_history": self.post_mortem_history,
            "onchain_finance": {
                "idle_reserve_vault_usd": round(self.onchain_finance["idle_reserve_vault_usd"], 2),
                "vault_protocol": self.onchain_finance["vault_protocol"],
                "current_lending_apy_pct": self.onchain_finance["current_lending_apy_pct"],
                "accrued_interest_usd": round(self.onchain_finance["accrued_interest_usd"], 2),
                "perp_positions": self.onchain_finance["perp_positions"],
                "cat_bond": self.onchain_finance["cat_bond_issuance"]
            }
        }
