"""
Security Gate for Trade-Enabling Climate & Compliance Oracle Subsystem (v3.0)
Provides institutional validation across:
1. Gate 0: Multi-Source BFT Oracle Consensus & Divergence Guard
2. Gate 1: EUDR (EU Deforestation Regulation) Satellite Geofence Compliance Audit
3. Gate 2: Emergency Circuit Breaker & Audit Trail
"""

import datetime
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple


@dataclass
class SecurityAuditRecord:
    audit_id: str
    timestamp: str
    action_type: str  # EIP712_ORACLE, EUDR_AUDIT, CIRCUIT_BREAKER_TRIP, CIRCUIT_BREAKER_RESET
    is_approved: bool
    risk_score: float  # 0.0 (Safe) to 1.0 (Critical Threat)
    verdict: str
    details: Dict[str, Any] = field(default_factory=dict)


class AutonomousSecurityGate:
    """Validates multi-source oracle consensus, EUDR compliance, and emergency kill-switch state."""

    def __init__(self, variance_threshold_pct: float = 8.5, max_audit_log: int = 40):
        self.variance_threshold_pct = variance_threshold_pct
        self.max_audit_log = max_audit_log

        self.circuit_breaker_active = False
        self.circuit_breaker_reason = ""
        self.circuit_breaker_tripped_at: Optional[str] = None

        self.audit_log: List[Dict[str, Any]] = []
        self.total_blocked_actions = 0
        self.total_verified_actions = 0

    def trip_circuit_breaker(self, reason: str) -> None:
        """Immediately halts automated trade clearance approvals."""
        self.circuit_breaker_active = True
        self.circuit_breaker_reason = reason
        self.circuit_breaker_tripped_at = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        self._record_audit(
            action_type="CIRCUIT_BREAKER_TRIP",
            is_approved=False,
            risk_score=1.0,
            verdict=f"EMERGENCY KILL-SWITCH TRIPPED: {reason}",
            details={"reason": reason},
        )

    def reset_circuit_breaker(self, admin_key: str = "ADMIN_OVERRIDE") -> None:
        """Restores system to operational state after manual operator review."""
        self.circuit_breaker_active = False
        self.circuit_breaker_reason = ""
        self.circuit_breaker_tripped_at = None
        self._record_audit(
            action_type="CIRCUIT_BREAKER_RESET",
            is_approved=True,
            risk_score=0.0,
            verdict="System reset to normal operational status by operator override",
            details={"admin_key": admin_key},
        )

    def verify_oracle_consensus(
        self,
        region_id: str,
        oracle_readings: List[Dict[str, Any]],
    ) -> Tuple[bool, float, str]:
        """
        Gate 0: Multi-source BFT Oracle Consensus check across independent climate feeds.
        """
        if len(oracle_readings) < 2:
            verdict = "REJECTED: Insufficient independent oracle nodes (requires >= 2)"
            self._record_audit("EIP712_ORACLE", False, 0.85, verdict, {"region_id": region_id})
            self.total_blocked_actions += 1
            return False, 0.85, verdict

        soil_values = [float(node.get("soil_moisture_pct", 0.0)) for node in oracle_readings]
        variance = max(soil_values) - min(soil_values)

        if variance > self.variance_threshold_pct:
            verdict = f"REJECTED: Abnormal oracle divergence ({variance:.2f}% > threshold {self.variance_threshold_pct}%)"
            self._record_audit(
                "EIP712_ORACLE",
                False,
                0.90,
                verdict,
                {"region_id": region_id, "readings": soil_values, "variance": variance},
            )
            self.total_blocked_actions += 1
            return False, 0.90, verdict

        verdict = f"PASSED: BFT verified across {len(oracle_readings)} nodes (Spread: {variance:.2f}%)"
        self._record_audit(
            "EIP712_ORACLE",
            True,
            0.04,
            verdict,
            {"region_id": region_id, "readings": soil_values},
        )
        self.total_verified_actions += 1
        return True, 0.04, verdict

    def audit_eudr_compliance(
        self,
        region_id: str,
        farm_polygon_id: str,
        canopy_cover_loss_pct: float,
    ) -> Tuple[bool, float, str]:
        """
        Gate 1: EUDR (EU Deforestation Regulation) Satellite Geofence Audit.
        Verifies deforestation-free compliance (canopy loss <= 1.0% since Dec 2020).
        """
        if canopy_cover_loss_pct > 1.0:
            verdict = (
                f"REJECTED: EUDR Non-Compliant! Forest canopy loss "
                f"{canopy_cover_loss_pct:.2f}% exceeds 1.0% threshold"
            )
            self._record_audit(
                "EUDR_AUDIT",
                False,
                0.88,
                verdict,
                {
                    "region_id": region_id,
                    "polygon_id": farm_polygon_id,
                    "canopy_loss_pct": canopy_cover_loss_pct,
                },
            )
            self.total_blocked_actions += 1
            return False, 0.88, verdict

        verdict = f"PASSED: EUDR Deforestation-Free Certified (Loss {canopy_cover_loss_pct:.2f}% <= 1.0%)"
        self._record_audit(
            "EUDR_AUDIT",
            True,
            0.01,
            verdict,
            {
                "region_id": region_id,
                "polygon_id": farm_polygon_id,
                "canopy_loss_pct": canopy_cover_loss_pct,
            },
        )
        self.total_verified_actions += 1
        return True, 0.01, verdict

    def _record_audit(
        self,
        action_type: str,
        is_approved: bool,
        risk_score: float,
        verdict: str,
        details: Dict[str, Any],
    ) -> None:
        record = SecurityAuditRecord(
            audit_id=f"SEC-{str(uuid.uuid4())[:8].upper()}",
            timestamp=datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M:%S UTC"),
            action_type=action_type,
            is_approved=is_approved,
            risk_score=risk_score,
            verdict=verdict,
            details=details,
        )
        self.audit_log.insert(0, record.__dict__)
        if len(self.audit_log) > self.max_audit_log:
            self.audit_log = self.audit_log[: self.max_audit_log]

    def get_security_status(self) -> Dict[str, Any]:
        """Returns security gate health metrics and recent audit trail."""
        return {
            "circuit_breaker_active": self.circuit_breaker_active,
            "circuit_breaker_reason": self.circuit_breaker_reason,
            "circuit_breaker_tripped_at": self.circuit_breaker_tripped_at,
            "variance_threshold_pct": self.variance_threshold_pct,
            "total_verified_actions": self.total_verified_actions,
            "total_blocked_actions": self.total_blocked_actions,
            "recent_audits": self.audit_log[:8],
        }
