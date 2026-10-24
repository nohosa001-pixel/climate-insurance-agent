const API_BASE_URL = window.location.port === "5173" ? "http://localhost:8000" : "";
const WS_BASE_URL = window.location.port === "5173" 
  ? "ws://localhost:8000/ws" 
  : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;

export async function fetchSystemState() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/state`);
    if (!res.ok) throw new Error("Failed to fetch state");
    return await res.json();
  } catch (err) {
    console.error("API error:", err);
    return null;
  }
}

export async function injectClimateShock(regionId, shockLevel) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/simulate/shock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region_id: regionId, shock_level: shockLevel })
    });
    return await res.json();
  } catch (err) {
    console.error("Shock inject error:", err);
    return null;
  }
}

export async function updateEnsoPhase(phase, oni) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/simulate/enso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase, oni })
    });
    return await res.json();
  } catch (err) {
    console.error("ENSO update error:", err);
    return null;
  }
}

export async function resetPolicyClaim(policyId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/policy/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policy_id: policyId })
    });
    return await res.json();
  } catch (err) {
    console.error("Reset policy error:", err);
    return null;
  }
}

export async function triggerAgentCycle() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/agent/trigger-cycle`, {
      method: "POST"
    });
    return await res.json();
  } catch (err) {
    console.error("Trigger cycle error:", err);
    return null;
  }
}

export async function executeManualTrade(ticker, side, lots) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/cbot/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, side, lots })
    });
    return await res.json();
  } catch (err) {
    console.error("Manual trade error:", err);
    return null;
  }
}

export async function createCustomPolicy(policyData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/policy/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(policyData)
    });
    return await res.json();
  } catch (err) {
    console.error("Create policy error:", err);
    return null;
  }
}

export async function toggleMultiSigSignature(signerAddress, sign) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/security/multisig/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signer_address: signerAddress, sign })
    });
    return await res.json();
  } catch (err) {
    console.error("MultiSig toggle error:", err);
    return null;
  }
}

export async function fetchContractSource(contractName) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/contracts/source/${contractName}`);
    return await res.json();
  } catch (err) {
    console.error("Fetch contract source error:", err);
    return null;
  }
}

export async function auditEudrFarm(regionId, polygonId, canopyLossPct) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/security/eudr/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region_id: regionId, polygon_id: polygonId, canopy_loss_pct: canopyLossPct })
    });
    return await res.json();
  } catch (err) {
    console.error("EUDR audit error:", err);
    return null;
  }
}

export async function fetchCrossChainBridgeStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/crosschain/bridge`);
    return await res.json();
  } catch (err) {
    console.error("Bridge status error:", err);
    return null;
  }
}

export async function fetchBillingCatalog() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/billing/catalog`);
    if (!res.ok) throw new Error("Failed to fetch billing catalog");
    return await res.json();
  } catch (err) {
    console.error("Billing catalog error:", err);
    return null;
  }
}

export async function createBillingSession(planId, chain, payerWallet) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/billing/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planId, chain, payer_wallet: payerWallet })
    });
    return await res.json();
  } catch (err) {
    console.error("Create billing session error:", err);
    return null;
  }
}

export async function verifyBillingPayment(sessionId, payerWallet, txHash) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/billing/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, payer_wallet: payerWallet, tx_hash: txHash })
    });
    return await res.json();
  } catch (err) {
    console.error("Verify billing payment error:", err);
    return null;
  }
}

export function createWebSocketConnection(onMessage, onError) {
  const ws = new WebSocket(WS_BASE_URL);
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error("WebSocket message parse error:", e);
    }
  };
  ws.onerror = (err) => {
    console.warn("WebSocket error (falling back to REST polling):", err);
    if (onError) onError(err);
  };
  return ws;
}
