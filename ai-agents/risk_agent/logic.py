def calculate_risk(data):
    """
    AidFlow Risk Engine v2
    Combines eligibility + fraud signals → final decision
    Decision states: ALLOW | ALLOW_WITH_MONITORING | MANUAL_REVIEW | BLOCK | ESCALATE_TO_GOVT
    """

    # Gate 1: Eligibility failed → hard block
    if not data.eligibility.eligible:
        return {
            "finalRiskScore": 100,
            "decision": "BLOCK",
            "reason": "Eligibility check failed — beneficiary does not meet minimum criteria",
            "escalate": False,
        }

    # Gate 2: Low confidence → manual review
    if data.eligibility.confidence < data.policy.minEligibilityConfidence:
        return {
            "finalRiskScore": 80,
            "decision": "MANUAL_REVIEW",
            "reason": f"Eligibility confidence {data.eligibility.confidence:.2f} is below minimum threshold {data.policy.minEligibilityConfidence}",
            "escalate": False,
        }

    # Combine fraud risk score (0-100 scale)
    fraud_score_raw = getattr(data.fraud, 'riskScore', 0)
    
    # Handle both numeric and string riskScore formats
    if isinstance(fraud_score_raw, str):
        fraud_score_raw = {"HIGH": 0.75, "MEDIUM": 0.45, "LOW": 0.15}.get(fraud_score_raw, 0.0)
    
    combined_risk = int(fraud_score_raw * 100)
    max_allowed = int(data.policy.maxAllowedRisk * 100)

    # Gate 3: Extreme fraud risk → escalate to government
    if combined_risk >= 85:
        return {
            "finalRiskScore": combined_risk,
            "decision": "ESCALATE_TO_GOVT",
            "reason": f"Extreme fraud risk ({combined_risk}/100) — escalated to government authority for manual review",
            "escalate": True,
        }

    # Gate 4: High fraud risk (above policy limit) → manual review
    if combined_risk > max_allowed:
        return {
            "finalRiskScore": combined_risk,
            "decision": "MANUAL_REVIEW",
            "reason": f"Fraud risk ({combined_risk}/100) exceeds policy limit ({max_allowed}/100)",
            "escalate": False,
        }

    # Gate 5: Moderate risk → allow with monitoring
    if combined_risk > 40:
        return {
            "finalRiskScore": combined_risk,
            "decision": "ALLOW_WITH_MONITORING",
            "reason": f"Moderate risk ({combined_risk}/100) — approved with enhanced monitoring",
            "escalate": False,
        }

    # Clean pass → allow
    return {
        "finalRiskScore": combined_risk,
        "decision": "ALLOW",
        "reason": f"All signals nominal — eligibility confidence {data.eligibility.confidence:.2f}, fraud risk {combined_risk}/100",
        "escalate": False,
    }
