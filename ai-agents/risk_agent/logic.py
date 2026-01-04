def calculate_risk(data):
    if not data.eligibility.eligible:
        return {
            "finalRiskScore": 100,
            "decision": "BLOCK",
            "reason": "Eligibility check failed"
        }

    if data.eligibility.confidence < data.policy.minEligibilityConfidence:
        return {
            "finalRiskScore": 80,
            "decision": "MANUAL_REVIEW",
            "reason": "Low eligibility confidence"
        }

    combined_risk = int(data.fraud.riskScore * 100)

    if combined_risk > data.policy.maxAllowedRisk * 100:
        decision = "MANUAL_REVIEW"
    elif combined_risk > 40:
        decision = "ALLOW_WITH_MONITORING"
    else:
        decision = "ALLOW"

    return {
        "finalRiskScore": combined_risk,
        "decision": decision,
        "reason": "Eligibility and fraud signals evaluated"
    }
