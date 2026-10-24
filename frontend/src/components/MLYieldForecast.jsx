import React, { useState } from 'react';
import { Cpu, TrendingDown, AlertCircle, BarChart3, HelpCircle, Layers, Activity } from 'lucide-react';

export default function MLYieldForecast({ mlYieldData }) {
  const [selectedCropKey, setSelectedCropKey] = useState("US_MIDWEST_CORN");
  const evaluations = mlYieldData?.evaluations || {};
  const globalShocks = mlYieldData?.global_crop_shocks || {};

  const keys = Object.keys(evaluations);
  // Default to first 4 keys or fallback
  const primaryKeys = keys.length >= 4 ? keys.slice(0, 4) : keys;
  const currentEval = evaluations[selectedCropKey] || (keys.length > 0 ? evaluations[keys[0]] : null);
  const mcMetrics = currentEval?.monte_carlo_metrics;

  return (
    <div className="glass-panel scanline-effect" style={{ padding: '20px', height: '100%', minHeight: '660px', display: 'flex', flexDirection: 'column' }}>
      {/* Tier 1: Header & Global Aggregate Shocks */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="#a855f7" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>CLIMATE YIELD IMPACT ML ENGINE</h2>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Physical-ML hybrid: EDD (Extreme Degree Days) & Soil Moisture Elasticity
          </p>
        </div>

        {/* Global Grain Aggregate Shocks */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Corn:</span>
            <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: (globalShocks.Corn || 0) < 0 ? '#fb7185' : '#34d399' }}>
              {(globalShocks.Corn || 0) > 0 ? `+${globalShocks.Corn}` : (globalShocks.Corn || 0)}%
            </span>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Soy:</span>
            <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: (globalShocks.Soybeans || 0) < 0 ? '#fb7185' : '#34d399' }}>
              {(globalShocks.Soybeans || 0) > 0 ? `+${globalShocks.Soybeans}` : (globalShocks.Soybeans || 0)}%
            </span>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Wheat:</span>
            <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: (globalShocks.Wheat || 0) < 0 ? '#fb7185' : '#34d399' }}>
              {(globalShocks.Wheat || 0) > 0 ? `+${globalShocks.Wheat}` : (globalShocks.Wheat || 0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Tier 2: Grid of 4 Primary Crop ML Impact Cards (2x2 Symmetric Balance) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
        {primaryKeys.map((key) => {
          const item = evaluations[key];
          const isSelected = selectedCropKey === key;
          const isDrop = (item?.delta_yield_pct || 0) < 0;
          const isSevere = (item?.delta_yield_pct || 0) <= -15.0;

          return (
            <div
              key={key}
              onClick={() => setSelectedCropKey(key)}
              style={{
                background: isSelected ? 'rgba(147, 51, 234, 0.25)' : 'rgba(15, 23, 42, 0.5)',
                border: isSelected ? '1px solid #c084fc' : isSevere ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              {isSevere && (
                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                  <AlertCircle size={15} color="#fb7185" />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="mono" style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 700 }}>
                  [{item?.region_id?.replace("_REGION", "").replace("_", " ")}]
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item?.crop} — {item?.phenology_stage}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span className={`badge ${item?.delta_yield_pct <= -15 ? 'badge-rose' : item?.delta_yield_pct < 0 ? 'badge-amber' : 'badge-emerald'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                  {item?.risk_severity || 'NORMAL'}
                </span>
                <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: isDrop ? '#fb7185' : '#34d399' }}>
                  {item?.delta_yield_pct > 0 ? `+${item.delta_yield_pct}` : item?.delta_yield_pct}% Δ
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tier 3: Detailed ML Diagnostics & Monte Carlo Tail Risk for Selected Crop */}
      {currentEval && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(192, 132, 252, 0.3)',
          borderRadius: '8px',
          padding: '14px',
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={15} color="#c084fc" />
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                {currentEval.region_id?.replace("_", " ")} {currentEval.crop} — ML Decomposition
              </span>
            </div>
            <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              N=1,000 PATHS | LHS SAMPLING
            </span>
          </div>

          {/* 5-Column Exact Metric Grid (Perfect Symmetry with GlobalAgriMap) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Baseline</div>
              <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {currentEval.baseline_yield}
              </div>
            </div>
            <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Predicted</div>
              <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: currentEval.delta_yield_pct < 0 ? '#fb7185' : '#34d399' }}>
                {currentEval.predicted_yield}
              </div>
            </div>
            <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Yield Delta</div>
              <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: currentEval.delta_yield_pct < 0 ? '#fb7185' : '#34d399' }}>
                {currentEval.delta_yield_pct > 0 ? `+${currentEval.delta_yield_pct}` : currentEval.delta_yield_pct}%
              </div>
            </div>
            <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Worst 5% (VaR)</div>
              <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fb7185' }}>
                {mcMetrics?.var_95_delta_pct || -24.5}%
              </div>
            </div>
            <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '6px 8px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Tail 1% (VaR)</div>
              <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f43f5e' }}>
                {mcMetrics?.var_99_delta_pct || -35.2}%
              </div>
            </div>
          </div>

          {/* Monte Carlo Loss Density & Sensitivity Bar Container */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(2, 6, 23, 0.4)',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px dashed rgba(192, 132, 252, 0.4)'
          }}>
            <BarChart3 size={16} color="#c084fc" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                <span style={{ color: '#c084fc', fontWeight: 600 }}>EDD Thermal Silking Stress: {currentEval.cumulative_edd_c}°C-d</span>
                <span className="mono" style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Damage: {currentEval.crop_damage_ratio_pct}%</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                {mcMetrics?.loss_distribution_histogram ? (
                  mcMetrics.loss_distribution_histogram.map((bin, idx) => {
                    const pct = (bin.count / 1000) * 100;
                    return (
                      <div
                        key={idx}
                        title={`${bin.bin}: ${pct.toFixed(1)}%`}
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: bin.bin.includes('< -30') || bin.bin.includes('-30%') ? '#f43f5e' : bin.bin.includes('-20%') ? '#fb923c' : '#a855f7'
                        }}
                      />
                    );
                  })
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#a855f7' }} />
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className={`badge ${currentEval.delta_yield_pct <= -15 ? 'badge-rose' : 'badge-emerald'}`} style={{ whiteSpace: 'nowrap', padding: '4px 8px', fontSize: '0.7rem' }}>
                {currentEval.delta_yield_pct <= -15 ? '🚨 PAYOUT TRIGGER' : '✅ STABLE SOLVENCY'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
