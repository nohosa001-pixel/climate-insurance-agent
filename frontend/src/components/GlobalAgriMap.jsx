import React, { useState } from 'react';
import { Globe, Droplets, Flame, Sun, Wind, Eye, AlertTriangle, CheckCircle2, Sliders } from 'lucide-react';

export default function GlobalAgriMap({ telemetryMap, onApplyShock, activeSatellites }) {
  const [selectedRegionId, setSelectedRegionId] = useState("US_MIDWEST");
  const [activeLayer, setActiveLayer] = useState("soil_moisture"); // 'soil_moisture' | 'spei' | 'edd' | 'ndvi'
  const [shockInput, setShockInput] = useState(0.75);

  const regionKeys = Object.keys(telemetryMap || {});
  const selectedTelemetry = telemetryMap ? telemetryMap[selectedRegionId] : null;

  const handleApplyShock = (e) => {
    e.preventDefault();
    onApplyShock(selectedRegionId, parseFloat(shockInput));
  };

  const getMetricBadge = (tel) => {
    if (!tel) return null;
    if (activeLayer === "soil_moisture") {
      const sm = tel.soil_moisture_pct;
      const isCritical = sm <= 18.0;
      return (
        <span className={`badge ${isCritical ? 'badge-rose' : sm <= 25 ? 'badge-amber' : 'badge-emerald'}`}>
          <Droplets size={12} /> SMAP {sm}%
        </span>
      );
    } else if (activeLayer === "spei") {
      const spei = tel.spei_drought_index;
      return (
        <span className={`badge ${spei <= -1.8 ? 'badge-rose' : spei < 0 ? 'badge-amber' : 'badge-emerald'}`}>
          SPEI {spei > 0 ? `+${spei}` : spei}
        </span>
      );
    } else if (activeLayer === "edd") {
      const edd = tel.cumulative_edd;
      return (
        <span className={`badge ${edd >= 30 ? 'badge-rose' : edd >= 15 ? 'badge-amber' : 'badge-cyan'}`}>
          <Flame size={12} /> EDD {edd}°C-d
        </span>
      );
    } else {
      return (
        <span className="badge badge-purple">
          <Eye size={12} /> NDVI {tel.modis_ndvi}
        </span>
      );
    }
  };

  return (
    <div className="glass-panel scanline-effect" style={{ padding: '20px', height: '100%', minHeight: '660px', display: 'flex', flexDirection: 'column' }}>
      {/* Tier 1: Header & Layer Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="#38bdf8" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>GLOBAL SATELLITE & SOIL INGESTION</h2>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Real-time multi-spectral grid ingestion across primary global grain basins
          </p>
        </div>

        {/* Layer Toggles */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <button
            className={`tab-button ${activeLayer === 'soil_moisture' ? 'active' : ''}`}
            onClick={() => setActiveLayer('soil_moisture')}
            style={{ fontSize: '0.72rem', padding: '4px 8px' }}
          >
            SMAP Soil Moisture
          </button>
          <button
            className={`tab-button ${activeLayer === 'spei' ? 'active' : ''}`}
            onClick={() => setActiveLayer('spei')}
            style={{ fontSize: '0.72rem', padding: '4px 8px' }}
          >
            SPEI Drought
          </button>
          <button
            className={`tab-button ${activeLayer === 'edd' ? 'active' : ''}`}
            onClick={() => setActiveLayer('edd')}
            style={{ fontSize: '0.72rem', padding: '4px 8px' }}
          >
            EDD Heat Stress
          </button>
          <button
            className={`tab-button ${activeLayer === 'ndvi' ? 'active' : ''}`}
            onClick={() => setActiveLayer('ndvi')}
            style={{ fontSize: '0.72rem', padding: '4px 8px' }}
          >
            MODIS NDVI
          </button>
        </div>
      </div>

      {/* Tier 2: Grid of Global Regions Cards (2x2 Symmetric Balance) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
        {regionKeys.map((rId) => {
          const tel = telemetryMap[rId];
          const isSelected = selectedRegionId === rId;
          const isDrought = tel?.spei_drought_index <= -1.8 || tel?.soil_moisture_pct <= 18.0;

          return (
            <div
              key={rId}
              onClick={() => { setSelectedRegionId(rId); }}
              style={{
                background: isSelected ? 'rgba(14, 116, 144, 0.25)' : 'rgba(15, 23, 42, 0.5)',
                border: isSelected ? '1px solid #38bdf8' : isDrought ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              {isDrought && (
                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                  <AlertTriangle size={15} color="#fb7185" />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="mono" style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>
                  [{rId.replace("_REGION", "").replace("_", " ")}]
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tel?.region_name}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span className="badge badge-purple" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                  {tel?.crop_type} ({tel?.current_growth_stage})
                </span>
                {getMetricBadge(tel)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tier 3: Detailed Telemetry & Shock Injection Sandbox for Selected Region */}
      {selectedTelemetry && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '8px',
          padding: '14px',
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={15} color="#38bdf8" />
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                {selectedTelemetry.region_name} — Ingestion Telemetry
              </span>
            </div>
            <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              UPDATED: {selectedTelemetry.timestamp}
            </span>
          </div>

          {/* Key Metric Gauges (5 Columns Exact Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Root Soil</div>
              <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedTelemetry.soil_moisture_pct < 18 ? '#fb7185' : '#38bdf8' }}>
                {selectedTelemetry.soil_moisture_pct}%
              </div>
            </div>
            <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>SPEI Drought</div>
              <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedTelemetry.spei_drought_index < -1.5 ? '#fb7185' : '#34d399' }}>
                {selectedTelemetry.spei_drought_index}
              </div>
            </div>
            <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Accum EDD</div>
              <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedTelemetry.cumulative_edd > 25 ? '#fb7185' : '#fbbf24' }}>
                {selectedTelemetry.cumulative_edd}°C-d
              </div>
            </div>
            <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>T_max / Rain</div>
              <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {selectedTelemetry.noaa_temp_max_c}°C / {selectedTelemetry.noaa_precip_daily_mm}mm
              </div>
            </div>
            <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Dry Streak</div>
              <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedTelemetry.consecutive_dry_days >= 20 ? '#fb7185' : '#94a3b8' }}>
                {selectedTelemetry.consecutive_dry_days} Days
              </div>
            </div>
          </div>

          {/* Interactive Shock Injector Slider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(2, 6, 23, 0.4)',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px dashed rgba(244, 63, 94, 0.4)'
          }}>
            <Flame size={16} color="#f43f5e" />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '2px' }}>
                <span style={{ color: '#fb7185', fontWeight: 600 }}>Simulate Extreme Heatwave & Drought Shock</span>
                <span className="mono" style={{ color: '#fb7185', fontWeight: 700 }}>{Math.round(shockInput * 100)}% Severity</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={shockInput}
                onChange={(e) => setShockInput(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#f43f5e', cursor: 'pointer', height: '4px' }}
              />
            </div>
            <button className="btn-danger" onClick={handleApplyShock} style={{ whiteSpace: 'nowrap', padding: '5px 10px', fontSize: '0.72rem' }}>
              INJECT SHOCK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
