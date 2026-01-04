import { ethers } from "ethers";
import contractABI from "./AidFlowAuditABI.json";

// 🔹 Provider (read-only)
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// 🔹 Signer (write access)
const signer = new ethers.Wallet(
  process.env.BLOCKCHAIN_PRIVATE_KEY,
  provider
);

// 🔹 Contract instances
const writeContract = new ethers.Contract(
  process.env.AUDIT_CONTRACT_ADDRESS,
  contractABI,
  signer
);

const readContract = new ethers.Contract(
  process.env.AUDIT_CONTRACT_ADDRESS,
  contractABI,
  provider
);

/**
 * WRITE: Log audit on-chain (backend trusted action)
 */
export async function logAuditOnChain({
  jobIdHash,
  auditHash,
  campaignId,
}) {
  const tx = await writeContract.logAudit(
    jobIdHash,
    auditHash,
    campaignId
  );
  await tx.wait();
  return tx.hash;
}

/**
 * READ: Verify audit hash on-chain (public / backend)
 */
export async function verifyOnChain(auditHash) {
  try {
    if (!auditHash) return false;

    const record = await readContract.getAudit(auditHash);

    /*
      Solidity returns empty struct if not found.
      bytes32 default = 0x000...0
    */
    if (!record || record.hash === ethers.ZeroHash) {
      return false;
    }

    return true;
  } catch (err) {
    console.error("verifyOnChain error:", err.message);
    return false;
  }
}
