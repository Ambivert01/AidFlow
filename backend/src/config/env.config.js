import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV,

  PORT: process.env.PORT,

  // Comma-separated list supported, e.g. "http://localhost:5173,https://app.aidflow.org"
  FRONTEND_URL: process.env.FRONTEND_URL,

  MONGO_URI: process.env.MONGO_URI,

  JWT_SECRET: process.env.JWT_SECRET,

  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,

  // Dedicated secret for QR wallet-payment tokens. MUST be different from
  // JWT_SECRET - if it isn't set we deliberately do NOT fall back to
  // JWT_SECRET (see payment.service.js), since that would let anyone who
  // can sign one kind of token also sign the other.
  QR_SECRET: process.env.QR_SECRET,

  // Secret used to HMAC-hash PII (Aadhaar, phone) at rest. Must differ from
  // JWT_SECRET and QR_SECRET.
  PII_HASH_SECRET: process.env.PII_HASH_SECRET,

  REDIS_HOST: process.env.REDIS_HOST,

  REDIS_PORT: process.env.REDIS_PORT,

  // Render and other managed providers expose a single URL instead of host/port.
  // redis.config.js prefers this over REDIS_HOST/REDIS_PORT when set.
  REDIS_URL: process.env.REDIS_URL,

  AI_ELIGIBILITY_URL: process.env.AI_ELIGIBILITY_URL,

  AI_FRAUD_URL: process.env.AI_FRAUD_URL,

  AI_RISK_URL: process.env.AI_RISK_URL,

  AI_PROOF_URL: process.env.AI_PROOF_URL,

  RPC_URL: process.env.RPC_URL,

  AUDIT_CONTRACT_ADDRESS: process.env.AUDIT_CONTRACT_ADDRESS,

  BLOCKCHAIN_PRIVATE_KEY: process.env.BLOCKCHAIN_PRIVATE_KEY,
};

// Export individual constants for convenience
export const {
  NODE_ENV,
  PORT,
  FRONTEND_URL,
  MONGO_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  QR_SECRET,
  PII_HASH_SECRET,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_URL,
  AI_ELIGIBILITY_URL,
  AI_FRAUD_URL,
  AI_RISK_URL,
  AI_PROOF_URL,
  RPC_URL,
  AUDIT_CONTRACT_ADDRESS,
  BLOCKCHAIN_PRIVATE_KEY,
} = env;

/**
 * Parses FRONTEND_URL into an array of allowed origins for CORS.
 * Supports comma-separated values for multi-environment deployments.
 */
export const getAllowedOrigins = () => {
  if (!env.FRONTEND_URL) return [];
  return env.FRONTEND_URL.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

/**
 * Validates that all required env vars are present at startup.
 * Fails fast and loudly instead of letting the app boot into a broken state.
 */
export const validateEnv = () => {
  const required = ["MONGO_URI", "JWT_SECRET", "FRONTEND_URL", "QR_SECRET"];

  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `[CONFIG] Missing required environment variables: ${missing.join(", ")}. ` +
        `Check your .env file against .env.example.`,
    );
  }

  if (env.QR_SECRET && env.QR_SECRET === env.JWT_SECRET) {
    throw new Error(
      "[CONFIG] QR_SECRET must not be the same value as JWT_SECRET — " +
        "they protect different trust boundaries (auth tokens vs wallet payment tokens).",
    );
  }

  if (env.NODE_ENV === "production" && !env.PII_HASH_SECRET) {
    console.warn(
      "[CONFIG WARNING] PII_HASH_SECRET is not set. Aadhaar/phone hashing will fall back to unsalted SHA-256, which is reversible via rainbow tables. Set PII_HASH_SECRET before going to production.",
    );
  }
};
