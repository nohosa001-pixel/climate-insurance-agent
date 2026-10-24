"""
Global Climate & Satellite Ingestion Layer
Ingests and synthesizes global climate satellite data:
- NOAA CPC (Precipitation, GFS Temperature Anomaly)
- ECMWF ERA5 (Atmospheric Reanalysis, Vapor Pressure Deficit, Heatwaves)
- NASA SMAP (Soil Moisture 0-100cm Root Zone Volumetric Water Content)
- ENSO Indices (Oceanic Niño Index ONI, Southern Oscillation Index SOI)
- Satellite Vegetation Indices (MODIS/Sentinel NDVI & Vegetation Health Index VHI)
"""

import numpy as np
import datetime
import math
from typing import Dict, List, Any

# Primary Global Breadbaskets Metadata
GLOBAL_BREADBASKETS = {
    "US_MIDWEST": {
        "id": "US_MIDWEST",
        "name": "US Corn Belt (Midwest)",
        "subregions": ["Iowa", "Illinois", "Nebraska", "Indiana", "Minnesota"],
        "coordinates": {"lat": 41.8781, "lng": -93.0977},
        "crops": ["Corn", "Soybeans"],
        "planting_window": "Apr - May",
        "critical_silking_window": "Jul - Aug",
        "harvest_window": "Sep - Nov",
        "baseline_yield": {"Corn": 178.5, "Soybeans": 51.5}, # Bu/Acre
        "units": "Bu/Acre",
        "cbot_tickers": ["ZC", "ZS"]
    },
    "BRAZIL_MATO_GROSSO": {
        "id": "BRAZIL_MATO_GROSSO",
        "name": "Brazil Cerrado (Mato Grosso)",
        "subregions": ["Sorriso", "Sinop", "Nova Mutum", "Rondonopolis"],
        "coordinates": {"lat": -12.6819, "lng": -56.9211},
        "crops": ["Soybeans", "Safrinha Corn"],
        "planting_window": "Oct - Nov",
        "critical_silking_window": "Dec - Feb",
        "harvest_window": "Feb - May",
        "baseline_yield": {"Soybeans": 3.65, "Corn": 5.80}, # Metric Ton/Ha
        "units": "MT/Ha",
        "cbot_tickers": ["ZS", "ZC"]
    },
    "ARGENTINA_PAMPAS": {
        "id": "ARGENTINA_PAMPAS",
        "name": "Argentina Pampas (Cordoba/Santa Fe)",
        "subregions": ["Buenos Aires", "Cordoba", "Santa Fe", "La Pampa"],
        "coordinates": {"lat": -34.6037, "lng": -61.2778},
        "crops": ["Soybeans", "Corn", "Wheat"],
        "planting_window": "Nov - Dec",
        "critical_silking_window": "Jan - Feb",
        "harvest_window": "Mar - Jun",
        "baseline_yield": {"Soybeans": 2.95, "Corn": 7.40, "Wheat": 3.10},
        "units": "MT/Ha",
        "cbot_tickers": ["ZS", "ZC", "ZW"]
    },
    "BLACK_SEA_REGION": {
        "id": "BLACK_SEA_REGION",
        "name": "Black Sea Basin (Ukraine & S.Russia)",
        "subregions": ["Kyiv/Poltava", "Odessa", "Rostov", "Krasnodar"],
        "coordinates": {"lat": 47.8388, "lng": 35.1396},
        "crops": ["Wheat", "Corn", "Sunflower"],
        "planting_window": "Sep - Oct (Winter) / Apr (Corn)",
        "critical_silking_window": "May - Jun",
        "harvest_window": "Jul - Aug",
        "baseline_yield": {"Wheat": 4.25, "Corn": 6.70},
        "units": "MT/Ha",
        "cbot_tickers": ["ZW", "ZC"]
    }
}

class ClimateSatelliteIngestionEngine:
    def __init__(self):
        # Global ENSO State (ONI: >+0.5 El Niño, <-0.5 La Niña, between -0.5 and +0.5 Neutral)
        self.enso_oni = 1.45 # Moderate-to-Strong El Niño condition
        self.enso_soi = -14.2
        self.enso_phase = "EL_NINO_STRONG"
        self.global_sea_surface_temp_anomaly = +1.15 # °C
        
        # Climate Teleconnection Bias by Region
        self.regional_teleconnections = {
            "US_MIDWEST": {"temp_bias": +0.8, "precip_bias": -12.0, "drought_prob": 0.42},
            "BRAZIL_MATO_GROSSO": {"temp_bias": +1.5, "precip_bias": -22.5, "drought_prob": 0.68},
            "ARGENTINA_PAMPAS": {"temp_bias": +1.2, "precip_bias": -18.0, "drought_prob": 0.55},
            "BLACK_SEA_REGION": {"temp_bias": +1.8, "precip_bias": -15.0, "drought_prob": 0.48}
        }
        
        # History buffers for time-series charts
        self.history = {region_id: [] for region_id in GLOBAL_BREADBASKETS.keys()}
        self._initialize_baseline_history()

    def _initialize_baseline_history(self):
        """Generate 30-day realistic baseline historical telemetry"""
        now = datetime.datetime.now()
        for region_id in GLOBAL_BREADBASKETS.keys():
            for day_offset in range(30, 0, -1):
                timestamp = now - datetime.timedelta(days=day_offset)
                telemetry = self._generate_regional_telemetry(region_id, timestamp=timestamp, shock_level=0.0)
                self.history[region_id].append(telemetry)

    def _calculate_gdd_and_edd(self, t_max: float, t_min: float, base_temp: float = 10.0, upper_temp: float = 30.0, extreme_temp: float = 35.0) -> Dict[str, float]:
        """
        Calculate GDD (Growing Degree Days) & EDD (Extreme Degree Days / Heat Stress)
        GDD = max(0, min(30, (Tmax + Tmin)/2) - 10)
        EDD = max(0, Tmax - 35.0)
        """
        t_mean = (t_max + t_min) / 2.0
        gdd = max(0.0, min(upper_temp, t_mean) - base_temp)
        edd = max(0.0, t_max - extreme_temp)
        return {"gdd": round(gdd, 2), "edd": round(edd, 2)}

    def _calculate_spei(self, precip_anomaly_pct: float, temp_anomaly: float, soil_moisture_pct: float) -> float:
        """
        Calculates Standardized Precipitation Evapotranspiration Index (SPEI proxy)
        Range: +2.5 (Extremely Wet) to -2.5 (Extreme Drought)
        """
        # Water deficit = Precipitation - Potential Evapotranspiration
        pet_factor = temp_anomaly * 0.35
        precip_factor = (precip_anomaly_pct / 100.0) * 1.5
        soil_factor = (soil_moisture_pct - 25.0) / 10.0 # 25% is neutral root soil moisture
        
        spei = (precip_factor - pet_factor + soil_factor * 0.5)
        spei = max(-2.8, min(2.8, spei))
        return round(spei, 2)

    def _calculate_vhi(self, ndvi: float, surface_temp: float, optimal_temp: float = 26.0) -> float:
        """
        Vegetation Health Index (VHI) = 0.5 * VCI (Vegetation Condition) + 0.5 * TCI (Temperature Condition)
        Score from 0 (Severely Stressed/Dead) to 100 (Optimal Lush)
        """
        # VCI proxy from NDVI (0.2 to 0.85 typical)
        vci = np.clip((ndvi - 0.2) / (0.85 - 0.2) * 100.0, 0, 100)
        # TCI proxy (lower temperature stress = higher TCI)
        temp_stress = abs(surface_temp - optimal_temp)
        tci = np.clip(100.0 - (temp_stress * 4.5), 0, 100)
        vhi = 0.5 * vci + 0.5 * tci
        return round(vhi, 1)

    def _generate_regional_telemetry(self, region_id: str, timestamp: datetime.datetime = None, shock_level: float = 0.0) -> Dict[str, Any]:
        """
        Synthesizes telemetry matching NOAA/ECMWF/NASA SMAP satellite channels
        shock_level: 0.0 (normal) to 1.0 (severe heatwave & mega drought)
        """
        if timestamp is None:
            timestamp = datetime.datetime.now()

        region_meta = GLOBAL_BREADBASKETS[region_id]
        telecon = self.regional_teleconnections[region_id]

        # Base atmospheric variables with seasonal and shock modifiers
        base_temp_max = 31.0 + telecon["temp_bias"] + (shock_level * 9.5) + np.random.normal(0, 1.2)
        base_temp_min = 19.0 + (telecon["temp_bias"] * 0.6) + (shock_level * 4.0) + np.random.normal(0, 0.9)
        
        # Precipitation (mm/day)
        precip_drop = (telecon["precip_bias"] - (shock_level * 60.0))
        precip_drop = max(-95.0, precip_drop) # Max 95% deficit
        daily_precip = max(0.0, np.random.exponential(scale=4.5) * (1.0 + precip_drop / 100.0))
        
        # NASA SMAP Root Zone Soil Moisture (0-100cm, Volumetric Water Content %)
        # 12% is permanent wilting point, 38% is field capacity
        base_soil_moisture = 28.0 - (shock_level * 16.0) + (daily_precip * 0.4) + np.random.normal(0, 0.8)
        soil_moisture = float(np.clip(base_soil_moisture, 9.2, 42.0))

        # Satellite NDVI (Normalized Difference Vegetation Index)
        base_ndvi = 0.74 - (shock_level * 0.32) + np.random.normal(0, 0.02)
        ndvi = float(np.clip(base_ndvi, 0.15, 0.92))

        # Indices
        degree_days = self._calculate_gdd_and_edd(base_temp_max, base_temp_min)
        spei = self._calculate_spei(precip_drop, telecon["temp_bias"] + (shock_level * 4.0), soil_moisture)
        vhi = self._calculate_vhi(ndvi, base_temp_max)

        # Vapor Pressure Deficit (VPD in kPa) - atmospheric thirst
        saturation_vp = 0.61078 * math.exp((17.27 * base_temp_max) / (base_temp_max + 237.3))
        actual_vp = saturation_vp * (0.55 - (shock_level * 0.25))
        vpd_kpa = round(max(0.2, saturation_vp - actual_vp), 2)

        # Consecutive Heatwave / Drought Streak Counter
        heat_streak = int(max(0, math.floor(shock_level * 18 + np.random.uniform(0, 2))))
        dry_spell_days = int(max(0, math.floor(shock_level * 24 + np.random.uniform(2, 6))))

        return {
            "region_id": region_id,
            "region_name": region_meta["name"],
            "timestamp": timestamp.isoformat(),
            "coordinates": region_meta["coordinates"],
            "noaa_temp_max_c": round(base_temp_max, 1),
            "noaa_temp_min_c": round(base_temp_min, 1),
            "noaa_precip_daily_mm": round(daily_precip, 2),
            "noaa_precip_anomaly_pct": round(precip_drop, 1),
            "ecmwf_vpd_kpa": vpd_kpa,
            "smap_soil_moisture_pct": round(soil_moisture, 1), # 0-100cm root zone
            "modis_ndvi": round(ndvi, 3),
            "vhi_index": vhi, # 0-100 (Vegetation Health Index)
            "spei_drought_index": spei, # Standardized Precipitation Evapotranspiration Index
            "gdd": degree_days["gdd"], # Growing Degree Days
            "edd_heat_stress": degree_days["edd"], # Extreme Degree Days (>35°C)
            "consecutive_heat_days": heat_streak,
            "dry_spell_days": dry_spell_days,
            "shock_level": shock_level,
            "enso_phase": self.enso_phase,
            "enso_oni": self.enso_oni
        }

    def fetch_all_regions_telemetry(self, shock_overrides: Dict[str, float] = None) -> Dict[str, Any]:
        """Fetch latest telemetry snapshot for all global breadbaskets"""
        shock_overrides = shock_overrides or {}
        results = {}
        now = datetime.datetime.now()

        for region_id in GLOBAL_BREADBASKETS.keys():
            shock = shock_overrides.get(region_id, 0.0)
            telemetry = self._generate_regional_telemetry(region_id, timestamp=now, shock_level=shock)
            self.history[region_id].append(telemetry)
            if len(self.history[region_id]) > 60:
                self.history[region_id].pop(0)
            results[region_id] = telemetry

        return {
            "timestamp": now.isoformat(),
            "enso_state": {
                "oni": self.enso_oni,
                "soi": self.enso_soi,
                "phase": self.enso_phase,
                "sea_surface_temp_anomaly_c": self.global_sea_surface_temp_anomaly,
                "status_text": "Strong El Niño Event Active - Heightened South American & Midwest Thermal Anomaly"
            },
            "regions": results,
            "active_satellites": [
                {"name": "NOAA-20 / GFS Global Forecaster", "orbit": "LEO 824km", "status": "NOMINAL", "latency": "22ms"},
                {"name": "ECMWF Integrated Forecasting System (IFS)", "orbit": "GeoSync Ensemble", "status": "NOMINAL", "latency": "45ms"},
                {"name": "NASA SMAP (L-Band Radiometer / Soil Moisture)", "orbit": "Sun-Synchronous 685km", "status": "LOCK", "latency": "18ms"},
                {"name": "Sentinel-2 & Terra/Aqua MODIS (NDVI/VHI)", "orbit": "Multi-Spectral Optical", "status": "NOMINAL", "latency": "31ms"}
            ]
        }

    def set_enso_shock(self, phase: str, oni: float):
        """Allows testing varying ENSO climate cycles"""
        self.enso_phase = phase
        self.enso_oni = oni
        if "EL_NINO" in phase:
            self.regional_teleconnections["BRAZIL_MATO_GROSSO"]["precip_bias"] = -28.0
            self.regional_teleconnections["US_MIDWEST"]["temp_bias"] = +1.4
        elif "LA_NINA" in phase:
            self.regional_teleconnections["ARGENTINA_PAMPAS"]["precip_bias"] = -32.0
            self.regional_teleconnections["US_MIDWEST"]["precip_bias"] = -20.0
        else:
            self.regional_teleconnections["BRAZIL_MATO_GROSSO"]["precip_bias"] = -5.0
            self.regional_teleconnections["US_MIDWEST"]["temp_bias"] = +0.2
