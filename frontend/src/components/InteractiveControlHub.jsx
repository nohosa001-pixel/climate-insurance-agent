import React, { useState } from 'react';
import { Sliders, TrendingUp, ShieldPlus, Zap, Flame, Droplets, RefreshCw, Send, CheckCircle2, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

export default function InteractiveControlHub({
  onInjectScenario,
  onManualTrade,
  onCreatePolicy,
  onApplyShock,
  telemetryMap
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Simulator State
  const [simTemp, setSimTemp] = useState(36.5);
  const [simSoil, setSimSoil] = useState(16.0);
  const [simDryDays, setSimDryDays] = useState(24);
  const [simStage, setSimStage] = useState("SILKING"); // SILKING or VEGETATIVE

  // Trade Desk State
  const [tradeTicker, setTradeTicker] = useState("ZC");
  const [tradeSide, setTradeSide] = useState("BUY_LONG");
  const [tradeLots, setTradeLots] = useState(50);
  const [tradeStatus, setTradeStatus] = useState("");

  // Policy Creator State
  const [policyHolder, setPolicyHolder] = useState("Illinois Agri-Venture Fund");
  const [policyRegion, setPolicyRegion] = useState("US_MIDWEST");
  const [policyCrop, setPolicyCrop] = useState("CORN");
  const [policyCoverage, setPolicyCoverage] = useState(500000);
  const [policyStatus, setPolicyStatus] = useState("");

  // Real-time What-If Yield Calculation
  const stageWeight = simStage === "SILKING" ? 1.5 : 1.0;
  const eddVal = Math.max(0, simTemp - 30.0) * (simDryDays / 2.0);
  const soilDeficitPenalty = simSoil < 35.0 ? ((35.0 - simSoil) / 35.0) * 14.0 * stageWeight : 0;
  const heatPenalty = (eddVal / 10.0) * 3.0 * stageWeight;
  const droughtPenalty = simDryDays > 14 ? (simDryDays - 14) * 0.8 * stageWeight : 0;
  const simulatedYieldLossPct = Math.min(55.0, (soilDeficitPenalty + heatPenalty + droughtPenalty)).toFixed(1);

  const handleExecuteTrade = async (e) => {
    e.preventDefault();
    setTradeStatus("Submitting Order to CBOT Matching Engine...");
    if (onManualTrade) {
      await onManualTrade(tradeTicker, tradeSide, parseInt(tradeLots));
      setTradeStatus(`✔ Order Filled: ${tradeSide} ${tradeLots} Lots on ${tradeTicker}`);
      setTimeout(() => setTradeStatus(""), 4000);
    }
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    setPolicyStatus("Broadcasting Smart Contract to EVM Blockchain...");
    if (onCreatePolicy) {
      await onCreatePolicy({
        holder_name: policyHolder,
        region_id: policyRegion,
        crop_type: policyCrop,
        coverage_usd: parseFloat(policyCoverage),
        soil_moisture_trigger: 20.0,
        dry_days_trigger: 21,
        spei_trigger: -1.8,
        edd_heat_trigger: 35.0
      });
      setPolicyStatus(`✔ Smart Contract Policy Issued for ${policyHolder} ($${policyCoverage.toLocaleString()})`);
      setTimeout(() => setPolicyStatus(""), 4000);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
      {/* Title & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '6px', background: 'rgba(6, 182, 212, 0.2)', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.4)' }}>
            <Zap size={18} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>OPERATOR SANDBOX & INTERACTIVE DESK</h2>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>SIMULATION READY</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Test what-if climate shocks, manual CBOT futures execution, and smart contract issuance
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Quick Scenario Preset Buttons */}
          <button
            onClick={() => onInjectScenario("US_MIDWEST_DROUGHT")}
            className="btn-outline"
            style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#fb7185' }}
          >
            🔥 Iowa Drought
          </button>
          <button
            onClick={() => onInjectScenario("BRAZIL_HEATWAVE")}
            className="btn-outline"
            style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#fbbf24' }}
          >
            ☀️ Brazil Heatwave
          </button>
          <button
            onClick={() => onInjectScenario("GLOBAL_BUMPER")}
            className="btn-outline"
            style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#34d399' }}
          >
            🌱 Bumper Crop
          </button>

          {/* Toggle Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: isExpanded ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: isExpanded ? '#38bdf8' : 'var(--text-dim)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            {isExpanded ? (
              <><span>Collapse Desk</span> <ChevronUp size={14} /></>
            ) : (
              <><span>Expand Manual Desk</span> <ChevronDown size={14} /></>
            )}
          </button>
        </div>
      </div>

      {/* 3 Interactive Columns (Only shown when expanded) */}
      {isExpanded && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '14px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
        
        {/* Box 1: What-If Yield Impact Calculator */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Sliders size={16} color="#fbbf24" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>
              1. What-If Yield Shock Simulator
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem', flex: 1 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Peak Temp (T_max):</span>
                <span className="mono" style={{ color: '#fb7185', fontWeight: 700 }}>{simTemp}°C ({simTemp > 30 ? `EDD +${(simTemp - 30).toFixed(1)}°C` : 'No EDD'})</span>
              </div>
              <input
                type="range" min="24" max="42" step="0.5" value={simTemp}
                onChange={(e) => setSimTemp(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#fb7185' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Root Soil Moisture:</span>
                <span className="mono" style={{ color: simSoil < 20 ? '#fb7185' : '#38bdf8', fontWeight: 700 }}>{simSoil}%</span>
              </div>
              <input
                type="range" min="8" max="40" step="1" value={simSoil}
                onChange={(e) => setSimSoil(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Consecutive Dry Days:</span>
                <span className="mono" style={{ color: simDryDays > 20 ? '#fb7185' : '#fbbf24', fontWeight: 700 }}>{simDryDays} Days</span>
              </div>
              <input
                type="range" min="0" max="45" step="1" value={simDryDays}
                onChange={(e) => setSimDryDays(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#fbbf24' }}
              />
            </div>

            {/* Calculated Yield Loss Banner */}
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', padding: '10px', borderRadius: '6px', marginTop: 'auto', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>ESTIMATED CROP YIELD LOSS (ΔY)</div>
              <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f43f5e' }}>
                -{simulatedYieldLossPct}% Loss
              </div>
              <div style={{ fontSize: '0.65rem', color: '#fb7185', marginTop: '2px' }}>
                {simulatedYieldLossPct > 20 ? '⚠️ Severe Disaster Level ➔ Triggers Auto-Payout' : 'Moderate Stress'}
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Manual CBOT Order Desk */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <TrendingUp size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
              2. Manual CBOT Futures Order Desk
            </span>
          </div>

          <form onSubmit={handleExecuteTrade} style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem', flex: 1 }}>
            <div>
              <label style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '3px' }}>CBOT Instrument</label>
              <select
                value={tradeTicker}
                onChange={(e) => setTradeTicker(e.target.value)}
                style={{ width: '100%', background: 'rgba(2, 6, 23, 0.8)', color: 'white', border: '1px solid var(--border-subtle)', padding: '6px 8px', borderRadius: '6px' }}
              >
                <option value="ZC">ZC - CBOT Corn Futures (5,000 bu/lot)</option>
                <option value="ZS">ZS - CBOT Soybeans Futures (5,000 bu/lot)</option>
                <option value="ZW">ZW - CBOT Wheat Futures (5,000 bu/lot)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '3px' }}>Side</label>
                <select
                  value={tradeSide}
                  onChange={(e) => setTradeSide(e.target.value)}
                  style={{ width: '100%', background: 'rgba(2, 6, 23, 0.8)', color: tradeSide.includes('BUY') ? '#34d399' : '#fb7185', fontWeight: 700, border: '1px solid var(--border-subtle)', padding: '6px 8px', borderRadius: '6px' }}
                >
                  <option value="BUY_LONG">BUY / LONG</option>
                  <option value="SELL_SHORT">SELL / SHORT</option>
                </select>
              </div>
              <div>
                <label style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '3px' }}>Lots (Contracts)</label>
                <input
                  type="number" min="1" max="500" value={tradeLots}
                  onChange={(e) => setTradeLots(e.target.value)}
                  style={{ width: '100%', background: 'rgba(2, 6, 23, 0.8)', color: 'white', border: '1px solid var(--border-subtle)', padding: '6px 8px', borderRadius: '6px' }}
                />
              </div>
            </div>

            {tradeStatus && (
              <div style={{ fontSize: '0.7rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '4px' }}>
                {tradeStatus}
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }}>
              <Send size={14} /> SUBMIT CBOT ORDER
            </button>
          </form>
        </div>

        {/* Box 3: Issue Parametric Insurance Smart Contract */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ShieldPlus size={16} color="#10b981" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
              3. Issue Parametric Smart Contract
            </span>
          </div>

          <form onSubmit={handleCreatePolicy} style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', flex: 1 }}>
            <div>
              <label style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Insured Cooperative / Enterprise</label>
              <input
                type="text" value={policyHolder}
                onChange={(e) => setPolicyHolder(e.target.value)}
                style={{ width: '100%', background: 'rgba(2, 6, 23, 0.8)', color: 'white', border: '1px solid var(--border-subtle)', padding: '5px 8px', borderRadius: '6px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Region</label>
                <select
                  value={policyRegion}
                  onChange={(e) => setPolicyRegion(e.target.value)}
                  style={{ width: '100%', background: 'rgba(2, 6, 23, 0.8)', color: 'white', border: '1px solid var(--border-subtle)', padding: '5px 8px', borderRadius: '6px' }}
                >
                  <option value="US_MIDWEST">US Midwest (Corn/Soy)</option>
                  <option value="BRAZIL_MATO_GROSSO">Brazil Mato Grosso</option>
                  <option value="ARGENTINA_PAMPAS">Argentina Pampas</option>
                  <option value="BLACK_SEA_REGION">Black Sea Basin</option>
                </select>
              </div>
              <div>
                <label style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Coverage (USDC)</label>
                <input
                  type="number" step="50000" min="50000" max="2000000" value={policyCoverage}
                  onChange={(e) => setPolicyCoverage(e.target.value)}
                  style={{ width: '100%', background: 'rgba(2, 6, 23, 0.8)', color: '#38bdf8', fontWeight: 700, border: '1px solid var(--border-subtle)', padding: '5px 8px', borderRadius: '6px' }}
                />
              </div>
            </div>

            {policyStatus && (
              <div style={{ fontSize: '0.7rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '4px' }}>
                {policyStatus}
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: 'auto', width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', borderColor: '#10b981' }}>
              <ShieldPlus size={14} /> ISSUE SMART CONTRACT POLICY
            </button>
          </form>
        </div>

      </div>
      )}
    </div>
  );
}
