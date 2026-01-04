def check_eligibility(data):
    signals = {}

    # Location match
    location_match = data.beneficiary.location.ward in data.disaster.affectedWards
    signals["locationMatch"] = location_match

    # Document score
    doc_score = min(len(data.beneficiary.documents) / 2, 1.0)
    signals["documentScore"] = doc_score

    # Historical risk
    historical_risk = min(data.beneficiary.pastAidCount * 0.3, 1.0)
    signals["historicalRisk"] = historical_risk

    # Aggregate confidence
    confidence = (
        (0.5 if location_match else 0.0) +
        (0.3 * doc_score) +
        (0.2 * (1 - historical_risk))
    )

    eligible = confidence >= 0.6

    reason = (
        "Strong location and document match"
        if eligible
        else "Insufficient confidence based on available signals"
    )

    return {
        "eligible": eligible,
        "confidence": round(confidence, 2),
        "signals": signals,
        "reason": reason
    }
