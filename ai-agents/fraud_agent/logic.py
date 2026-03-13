def detect_fraud(data):
    flags = []
    score = 0.0

    # 1. High frequency requests
    if data.recentTransactions > 5:
        flags.append("HIGH_FREQUENCY_REQUESTS")
        score += 0.35
    elif data.recentTransactions > 3:
        flags.append("ELEVATED_REQUEST_FREQUENCY")
        score += 0.15

    # 2. Excessive cumulative aid (adjusted for inflation)
    if data.totalAidReceived > 50000:
        flags.append("EXCESSIVE_CUMULATIVE_AID")
        score += 0.30
    elif data.totalAidReceived > 25000:
        flags.append("HIGH_CUMULATIVE_AID")
        score += 0.15

    # 3. Rapid time window (multiple requests very close together)
    if data.timeWindowHours < 6:
        flags.append("RAPID_TIME_WINDOW")
        score += 0.25
    elif data.timeWindowHours < 24:
        flags.append("SHORT_TIME_WINDOW")
        score += 0.10

    # 4. Device fingerprint — only flag if MULTIPLE requests from same device
    # Bug fix: don't flag just for having a deviceFingerprint (it's always set)
    if data.deviceFingerprint and data.deviceFingerprint not in ("", "NA", "UNKNOWN"):
        if data.recentTransactions > 2:
            flags.append("MULTIPLE_REQUESTS_SAME_DEVICE")
            score += 0.20

    # 5. Repeated merchant — only suspicious if count is high
    # Bug fix: don't flag just for merchantId being set
    if data.merchantId and data.recentTransactions > 3:
        flags.append("REPEATED_MERCHANT_USAGE")
        score += 0.10

    # Clamp score
    score = round(min(score, 1.0), 3)

    if score >= 0.65:
        risk = "HIGH"
    elif score >= 0.35:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    explanation = (
        f"Suspicious patterns detected: {', '.join(flags)}"
        if flags
        else "No abnormal behavior detected — standard activity profile"
    )

    return {
        "fraudRisk": risk,
        "riskScore": score,
        "flags": flags,
        "explanation": explanation,
    }
