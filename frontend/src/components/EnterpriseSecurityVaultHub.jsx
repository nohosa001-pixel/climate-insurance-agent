import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Cpu, Link2, CheckCircle2, AlertTriangle, 
  Layers, Globe, FileCode, Check, RefreshCw, ArrowRightLeft, Sparkles, AlertOctagon
} from 'lucide-react';
import { fetchContractSource } from '../services/api';

export default function EnterpriseSecurityVaultHub({ securityGate, crosschainBridge, parametricMetrics, onToggleMultiSig }) {
  const [activeSubTab, setActiveSubTab] = useState("DUAL_TRANCHE"); // DUAL_TRANCHE | MULTISIG_TIMELOCK | CCIP_BRIDGE | EUDR_ESG | CONTRACT_CODE
  const [selectedContract, setSelectedContract] = useState("AgriParametricInsurance");
  const [contractCode, setContractCode] = useState(null);
  const [loadingCode, setLoadingCode] = useState(false);

  const tranches = parametricMetrics?.dual_tranches || {
    senior_tranche_usd: 6000000,
    senior_share_pct: 60.0,
    senior_target_apy_pct: 6.5,
    senior_risk_rating: "AAA (Capital Protected)",
    junior_tranche_usd: 4000000,
    junior_share_pct: 40.0,
    junior_target_apy_pct: 16.8,
    junior_risk_rating: "BB+ (First-Loss Underwriting)"
  };

  const multisig = securityGate?.multisig_governance || {
    multisig_contract: "0xSafe3of5_AgriPulse_Treasury",
    threshold: 3,
    total_signers: 5,
    signed_count: 3,
    is_quorum_reached: true,
    signers: []
  };

  const bridge = crosschainBridge || {
    evm_vault_chain: "Arbitrum One",
    solana_hedge_chain: "Solana / Hyperliquid",
    ccip_network_status: "ONLINE",
    total_relayed_notional_usd: 570000,
    recent_crosschain_relays: []
  };

  const fetchContractCode = async (name) => {
    setLoadingCode(true);
    setSelectedContract(name);
    try {
      const data = await fetchContractSource(name);
      setContractCode(data?.code || "// Unable to load contract source");
    } catch (e) {
      setContractCode("// Error connecting to contract API");
    } finally {
      setLoadingCode(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.5px' }}>
              ENTERPRISE ONCHAIN FINANCE & MULTI-TIER SECURITY GATE v2.0
            </h2>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>EIP-712 & CCIP READY</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ERC-4626 Dual-Tranche Vault • Gnosis Safe 3/5 Multi-Sig • Chainlink CCIP Hedging Bridge • EUDR ESG Rebate
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(2, 6, 23, 0.7)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          {[
            { id: "DUAL_TRANCHE", label: "ERC-4626 Tranches", icon: Layers },
            { id: "MULTISIG_TIMELOCK", label: "Safe 3/5 Multi-Sig", icon: Lock },
            { id: "CCIP_BRIDGE", label: "Chainlink CCIP Bridge", icon: ArrowRightLeft },
            { id: "EUDR_ESG", label: "EUDR ESG Geofence", icon: Globe },
            { id: "CONTRACT_CODE", label: "Solidity v2.0 Code", icon: FileCode }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id);
                  if (tab.id === "CONTRACT_CODE" && !contractCode) {
                    fetchContractCode("AgriParametricInsurance");
                  }
                }}
                style={{
                  background: active ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: active ? '#38bdf8' : 'var(--text-dim)',
                  border: active ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtab 1: Dual-Tranche Waterfall */}
      {activeSubTab === "DUAL_TRANCHE" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {/* Senior Tranche Card */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{tranches.senior_risk_rating}</span>
                <span className="mono" style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>
                  Target Yield: +{tranches.senior_target_apy_pct}% APY
                </span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Senior Capital Preservation Tranche
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
                Underwritten by Institutional Reinsurers (Swiss Re, Munich Re) & Institutional Treasuries. Absorbs 0% loss until Junior tranche is depleted.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pool Reserve:</span>
                <span className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>
                  ${tranches.senior_tranche_usd?.toLocaleString()} USDC
                </span>
              </div>
              <div style={{ background: 'rgba(2, 6, 23, 0.8)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${tranches.senior_share_pct}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                <span>Vault Share: {tranches.senior_share_pct}%</span>
                <span>Absorbed Loss: ${(tranches.senior_absorbed_losses_usd || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Junior Tranche Card */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>{tranches.junior_risk_rating}</span>
                <span className="mono" style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>
                  Target Yield: +{tranches.junior_target_apy_pct}% APY
                </span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Junior First-Loss High-Yield Tranche
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
                Underwritten by Web3 DeFi Yield Seekers & Algorithmic Funds. Harvests 75% of insurance premiums in exchange for taking initial payout losses.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pool Reserve:</span>
                <span className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fbbf24' }}>
                  ${tranches.junior_tranche_usd?.toLocaleString()} USDC
                </span>
              </div>
              <div style={{ background: 'rgba(2, 6, 23, 0.8)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${tranches.junior_share_pct}%`, height: '100%', background: 'linear-gradient(90deg, #d97706, #fbbf24)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                <span>Vault Share: {tranches.junior_share_pct}%</span>
                <span>Absorbed Loss: ${(tranches.junior_absorbed_losses_usd || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* First-Loss Waterfall Architecture Visual */}
          <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px 16px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
              Cat-Bond Settlement Waterfall Logic (Automated Smart Contract Flow)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span className="badge badge-emerald">Climate Disaster Triggered</span>
              <span>→</span>
              <span className="badge badge-amber">Junior Tranche Absorbs First 100% of Payout</span>
              <span>→</span>
              <span className="badge badge-cyan">Senior Tranche Shielded (0% Loss)</span>
              <span>→</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>Zero Paperwork Settlement Complete</span>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Safe 3/5 Multi-Sig & Timelock */}
      {activeSubTab === "MULTISIG_TIMELOCK" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.7)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Gnosis Safe 3-of-5 Governance Quorum: {multisig.signed_count} / {multisig.total_signers} Signed
              </div>
              <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                Multi-Sig Vault Address: {multisig.multisig_contract} • Timelock Cooldown: 48 Hours
              </div>
            </div>
            <span className={`badge ${multisig.is_quorum_reached ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
              {multisig.is_quorum_reached ? '✓ QUORUM ACTIVE' : 'AWAITING SIGNATURES'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
            {multisig.signers?.map((s) => (
              <div
                key={s.address}
                style={{
                  background: s.has_signed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.5)',
                  border: s.has_signed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{s.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s.role}</div>
                  <div className="mono" style={{ fontSize: '0.65rem', color: '#38bdf8' }}>{s.address}</div>
                </div>
                <button
                  onClick={() => onToggleMultiSig && onToggleMultiSig(s.address, !s.has_signed)}
                  style={{
                    background: s.has_signed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.2)',
                    color: s.has_signed ? '#10b981' : '#f43f5e',
                    border: '1px solid transparent',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {s.has_signed ? 'SIGNED ✓' : 'SIGN +'}
                </button>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(2, 6, 23, 0.6)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>
              🛡️ Timelock Delay Queue (Anti-Exploit Protection)
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              All high-risk parameter changes (adjusting drought triggers, updating oracle signers, or altering fee ratios) are subject to a mandatory 48-hour on-chain delay, allowing LP depositors sufficient time to withdraw assets if unauthorized actions occur.
            </p>
          </div>
        </div>
      )}

      {/* Subtab 3: Chainlink CCIP Cross-Chain Hedging */}
      {activeSubTab === "CCIP_BRIDGE" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Source Chain (Capital Vault)</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>{bridge.evm_vault_chain}</div>
              <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Chain Selector: 4949039107694359620</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Destination Chain (HFT Quant Perp)</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>{bridge.solana_hedge_chain}</div>
              <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Latency: 280ms • Anti-MEV Enabled</div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Total Relayed Notional</div>
              <div className="mono" style={{ fontSize: '1rem', fontWeight: 800, color: '#fbbf24' }}>
                ${bridge.total_relayed_notional_usd?.toLocaleString()} USDC
              </div>
              <div className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>RMN Enclave Blessed</div>
            </div>
          </div>

          {/* Active CCIP Relay Feed */}
          <div style={{ background: 'rgba(2, 6, 23, 0.7)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
              Live Chainlink CCIP Messages: Cross-Chain Delta Hedge Stream
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {bridge.recent_crosschain_relays?.map((msg) => (
                <div
                  key={msg.message_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.7rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="mono" style={{ color: '#38bdf8', fontWeight: 700 }}>{msg.message_id}</span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>{msg.event_type}</span>
                    <span style={{ color: 'var(--text-main)' }}>{msg.asset}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="mono" style={{ fontWeight: 700, color: '#10b981' }}>
                      ${msg.notional_usd?.toLocaleString()}
                    </span>
                    <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>
                      {msg.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 4: EUDR ESG Geofence */}
      {activeSubTab === "EUDR_ESG" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>EU REGULATION 2023/1115 (EUDR)</span>
              <span className="mono" style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>
                Automatic 20% ESG Premium Rebate
              </span>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              Satellite Geofence Deforestation-Free Compliance Verification
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: '1.4' }}>
              AgriPulse Eliza analyzes Sentinel-2 high-resolution imagery and Hansen Global Forest Change datasets. Any cooperative whose farm polygon proves &lt;1.0% canopy cover loss since December 31, 2020 automatically receives an on-chain 20% discount on parametric insurance premiums.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'rgba(2, 6, 23, 0.7)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', marginBottom: '2px' }}>
                Midwest Corn Growers (Iowa)
              </div>
              <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Polygon ID: POLY-US-IA-8820</div>
              <div style={{ marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Canopy Loss: <strong style={{ color: '#10b981' }}>0.04%</strong> (Threshold: 1.00%)<br />
                EUDR Status: <strong style={{ color: '#10b981' }}>CERTIFIED COMPLIANT</strong><br />
                Rebate Applied: <strong style={{ color: '#38bdf8' }}>-$4,500 USDC</strong>
              </div>
            </div>

            <div style={{ background: 'rgba(2, 6, 23, 0.7)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', marginBottom: '2px' }}>
                Pampas Wheat & Soy (Cordoba)
              </div>
              <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Polygon ID: POLY-AR-PA-1049</div>
              <div style={{ marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Canopy Loss: <strong style={{ color: '#10b981' }}>0.12%</strong> (Threshold: 1.00%)<br />
                EUDR Status: <strong style={{ color: '#10b981' }}>CERTIFIED COMPLIANT</strong><br />
                Rebate Applied: <strong style={{ color: '#38bdf8' }}>-$3,600 USDC</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 5: Solidity Contract Code */}
      {activeSubTab === "CONTRACT_CODE" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => fetchContractCode("AgriParametricInsurance")}
              className={`btn-outline ${selectedContract === "AgriParametricInsurance" ? "active" : ""}`}
              style={{ fontSize: '0.72rem', padding: '4px 10px' }}
            >
              AgriParametricInsurance.sol (EIP-712 v2.0)
            </button>
            <button
              onClick={() => fetchContractCode("AgriCatBondVault")}
              className={`btn-outline ${selectedContract === "AgriCatBondVault" ? "active" : ""}`}
              style={{ fontSize: '0.72rem', padding: '4px 10px' }}
            >
              AgriCatBondVault.sol (ERC-4626 Tranches)
            </button>
          </div>

          <div style={{ maxHeight: '460px', height: '460px', background: '#020617', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflowY: 'auto', padding: '14px' }}>
            {loadingCode ? (
              <div style={{ color: '#38bdf8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="animate-spin">⏳</span> Fetching verified on-chain Solidity contract source...
              </div>
            ) : contractCode ? (
              <pre className="mono" style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: '1.45', margin: 0 }}>
                {contractCode}
              </pre>
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textAlign: 'center', padding: '40px 0' }}>
                👆 Select a contract tab above to inspect verified Solidity smart contract code
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
