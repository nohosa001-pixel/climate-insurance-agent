import React, { useState } from 'react';
import { Terminal, Play, AlertTriangle, CloudRain, Flame, Sparkles, Filter, ChevronRight } from 'lucide-react';

export default function AgentCommandTerminal({ actionLogs, onInjectScenario, onSetEnso, onTriggerCycle }) {
  const [filterSeverity, setFilterSeverity] = useState("ALL");

  const filteredLogs = actionLogs.filter(log => {
    if (filterSeverity === "ALL") return true;
    return log.severity === filterSeverity;
  });

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header & Scenario Presets */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="#38bdf8" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>AUTONOMOUS AGENT DECISION STREAM (CoT)</h2>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Real-time Chain-of-Thought reasoning, ML yield shock triggers, and dual monetization actions
          </p>
        </div>

        {/* Severity Filter */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {["ALL", "CRITICAL", "ALERT", "INFO"].map((s) => (
            <button
              key={s}
              className={`tab-button ${filterSeverity === s ? 'active' : ''}`}
              onClick={() => setFilterSeverity(s)}
              style={{ fontSize: '0.7rem', padding: '3px 8px' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* CoT Terminal Stream Status Bar */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        padding: '8px 14px',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '0.72rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-dim)' }}>Live Reasoning:</span>
          <span className="mono" style={{ color: '#38bdf8', fontWeight: 600 }}>Multi-Spectral Telemetry → ML Shock Evaluation → Execution Gate</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>Total Logs: {actionLogs.length}</span>
          <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>BFT Verified</span>
        </div>
      </div>

      {/* CoT Terminal Log Container */}
      <div style={{
        background: 'rgba(2, 6, 23, 0.95)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '14px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        overflowY: 'auto',
        maxHeight: '380px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {filteredLogs.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '30px 0' }}>
            Agent running background telemetry heartbeat...
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isCrit = log.severity === "CRITICAL" || log.severity === "ALERT";
            return (
              <div
                key={log.id}
                style={{
                  background: isCrit ? 'rgba(244, 63, 94, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                  borderLeft: isCrit ? '3px solid #f43f5e' : log.severity === "WARNING" ? '3px solid #f59e0b' : '3px solid #38bdf8',
                  padding: '10px 12px',
                  borderRadius: '0 6px 6px 0'
                }}
              >
                {/* Meta header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-dim)' }}>[{log.timestamp}]</span>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>{log.event_type}</span>
                    <span style={{ color: '#94a3b8' }}>@{log.region_id}</span>
                  </div>
                  <span className={`badge ${isCrit ? 'badge-rose' : log.severity === "WARNING" ? 'badge-amber' : 'badge-cyan'}`} style={{ fontSize: '0.6rem' }}>
                    {log.severity}
                  </span>
                </div>

                {/* CoT Reasoning */}
                <div style={{ color: '#cbd5e1', whiteSpace: 'pre-line', marginBottom: '6px', lineHeight: '1.4' }}>
                  {log.thought_chain}
                </div>

                {/* Action & Result */}
                <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '6px 8px', borderRadius: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: '#34d399', fontWeight: 600 }}>
                    ➔ ACTION: {log.action_taken}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '2px' }}>
                    ✔ RESULT: {log.execution_result}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
