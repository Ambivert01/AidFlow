import { ethers } from "ethers";
import contractABI from "./AidFlowAuditABI.json";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);

const contract = new ethers.Contract(
  process.env.AUDIT_CONTRACT_ADDRESS,
  contractABI,
  signer
);

export async function logAuditOnChain({ jobIdHash, auditHash, campaignId }) {
  const tx = await contract.logAudit(
    jobIdHash,
    auditHash,
    campaignId
  );
  await tx.wait();
  return tx.hash;
}
