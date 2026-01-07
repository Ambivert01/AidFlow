export const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,

  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,

  blockchain: {
    rpcUrl: process.env.RPC_URL,
    contract: process.env.AUDIT_CONTRACT_ADDRESS,
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || null,
  },

  aiAgents: {
    eligibility: process.env.AI_ELIGIBILITY_URL || "http://localhost:8001",
    fraud: process.env.AI_FRAUD_URL || "http://localhost:8002",
    risk: process.env.AI_RISK_URL || "http://localhost:8003",
  },
};
