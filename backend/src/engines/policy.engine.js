class PolicyEngine {
  validateTransaction(policy, context) {
    this.checkExpiry(policy, context);
    this.checkCategory(policy, context);
    this.checkMerchant(policy, context);
    this.checkTransactionLimit(policy, context);
    this.checkDailyLimit(policy, context);
    this.checkGeoFence(policy, context);

    return true;
  }

  checkCategory(policy, context) {
    if (!policy.allowedCategories.includes(context.category)) {
      throw new Error("CATEGORY_NOT_ALLOWED");
    }
  }

  checkMerchant(policy, context) {
    if (policy.allowedMerchants?.length) {
      if (!policy.allowedMerchants.includes(context.merchantId)) {
        throw new Error("MERCHANT_NOT_ALLOWED");
      }
    }
  }

  checkTransactionLimit(policy, context) {
    if (context.amount > policy.maxPerTransaction) {
      throw new Error("AMOUNT_EXCEEDS_LIMIT");
    }
  }

  checkDailyLimit(policy, context) {
    if (context.todaySpent + context.amount > policy.dailyLimit) {
      throw new Error("DAILY_LIMIT_EXCEEDED");
    }
  }

  checkExpiry(policy, context) {
    const now = new Date();

    if (now > new Date(context.walletExpiry)) {
      throw new Error("WALLET_EXPIRED");
    }
  }

  checkGeoFence(policy, context) {
    if (!policy.geoFence) return;

    const distance = this.calculateDistance(
      policy.geoFence.lat,
      policy.geoFence.lng,
      context.lat,
      context.lng,
    );

    if (distance > policy.geoFence.radiusKm) {
      throw new Error("OUTSIDE_ALLOWED_AREA");
    }
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;

    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  toRad(value) {
    return (value * Math.PI) / 180;
  }
}

export default new PolicyEngine();
