import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Coins, CheckCircle2, ShieldCheck, Zap, 
  ExternalLink, Copy, QrCode, ArrowRight, RefreshCw, 
  FileText, Check, AlertCircle, Sparkles, Building2
} from 'lucide-react';
import { fetchBillingCatalog, createBillingSession, verifyBillingPayment } from '../services/api';

export default function OnchainUSDCBillingHub() {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedChain, setSelectedChain] = useState("Arbitrum One"); // "Arbitrum One" or "Solana Mainnet"
  const [payerWallet, setPayerWallet] = useState("0x5829C4b12658e4D6d23450e41B8cD47E6e6ed91F");
  
  // Checkout flow state
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const loadCatalog = async () => {
    setLoading(true);
    const data = await fetchBillingCatalog();
    if (data) {
      setCatalog(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setPaymentSuccess(null);
    setCheckoutSession(null);
  };

  const handleInitiatePayment = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    const session = await createBillingSession(selectedPlan.id, selectedChain, payerWallet);
    if (session && !session.error) {
      setCheckoutSession(session);
    }
    setIsProcessing(false);
  };

  const handleConfirmOnchainPayment = async () => {
    if (!checkoutSession) return;
    setIsProcessing(true);
    const res = await verifyBillingPayment(checkoutSession.session_id, payerWallet);
    if (res && res.success) {
      setPaymentSuccess(res);
      setCheckoutSession(null);
      await loadCatalog(); // Refresh active license
    }
    setIsProcessing(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const activeSub = catalog?.active_subscription;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner: Multi-Chain USDC Treasury Status */}
      <div className="glass-panel scanline-effect" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ background: 'rgba(37, 99, 235, 0.2)', padding: '8px', borderRadius: '10px', border: '1px solid #3b82f6' }}>
                <Coins size={24} color="#60a5fa" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  EVM & SOLANA MULTI-CHAIN USDC BILLING GATEWAY
                </h1>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Institutional-grade stablecoin settlement powered by EIP-712 Authorizations & Solana Pay
                </p>
              </div>
            </div>
          </div>

          {/* Active License Status Banner */}
          {activeSub && (
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.15)', 
              border: '1px solid rgba(16, 185, 129, 0.4)', 
              borderRadius: '10px', 
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="#34d399" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>ACTIVE OPERATOR LICENSE</span>
                </div>
                <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                  {activeSub.plan_name}
                </div>
                <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  Expires: {activeSub.expires_at} ({activeSub.remaining_days}d remaining)
                </div>
              </div>
              <button 
                onClick={() => handleCopy(activeSub.license_key)}
                className="btn-outline" 
                style={{ fontSize: '0.7rem', padding: '4px 8px', borderColor: 'rgba(52, 211, 153, 0.4)', color: '#34d399' }}
              >
                {copiedKey ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          )}
        </div>

        {/* Treasury Addresses & Supported Protocols */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '18px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
              <span>Arbitrum One EVM Safe (3/5 Multi-sig)</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>EIP-712</span>
            </div>
            <div className="mono" style={{ fontSize: '0.75rem', color: '#38bdf8', wordBreak: 'break-all' }}>
              {catalog?.treasury?.evm_safe_multisig || "0x71C8A663F2C331B2117f7b2c0eA6311696B26A4A"}
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
              <span>Solana Squads Treasury (SPL USDC)</span>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>SOLANA PAY</span>
            </div>
            <div className="mono" style={{ fontSize: '0.75rem', color: '#c084fc', wordBreak: 'break-all' }}>
              {catalog?.treasury?.solana_treasury || "Agri9vXoYQZ8tN6sK9bXGz21VpL3wE6fM9yK5bXoYQZ"}
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
              Total Protocol Onchain Revenue Settled
            </div>
            <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
              ${(catalog?.treasury?.total_protocol_revenue_usdc || 33450).toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>USDC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Plans Grid (4 Tiers) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} color="#38bdf8" />
            SELECT INSTITUTIONAL SUBSCRIPTION TIER
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Settled 100% in Native USDC on Arbitrum EVM or Solana Mainnet
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {catalog?.plans?.map((plan) => {
            const isSelected = selectedPlan?.id === plan.id;
            const isCurrent = activeSub?.plan_id === plan.id;

            return (
              <div 
                key={plan.id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: isSelected 
                    ? '2px solid #38bdf8' 
                    : isCurrent 
                      ? '1px solid rgba(52, 211, 153, 0.5)' 
                      : '1px solid var(--border-subtle)',
                  background: isSelected 
                    ? 'rgba(14, 116, 144, 0.15)' 
                    : 'rgba(15, 23, 42, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                {plan.badge && (
                  <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                    <span className={`badge ${plan.badge === 'MOST POPULAR' ? 'badge-rose' : plan.badge === 'INSTITUTIONAL' ? 'badge-purple' : 'badge-cyan'}`} style={{ fontSize: '0.65rem' }}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', color: '#f8fafc' }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  {plan.recommended_for}
                </div>

                {/* Price Display */}
                <div style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>
                      ${plan.price_usdc.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      USDC / {plan.duration_days} days
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', flex: 1 }}>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                      <CheckCircle2 size={14} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Select Button */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={isSelected ? "btn-primary" : "btn-outline"}
                  style={{ width: '100%', fontSize: '0.8rem', padding: '8px 12px', justifyContent: 'center' }}
                >
                  {isCurrent ? "RENEW WITH USDC" : isSelected ? "READY TO CHECKOUT" : "CHOOSE PLAN"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Onchain Checkout Drawer / Modal */}
      {selectedPlan && (
        <div className="glass-panel" style={{ padding: '24px', border: '1px solid #38bdf8', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.85)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coins size={20} color="#38bdf8" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                ONCHAIN USDC CHECKOUT: {selectedPlan.name}
              </h3>
            </div>
            <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>
              ${selectedPlan.price_usdc.toLocaleString()} USDC
            </div>
          </div>

          {/* Chain Selection Tabs */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              SELECT SETTLEMENT BLOCKCHAIN:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className={`tab-button ${selectedChain === 'Arbitrum One' ? 'active' : ''}`}
                onClick={() => { setSelectedChain('Arbitrum One'); setCheckoutSession(null); }}
                style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Zap size={16} color="#38bdf8" />
                <span>Arbitrum One (EVM - EIP-712 Permit)</span>
              </button>
              <button
                className={`tab-button ${selectedChain === 'Solana Mainnet' ? 'active' : ''}`}
                onClick={() => { setSelectedChain('Solana Mainnet'); setCheckoutSession(null); }}
                style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Sparkles size={16} color="#c084fc" />
                <span>Solana Mainnet (SPL-USDC / Solana Pay)</span>
              </button>
            </div>
          </div>

          {/* Payer Wallet Input */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              YOUR PAYER WALLET ADDRESS:
            </label>
            <input 
              type="text"
              value={payerWallet}
              onChange={(e) => setPayerWallet(e.target.value)}
              className="mono"
              style={{
                width: '100%',
                background: 'rgba(2, 6, 23, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#f8fafc',
                fontSize: '0.85rem'
              }}
              placeholder={selectedChain.includes("Solana") ? "Solana Wallet Address (Base58)..." : "EVM 0x Wallet Address..."}
            />
          </div>

          {/* Action: Create Payment Session vs Confirm Payment */}
          {!checkoutSession && !paymentSuccess && (
            <button
              onClick={handleInitiatePayment}
              disabled={isProcessing}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.9rem', justifyContent: 'center' }}
            >
              {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Coins size={18} />}
              GENERATE ONCHAIN INVOICE ({selectedPlan.price_usdc} USDC on {selectedChain})
            </button>
          )}

          {/* Invoice Created View */}
          {checkoutSession && !paymentSuccess && (
            <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>
                  INVOICE SESSION ACTIVE: {checkoutSession.session_id}
                </span>
                <span className="mono" style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
                  ⏳ Valid for 15 minutes
                </span>
              </div>

              {selectedChain.includes("Solana") ? (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCode size={110} color="#000000" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Solana Pay URI:</div>
                    <div className="mono" style={{ fontSize: '0.72rem', color: '#c084fc', wordBreak: 'break-all', background: 'rgba(0,0,0,0.4)', padding: '6px 10px', borderRadius: '6px', marginBottom: '8px' }}>
                      {checkoutSession.payment_details.solana_pay_url}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Scan via Phantom / Solflare wallet or click execute settlement below.
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>EIP-712 Typed Data Verification:</div>
                  <div className="mono" style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: '6px', lineHeight: '1.4' }}>
                    Transfer: <strong>{checkoutSession.amount_usdc} USDC</strong> (Decimals: 6)<br />
                    To: <strong>{checkoutSession.payment_details.recipient}</strong> (Safe 3/5)<br />
                    Contract: <strong>{checkoutSession.payment_details.token_address}</strong> (Arbitrum Native USDC)
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  onClick={handleConfirmOnchainPayment}
                  disabled={isProcessing}
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px', justifyContent: 'center', background: '#10b981', borderColor: '#059669' }}
                >
                  {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  EXECUTE & CONFIRM ONCHAIN SETTLEMENT
                </button>
                <button
                  onClick={() => setCheckoutSession(null)}
                  className="btn-outline"
                  style={{ padding: '10px 16px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Payment Success View */}
          {paymentSuccess && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>
                <CheckCircle2 size={20} />
                ONCHAIN USDC PAYMENT CONFIRMED & LICENSE ACTIVATED!
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '12px' }}>
                {paymentSuccess.message}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>New License Key</div>
                  <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
                    {paymentSuccess.subscription.license_key}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Tx Hash Receipt</div>
                  <div className="mono" style={{ fontSize: '0.75rem', color: '#38bdf8', wordBreak: 'break-all' }}>
                    {paymentSuccess.receipt.tx_hash}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Amount Settled</div>
                  <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                    ${paymentSuccess.receipt.amount_usdc.toLocaleString()} USDC
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historical Onchain Settlement Ledger */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={16} color="#38bdf8" />
          RECENT MULTI-CHAIN USDC SETTLEMENT AUDIT TRAIL
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Tx ID</th>
                <th style={{ padding: '8px' }}>Plan</th>
                <th style={{ padding: '8px' }}>Chain</th>
                <th style={{ padding: '8px' }}>Amount</th>
                <th style={{ padding: '8px' }}>Payer</th>
                <th style={{ padding: '8px' }}>Onchain Tx Hash</th>
                <th style={{ padding: '8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {catalog?.recent_payments?.map((tx, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="mono" style={{ padding: '8px', color: '#94a3b8' }}>{tx.tx_id}</td>
                  <td style={{ padding: '8px', fontWeight: 600 }}>{tx.plan}</td>
                  <td style={{ padding: '8px' }}>
                    <span className={`badge ${tx.chain.includes('Solana') ? 'badge-purple' : 'badge-cyan'}`} style={{ fontSize: '0.65rem' }}>
                      {tx.chain}
                    </span>
                  </td>
                  <td className="mono" style={{ padding: '8px', fontWeight: 700, color: '#34d399' }}>
                    ${tx.amount_usdc.toLocaleString()} USDC
                  </td>
                  <td className="mono" style={{ padding: '8px', color: 'var(--text-dim)' }}>{tx.payer}</td>
                  <td className="mono" style={{ padding: '8px', color: '#38bdf8' }}>
                    {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-8)}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
