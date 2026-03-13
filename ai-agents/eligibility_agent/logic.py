def check_eligibility(data):
    signals = {}

    # 1. Location match (weighted highest)
    location_match = data.beneficiary.location.ward in data.disaster.affectedWards
    signals["locationMatch"] = location_match

    # 2. Document score (normalized 0-1 from document count)
    doc_score = min(len(data.beneficiary.documents) / 2.0, 1.0)
    signals["documentScore"] = round(doc_score, 2)

    # 3. Historical risk (diminishing returns for repeat aid recipients)
    historical_risk = min(data.beneficiary.pastAidCount * 0.25, 1.0)
    signals["historicalRisk"] = round(historical_risk, 2)

    # 4. Disaster severity bonus (severe disasters warrant broader eligibility)
    severity_bonus = min(data.disaster.severity / 3.0, 0.15)
    signals["severityBonus"] = round(severity_bonus, 2)

    # 5. Family size factor (larger families get higher weight)
    family_factor = min(data.beneficiary.familySize / 6.0, 0.1)
    signals["familyFactor"] = round(family_factor, 2)

    # 6. Displacement status (displaced = highest priority)
    displacement_scores = {
        "DISPLACED": 0.15,
        "PARTIAL": 0.08,
        "STABLE": 0.0,
        "UNKNOWN": 0.03,
    }
    displacement_score = displacement_scores.get(data.beneficiary.displacementStatus, 0.03)
    signals["displacementScore"] = displacement_score

    # 7. Vulnerability score (normalized 0-1)
    vulnerability_factor = min(data.beneficiary.vulnerabilityScore / 100.0, 1.0) * 0.1
    signals["vulnerabilityFactor"] = round(vulnerability_factor, 2)

    # ── Aggregate confidence formula ──
    confidence = (
        (0.45 if location_match else 0.0)   # Location is primary gate
        + (0.20 * doc_score)                 # Documents prove identity
        + (0.15 * (1.0 - historical_risk))   # Less history = fresher need
        + severity_bonus                     # Disaster severity
        + family_factor                      # Family burden
        + displacement_score                 # Displacement urgency
        + vulnerability_factor               # Vulnerability
    )

    # Clamp to [0, 1]
    confidence = round(min(max(confidence, 0.0), 1.0), 3)

    eligible = confidence >= 0.60

    reason = (
        "Strong eligibility signal: location match, valid documents, and displacement status confirm need."
        if eligible and location_match
        else "Location match with moderate signals — eligible but borderline."
        if eligible
        else "Insufficient confidence — location not in affected zone or insufficient documentation."
        if not location_match
        else "Insufficient eligibility confidence based on available signals."
    )

    xai_explanation = {
        "factor_weights": {
            "locationMatch": "45% weight — primary eligibility gate",
            "documentScore": "20% weight — identity verification",
            "historicalRisk": "15% weight — penalizes repeat aid (prevents abuse)",
            "severityBonus": "up to 15% — disaster severity context",
            "familySizeBonus": "up to 10% — household burden",
            "displacementStatus": "up to 15% — displacement urgency",
            "vulnerabilityFactor": "up to 10% — vulnerability signals",
        },
        "decision_threshold": 0.60,
    }

    return {
        "eligible": eligible,
        "confidence": confidence,
        "signals": signals,
        "reason": reason,
        "xai_explanation": xai_explanation,
    }
