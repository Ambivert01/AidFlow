import dotenv from "dotenv";

dotenv.config();

export const env = {

  NODE_ENV: process.env.NODE_ENV,

  PORT: process.env.PORT,

  FRONTEND_URL: process.env.FRONTEND_URL,

  MONGO_URI: process.env.MONGO_URI,

  JWT_SECRET: process.env.JWT_SECRET,

  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

  REDIS_HOST: process.env.REDIS_HOST,

  REDIS_PORT: process.env.REDIS_PORT,

  AI_ELIGIBILITY_URL: process.env.AI_ELIGIBILITY_URL,

  AI_FRAUD_URL: process.env.AI_FRAUD_URL,

  AI_RISK_URL: process.env.AI_RISK_URL,

  RPC_URL: process.env.RPC_URL,

  AUDIT_CONTRACT_ADDRESS: process.env.AUDIT_CONTRACT_ADDRESS,

  BLOCKCHAIN_PRIVATE_KEY: process.env.BLOCKCHAIN_PRIVATE_KEY,

};