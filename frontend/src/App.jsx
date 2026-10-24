import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GlobalAgriMap from './components/GlobalAgriMap';
import MLYieldForecast from './components/MLYieldForecast';
import CBOTQuantTerminal from './components/CBOTQuantTerminal';
import ParametricInsurance from './components/ParametricInsurance';
import AgentCommandTerminal from './components/AgentCommandTerminal';
import InteractiveControlHub from './components/InteractiveControlHub';
import EnterpriseSecurityVaultHub from './components/EnterpriseSecurityVaultHub';
import OnchainUSDCBillingHub from './components/OnchainUSDCBillingHub';
import { 
  fetchSystemState, 
  injectClimateShock, 
  resetPolicyClaim, 
  triggerAgentCycle, 
  createWebSocketConnection, 
  updateEnsoPhase,
  executeManualTrade,
  createCustomPolicy,
  toggleMultiSigSignature
} from './services/api';

export default function App() {
  const [state, setState] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL_OVERVIEW"); // "ALL_OVERVIEW" | "SATELLITE_ML" | "QUANT_CBOT" | "PARAMETRIC_INSURANCE" | "SECURITY_ONCHAIN_V2"

  const loadInitialState = async () => {
    const data = await fetchSystemState();
    if (data) setState(data);
  };

  useEffect(() => {
    loadInitialState();

    // Setup live WebSocket
    const ws = createWebSocketConnection(
      (liveData) => {
        setState(liveData);
      },
      (err) => {
        console.warn("WebSocket disconnected, polling fallback active");
      }
    );

    // Polling backup
    const interval = setInterval(async () => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        const data = await fetchSystemState();
        if (data) setState(data);
      }
    }, 4000);

    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  const handleApplyShock = async (regionId, shockLevel) => {
    const res = await injectClimateShock(regionId, shockLevel);
    if (res?.state) setState(res.state);
  };

  const handleResetPolicy = async (policyId) => {
    await resetPolicyClaim(policyId);
    const data = await fetchSystemState();
    if (data) setState(data);
  };

  const handleTriggerCycle = async () => {
    const res = await triggerAgentCycle();
    if (res?.state) setState(res.state);
  };

  const handleManualTrade = async (ticker, side, lots) => {
    const res = await executeManualTrade(ticker, side, lots);
    if (res?.portfolio) {
      const data = await fetchSystemState();
      if (data) setState(data);
    }
  };

  const handleCreatePolicy = async (policyData) => {
    const res = await createCustomPolicy(policyData);
    if (res?.vault) {
      const data = await fetchSystemState();
      if (data) setState(data);
    }
  };

  const handleToggleMultiSig = async (signerAddress, sign) => {
    const res = await toggleMultiSigSignature(signerAddress, sign);
    if (res) {
      const data = await fetchSystemState();
      if (data) setState(data);
    }
  };

  const handleInjectScenario = async (scenarioType) => {
    if (scenarioType === "US_MIDWEST_DROUGHT") {
      await updateEnsoPhase("EL_NINO_STRONG", 1.8);
      await injectClimateShock("US_MIDWEST", 0.85);
      await injectClimateShock("BRAZIL_MATO_GROSSO", 0.50);
    } else if (scenarioType === "BRAZIL_HEATWAVE") {
      await updateEnsoPhase("EL_NINO_STRONG", 1.5);
      await injectClimateShock("BRAZIL_MATO_GROSSO", 0.75);
      await injectClimateShock("ARGENTINA_PAMPAS", 0.60);
    } else if (scenarioType === "GLOBAL_BUMPER") {
      await updateEnsoPhase("NEUTRAL", 0.1);
      await injectClimateShock("US_MIDWEST", 0.05);
      await injectClimateShock("BRAZIL_MATO_GROSSO", 0.05);
      await injectClimateShock("ARGENTINA_PAMPAS", 0.05);
      await injectClimateShock("BLACK_SEA_REGION", 0.05);
    }
    const data = await fetchSystemState();
    if (data) setState(data);
  };

  if (!state) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="animate-pulse-glow" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8', marginBottom: '12px' }}>
          INITIALIZING AGRIPULSE AI AGENT...
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Establishing telemetry links to NOAA-20, ECMWF ERA5, NASA SMAP & CBOT Exchange...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Bar */}
      <Header
        ensoState={state.satellite_data?.enso_state}
        quantSummary={state.cbot_quant}
        vaultMetrics={state.parametric_insurance}
        cycleCount={state.cycle}
        onManualTrigger={handleTriggerCycle}
      />

      {/* Main Container */}
      <main style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <button
              className={`tab-button ${activeTab === 'ALL_OVERVIEW' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL_OVERVIEW')}
            >
              🛰️ Unified Mission Control
            </button>
            <button
              className={`tab-button ${activeTab === 'SATELLITE_ML' ? 'active' : ''}`}
              onClick={() => setActiveTab('SATELLITE_ML')}
            >
              🌾 Satellite & ML Engine
            </button>
            <button
              className={`tab-button ${activeTab === 'QUANT_CBOT' ? 'active' : ''}`}
              onClick={() => setActiveTab('QUANT_CBOT')}
            >
              📈 CBOT Quant (Module A)
            </button>
            <button
              className={`tab-button ${activeTab === 'SECURITY_ONCHAIN_V2' ? 'active' : ''}`}
              onClick={() => setActiveTab('SECURITY_ONCHAIN_V2')}
            >
              🛡️ Security & Onchain (Module B & Vault)
            </button>
            <button
              className={`tab-button ${activeTab === 'OPERATOR_SANDBOX' ? 'active' : ''}`}
              onClick={() => setActiveTab('OPERATOR_SANDBOX')}
            >
              🕹️ Operator Sandbox & Simulation
            </button>
            <button
              className={`tab-button ${activeTab === 'USDC_BILLING' ? 'active' : ''}`}
              onClick={() => setActiveTab('USDC_BILLING')}
              style={{ color: '#38bdf8', borderColor: activeTab === 'USDC_BILLING' ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)' }}
            >
              💳 Onchain USDC Billing
            </button>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
            Satellite Mesh Latency: 24ms | Solidity EVM Gas: 14 Gwei | CCIP: Active
          </div>
        </div>

        {/* Dynamic Views */}
        {activeTab === "ALL_OVERVIEW" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Climate Injections Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>⚡ Quick Climate Injections:</span>
                <span>Inject instant regional climate extremes into satellite feed</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleInjectScenario("US_MIDWEST_DROUGHT")}
                  className="btn-outline"
                  style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                >
                  🔥 Iowa Severe Drought (Shock 85%)
                </button>
                <button
                  onClick={() => handleInjectScenario("BRAZIL_HEATWAVE")}
                  className="btn-outline"
                  style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                >
                  ☀️ Brazil Thermal Heatwave (Shock 75%)
                </button>
                <button
                  onClick={() => handleInjectScenario("GLOBAL_BUMPER")}
                  className="btn-outline"
                  style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                >
                  🌱 Optimal Global Weather (Bumper Crop)
                </button>
              </div>
            </div>

            {/* Top Grid: Global Map & ML Yield Engine (Symmetric 50:50 split, Perfectly Matched Dimensions) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'stretch' }}>
              <GlobalAgriMap
                telemetryMap={state.telemetry_map}
                onApplyShock={handleApplyShock}
                activeSatellites={state.satellite_data?.active_satellites}
              />
              <MLYieldForecast
                mlYieldData={state.ml_yield}
              />
            </div>

            {/* Middle Grid: Dual Monetization (CBOT Quant + Parametric Insurance) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <CBOTQuantTerminal
                quantData={state.cbot_quant}
              />
              <ParametricInsurance
                vaultMetrics={state.parametric_insurance}
                onResetPolicy={handleResetPolicy}
              />
            </div>

            {/* Bottom: Autonomous Agent CoT Live Stream */}
            <AgentCommandTerminal
              actionLogs={state.recent_actions || []}
              onInjectScenario={handleInjectScenario}
              onTriggerCycle={handleTriggerCycle}
            />
          </div>
        )}

        {activeTab === "SATELLITE_ML" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <GlobalAgriMap
              telemetryMap={state.telemetry_map}
              onApplyShock={handleApplyShock}
              activeSatellites={state.satellite_data?.active_satellites}
            />
            <MLYieldForecast
              mlYieldData={state.ml_yield}
            />
          </div>
        )}

        {activeTab === "QUANT_CBOT" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <CBOTQuantTerminal
              quantData={state.cbot_quant}
            />
          </div>
        )}

        {activeTab === "SECURITY_ONCHAIN_V2" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <EnterpriseSecurityVaultHub
              securityGate={state.security_gate}
              crosschainBridge={state.crosschain_bridge}
              parametricMetrics={state.parametric_insurance}
              onToggleMultiSig={handleToggleMultiSig}
            />
            <ParametricInsurance
              vaultMetrics={state.parametric_insurance}
              onResetPolicy={handleResetPolicy}
            />
          </div>
        )}

        {activeTab === "OPERATOR_SANDBOX" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <InteractiveControlHub
              onInjectScenario={handleInjectScenario}
              onManualTrade={handleManualTrade}
              onCreatePolicy={handleCreatePolicy}
              onApplyShock={handleApplyShock}
              telemetryMap={state.telemetry_map}
            />
          </div>
        )}

        {activeTab === "USDC_BILLING" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <OnchainUSDCBillingHub />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '14px 24px',
        fontSize: '0.75rem',
        color: 'var(--text-dim)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(7, 9, 14, 0.95)'
      }}>
        <div>
          AgriPulse AI Agent Platform • Extreme Climate Satellite & Crop Yield Shock Hedging Engine
        </div>
        <div className="mono">
          EVM Contract: 0x8a92...e41b | Chainlink Weather Oracle ID: 0x4f82...99a0
        </div>
      </footer>
    </div>
  );
}
