import dataclasses
from datetime import datetime
from typing import Dict, List, Optional, Any
import numpy as np

# =====================================================================
# 1. 기후 및 시장 데이터 모델
# =====================================================================
@dataclasses.dataclass
class RegionClimateTelemetry:
    region_id: str            # "US_MIDWEST", "BRAZIL_MATO_GROSSO", "ARGENTINA_PAMPAS", "BLACK_SEA_REGION"
    region_name: str          # "US Corn Belt (Iowa/Illinois)", etc.
    crop_type: str            # "CORN", "SOYBEAN", "WHEAT"
    current_growth_stage: str # "SILKING" (개화기), "FILLING" (등숙기), "VEGETATIVE", "HARVEST"
    soil_moisture_pct: float  # 토양 유효 수분율 (%)
    consecutive_dry_days: int # 연속 무강우 일수 (일)
    cumulative_edd: float     # 누적 극단고온일수 (EDD, 30도 초과 누적치)
    spei_drought_index: float # 가뭄지수 (-3: 극심한 가뭄 ~ +3: 극심한 습윤)
    noaa_temp_max_c: float    # 최고 기온 (°C)
    noaa_temp_min_c: float    # 최저 기온 (°C)
    noaa_precip_daily_mm: float # 일 강수량 (mm)
    modis_ndvi: float         # 위성 식생 지수 (0.0 ~ 1.0)
    vhi_index: float          # Vegetation Health Index (0 ~ 100)
    consecutive_heat_days: int # 35°C 초과 연속 폭염일수
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return dataclasses.asdict(self)

@dataclasses.dataclass
class MarketData:
    cbot_symbol: str          # "ZC" (옥수수), "ZS" (대두), "ZW" (밀)
    crop_name: str            # "Corn", "Soybeans", "Wheat"
    current_price_cents_bu: float # 센트/부셸 (예: 448.5 cents/bu)
    implied_volatility: float     # 내재변동성 (0.24)
    contract_multiplier: float    # 1계약 = 5,000 부셸
    stock_to_use_ratio: float     # 글로벌 재고율 (S/U, e.g., 0.125 for Corn, 0.082 for Soy)
    wasde_consensus_yield: float  # USDA 공식 예측 수확량
    initial_margin_usd: float     # 계약당 증거금

    def to_dict(self) -> Dict[str, Any]:
        return dataclasses.asdict(self)

@dataclasses.dataclass
class AgentActionLog:
    id: str
    timestamp: str
    region_id: str
    event_type: str # "CLIMATE_ANOMALY", "ML_YIELD_SHOCK", "QUANT_EXECUTION", "PARAMETRIC_PAYOUT", "ORACLE_HEARTBEAT"
    severity: str   # "INFO", "WARNING", "ALERT", "CRITICAL"
    thought_chain: str
    action_taken: str
    execution_result: str
    details: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return dataclasses.asdict(self)
