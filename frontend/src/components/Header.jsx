import React from 'react';
import { Satellite, Radio, ShieldCheck, TrendingUp, Zap, Globe2, Activity } from 'lucide-react';

export default function Header({ ensoState, quantSummary, vaultMetrics, cycleCount, onManualTrigger }) {
  const isElNino = ensoState?.phase?.includes("EL_NINO");
  const isLaNina = ensoState?.phase?.includes("LA_NINA");

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(7, 9, 14, 0.92)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '12px 24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        {/* Left: Brand & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(2, 132, 199, 0.4)'
          }}>
            <Satellite size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                AGRI<span style={{ color: '#38bdf8' }}>PULSE</span> <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 600 }}>AI AGENT</span>
              </h1>
              <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                AUTONOMOUS
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              NOAA/ECMWF Satellite ──► ML Yield Anomaly ──► CBOT Quant Long/Short & Parametric Smart Contract Payout
            </p>
          </div>
        </div>

        {/* Center: Live Climate Teleconnection & Fund Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* ENSO Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 12px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            <Globe2 size={16} color={isElNino ? '#f43f5e' : isLaNina ? '#38bdf8' : '#10b981'} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>ENSO State (ONI)</div>
              <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: isElNino ? '#fb7185' : '#38bdf8' }}>
                {ensoState?.phase || "EL_NINO_STRONG"} ({ensoState?.oni > 0 ? `+${ensoState?.oni}` : ensoState?.oni}°C)
              </div>
            </div>
          </div>

          {/* Quant Fund Equity */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 12px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            <TrendingUp size={16} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>CBOT Quant Equity</div>
              <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                ${(quantSummary?.portfolio_equity_usd || 25000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                <span style={{ fontSize: '0.7rem', color: '#34d399', marginLeft: '5px' }}>
                  ({quantSummary?.total_roi_pct >= 0 ? `+${quantSummary?.total_roi_pct}` : quantSummary?.total_roi_pct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Parametric Vault */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 12px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            <ShieldCheck size={16} color="#10b981" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Insurance Vault</div>
              <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
                ${(vaultMetrics?.vault_liquidity_usd || 10000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '5px' }}>
                  (Solvency {vaultMetrics?.solvency_ratio_pct || 100}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Cycle Counter & Trigger Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>AGENT HEARTBEAT</div>
            <div className="mono" style={{ fontSize: '0.8rem', color: '#a855f7', fontWeight: 600 }}>
              CYCLE #{cycleCount || 1} <span style={{ color: '#10b981' }}>● LIVE</span>
            </div>
          </div>
          <button className="btn-primary" onClick={onManualTrigger} title="Force run one full autonomous orchestration cycle">
            <Zap size={14} />
            <span>EXECUTE CYCLE</span>
          </button>
        </div>
      </div>
    </header>
  );
}
