import React from 'react';
import { ShieldCheck, CheckCircle, AlertOctagon, RefreshCw, ExternalLink, Zap, Lock } from 'lucide-react';

export default function ParametricInsurance({ vaultMetrics, onResetPolicy }) {
  const policies = vaultMetrics?.policies || [];
  const recentPayouts = vaultMetrics?.recent_payouts || [];

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#10b981" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>MODULE B: PARAMETRIC CLIMATE SMART CONTRACT VAULT</h2>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Decentralized Oracle Auto-Trigger • Zero-Claim Instant Settlement (USDC)
          </p>
        </div>

        {/* Vault Liquidity Status */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Premium Yield APY: </span>
            <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>
              +{vaultMetrics?.underwriting_yield_apy || 4.85}%
            </span>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Total Settled Payouts: </span>
            <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fb7185' }}>
              ${(vaultMetrics?.total_payouts_usd || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Active Parametric Policies Grid (2x2 Symmetric Balance) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
        {policies.map((p) => {
          const isSettled = p.status === "SETTLED_PAID";

          return (
            <div
              key={p.policy_id}
              style={{
                background: isSettled ? 'rgba(244, 63, 94, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                border: isSettled ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 14px',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                  {p.policy_id}
                </span>
                <span className={`badge ${isSettled ? 'badge-rose' : 'badge-emerald'}`} style={{ fontSize: '0.65rem' }}>
                  {isSettled ? 'SETTLED & PAID' : 'ACTIVE COVERAGE'}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                {p.holder_name}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                <span>Coverage: <strong style={{ color: 'var(--text-main)' }}>${p.coverage_usd?.toLocaleString()}</strong></span>
                <span>Premium: <strong style={{ color: '#38bdf8' }}>${p.premium_usd?.toLocaleString()}</strong></span>
              </div>

              {/* Parametric Triggers */}
              <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '6px 8px', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <div style={{ color: '#38bdf8', fontWeight: 600, marginBottom: '2px' }}>Oracle Trigger Conditions (≥ 2 met):</div>
                <div className="mono" style={{ fontSize: '0.65rem', lineHeight: '1.3' }}>
                  • Soil Moisture ≤ {p.soil_moisture_trigger}% | Dry Days ≥ {p.dry_days_trigger}d<br />
                  • SPEI Drought ≤ {p.spei_trigger} | EDD Heat ≥ {p.edd_heat_trigger}°C
                </div>
              </div>

              {/* Settlement / Reset controls */}
              {isSettled ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <div className="mono" style={{ fontSize: '0.65rem', color: '#fb7185' }}>
                    Tx: {p.tx_hash ? p.tx_hash.slice(0, 16) + '...' : '0x7f2a...'}
                  </div>
                  <button className="btn-outline" onClick={() => onResetPolicy(p.policy_id)} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                    <RefreshCw size={10} style={{ marginRight: '4px' }} /> RESET
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#34d399' }}>
                  <Lock size={12} /> Underwritten by Collateral Vault
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Blockchain Settlement Tx Stream */}
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>
            Latest Smart Contract Instant Settlement Receipts
          </span>
          <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
            Solidity EVM Protocol
          </span>
        </div>

        <div style={{ overflowY: 'auto', maxHeight: '110px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {recentPayouts.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', padding: '10px 0' }}>
              No catastrophe threshold claims triggered yet. Vault liquidity secure.
            </div>
          ) : (
            recentPayouts.map((tx, idx) => (
              <div key={idx} style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '6px 8px', borderRadius: '4px', fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={12} color="#10b981" />
                    <span style={{ fontWeight: 700 }}>{tx.holder_name}</span>
                    <span className="badge badge-rose" style={{ fontSize: '0.6rem' }}>${tx.payout_amount_usd?.toLocaleString()} USDC</span>
                  </div>
                  <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                    TxHash: {tx.tx_hash} | {tx.timestamp}
                  </div>
                </div>
                <span className="badge badge-emerald" style={{ fontSize: '0.6rem' }}>
                  CONFIRMED
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
