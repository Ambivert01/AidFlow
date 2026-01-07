import { ethers } from "ethers";
import contractABI from "../abi/AidFlowAuditABI.js";

// PROVIDER 
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// SIGNER (OPTIONAL WRITE) 
let writeContract = null;
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
    console.warn("⚠ Blockchain signer disabled:", err.message);
  }
} else {
  console.warn("⚠ Blockchain signer disabled (env not configured)");
}

// READ-ONLY CONTRACT 
const readContract = process.env.AUDIT_CONTRACT_ADDRESS
  ? new ethers.Contract(
      process.env.AUDIT_CONTRACT_ADDRESS,
      contractABI,
      provider
    )
  : null;

// WRITE: LOG AUDIT ON-CHAIN 
export async function logAuditOnChain({
  jobIdHash,
  auditHash,
  campaignId,
}) {
  if (!writeContract) return null;

  // CRITICAL: Convert jobIdHash → bytes32
  const jobHashBytes32 = ethers.keccak256(
    ethers.toUtf8Bytes(jobIdHash)
  );

  // Ensure auditHash is bytes32
  const auditHashBytes32 = ethers.zeroPadValue(
    "0x" + auditHash,
    32
  );

  const tx = await writeContract.logAudit(
    jobHashBytes32,
    auditHashBytes32,
    campaignId
  );

  await tx.wait();
  return tx.hash;
}

// ---------------- READ: VERIFY AUDIT ----------------
export async function verifyOnChain(jobIdHash) {
  try {
    if (!jobIdHash || !readContract) return false;

    const jobHashBytes32 = ethers.keccak256(
      ethers.toUtf8Bytes(jobIdHash)
    );

    const [auditHash, campaignId, timestamp] =
      await readContract.verifyAudit(jobHashBytes32);

    if (!auditHash || auditHash === ethers.ZeroHash) return false;

    return {
      auditHash,
      campaignId,
      timestamp: Number(timestamp),
    };
  } catch (err) {
    console.error("verifyOnChain error:", err.message);
    return false;
  }
}
