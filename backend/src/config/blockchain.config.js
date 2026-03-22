import { env } from "./env.config.js";

export const blockchainConfig = {

  rpcUrl: env.RPC_URL,

  contractAddress: env.AUDIT_CONTRACT_ADDRESS,

  privateKey: env.BLOCKCHAIN_PRIVATE_KEY,

};