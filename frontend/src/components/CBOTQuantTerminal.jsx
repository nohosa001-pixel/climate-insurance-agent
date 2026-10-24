import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart2, ShieldAlert, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

export default function CBOTQuantTerminal({ quantData }) {
  const [selectedTicker, setSelectedTicker] = useState("ZC");
  const contracts = quantData?.contracts || {};
  const positions = quantData?.positions || {};
  const recentTrades = quantData?.recent_trades || [];

  const currentSpec = contracts[selectedTicker];
  const currentPos = positions[selectedTicker];

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} color="#38bdf8" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>MODULE A: CBOT GRAIN FUTURES QUANT TRADING</h2>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            WASDE Discrepancy Alpha • Supply Shock Elasticity Hedging (ZC / ZS / ZW)
          </p>
        </div>

        {/* Portfolio Margin Status */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Used Margin: </span>
            <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24' }}>
              ${(quantData?.used_margin_usd || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: '4px' }}>
                ({quantData?.margin_utilization_pct || 0}%)
              </span>
            </span>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Unrealized PnL: </span>
            <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: (quantData?.total_unrealized_pnl_usd || 0) >= 0 ? '#34d399' : '#fb7185' }}>
              ${(quantData?.total_unrealized_pnl_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Ticker Selector Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
        {Object.keys(contracts).map((ticker) => {
          const spec = contracts[ticker];
          const pos = positions[ticker];
          const isSelected = selectedTicker === ticker;
          const isLong = pos?.side === "LONG";
          const isShort = pos?.side === "SHORT";

          return (
            <div
              key={ticker}
              onClick={() => setSelectedTicker(ticker)}
              style={{
                background: isSelected ? 'rgba(2, 132, 199, 0.25)' : 'rgba(15, 23, 42, 0.5)',
                border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>
                  {ticker}
                </span>
                <span className={`badge ${isLong ? 'badge-emerald' : isShort ? 'badge-rose' : 'badge-cyan'}`} style={{ fontSize: '0.65rem' }}>
                  {pos?.lots !== 0 ? `${pos?.side} ${Math.abs(pos?.lots || 0)}L` : 'FLAT'}
                </span>
              </div>
              <div className="mono" style={{ fontSize: '1rem', fontWeight: 800, margin: '4px 0', color: 'var(--text-main)' }}>
                {spec?.current_price?.toFixed(2)}¢
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                <span>S/U: {(spec?.stock_to_use * 100).toFixed(1)}%</span>
                <span className="mono" style={{ color: (pos?.unrealized_pnl || 0) >= 0 ? '#34d399' : '#fb7185', fontWeight: 600 }}>
                  {(pos?.unrealized_pnl || 0) >= 0 ? `+$${pos?.unrealized_pnl}` : `-$${Math.abs(pos?.unrealized_pnl || 0)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Spec & Alpha Valuation for Selected Instrument */}
      {currentSpec && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px', flex: 1 }}>
          {/* Active Position Details */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {currentSpec.name}
              </span>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                5,000 bu/contract ($50/cent)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
              <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '8px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Avg Entry Price</div>
                <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  {currentPos?.avg_entry ? `${currentPos.avg_entry}¢` : '—'}
                </div>
              </div>
              <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '8px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Target Fair Value</div>
                <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                  {currentPos?.target_price ? `${currentPos.target_price}¢` : '—'}
                </div>
              </div>
              <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '8px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Initial Margin / Lot</div>
                <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>
                  ${currentSpec.initial_margin}
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(2, 6, 23, 0.4)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.75rem' }}>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>Quant Alpha Thesis: </span>
              <span style={{ color: 'var(--text-muted)' }}>
                Global Stock-to-Use at {(currentSpec.stock_to_use * 100).toFixed(1)}% yields high supply shock elasticity. 
                {currentPos?.side === "LONG" 
                  ? " Satellite heat stress predicts yield shortfall vs USDA WASDE. Maintaining Long position for price appreciation."
                  : " Favorable weather indicates bumper supply. Holding tactical Short/Delta hedge."}
              </span>
            </div>
          </div>

          {/* Recent Executed Orders Feed */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', color: '#94a3b8' }}>
              Live Quant Order Execution Stream
            </div>
            <div style={{ overflowY: 'auto', maxHeight: '140px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recentTrades.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>
                  Awaiting next quant rebalance cycle...
                </div>
              ) : (
                recentTrades.map((t, idx) => (
                  <div key={idx} style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '6px 8px', borderRadius: '4px', fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`badge ${t.side.includes('BUY') ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.6rem', padding: '1px 4px' }}>
                        {t.side}
                      </span>
                      <span className="mono" style={{ fontWeight: 700 }}>{t.ticker} x {t.executed_lots}L</span>
                      <span className="mono" style={{ color: 'var(--text-dim)' }}>@{t.fill_price}¢</span>
                    </div>
                    <span className="mono" style={{ color: '#38bdf8' }}>${t.notional_value_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
