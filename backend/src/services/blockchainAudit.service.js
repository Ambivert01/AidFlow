import { ethers } from "ethers";
import contractABI from "../abi/AidFlowAuditABI.js";

// -----------------------------
// Provider (read-only)
// -----------------------------
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// -----------------------------
// Signer + write contract (OPTIONAL)
// -----------------------------
let writeContract = null;

// Validate private key safely
const pk = process.env.BLOCKCHAIN_PRIVATE_KEY;

if (
  pk &&
  pk.startsWith("0x") &&
  pk.length === 66 &&
  process.env.AUDIT_CONTRACT_ADDRESS
) {
  try {
    const signer = new ethers.Wallet(pk, provider);

    writeContract = new ethers.Contract(
      process.env.AUDIT_CONTRACT_ADDRESS,
      contractABI,
      signer
    );

    console.log("Blockchain signer initialized");
  } catch (err) {
    console.warn(
      "Blockchain signer disabled (invalid private key)",
      err.message
    );
  }
} else {
  console.warn("Blockchain signer disabled (env not configured)");
}

// -----------------------------
// Read-only contract (ALWAYS SAFE)
// -----------------------------
const readContract = process.env.AUDIT_CONTRACT_ADDRESS
  ? new ethers.Contract(
      process.env.AUDIT_CONTRACT_ADDRESS,
      contractABI,
      provider
    )
  : null;

// =======================================================
// WRITE: Log audit on-chain (OPTIONAL, SAFE)
// =======================================================
export async function logAuditOnChain({
  jobIdHash,
  auditHash,
  campaignId,
}) {
  if (!writeContract) {
    console.warn("Blockchain logging skipped (signer unavailable)");
    return null;
  }

  const tx = await writeContract.logAudit(
    jobIdHash,
    auditHash,
    campaignId
  );

  await tx.wait();
  return tx.hash;
}

// =======================================================
// READ: Verify audit hash on-chain (PUBLIC)
// =======================================================
export async function verifyOnChain(auditHash) {
  try {
    if (!auditHash || !readContract) return false;

    const record = await readContract.getAudit(auditHash);

    // Empty struct → not found
    if (!record || record.hash === ethers.ZeroHash) {
      return false;
    }

    return true;
  } catch (err) {
    console.error("verifyOnChain error:", err.message);
    return false;
  }
}
