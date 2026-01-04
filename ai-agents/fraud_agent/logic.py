def detect_fraud(data):
    flags = []
    score = 0.0

    if data.recentTransactions > 3:
        flags.append("HIGH_FREQUENCY_REQUESTS")
        score += 0.3

    if data.totalAidReceived > 20000:
        flags.append("EXCESSIVE_AID_AMOUNT")
        score += 0.25

    if data.timeWindowHours < 24:
        flags.append("RAPID_TIME_WINDOW")
        score += 0.2

    if data.deviceFingerprint:
        flags.append("MULTIPLE_REQUESTS_SAME_DEVICE")
        score += 0.15

    if data.merchantId:
        flags.append("REPEATED_MERCHANT_USAGE")
        score += 0.1

    score = min(score, 1.0)

    if score >= 0.7:
        risk = "HIGH"
    elif score >= 0.4:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    explanation = (
        "Suspicious transaction patterns detected"
        if flags else
        "No abnormal behavior detected"
    )

    return {
        "fraudRisk": risk,
        "riskScore": round(score, 2),
        "flags": flags,
        "explanation": explanation
    }
