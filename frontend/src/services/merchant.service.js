import api from "./api";

/** Get current merchant's profile */
export const getMyProfile = () => api.get("/merchant/me");

/** Get merchant's transaction history */
export const getTransactions = () => api.get("/merchant/transactions");

/** Scan a beneficiary QR token - returns wallet info */
export const scanQR = (qrToken) =>
  api.post("/payments/scan", { qrToken });

/** Confirm payment using raw QR token */
export const confirmPayment = ({ qrToken, amount, category }) =>
  api.post("/payments/confirm", { qrToken, amount, category });
