import crypto from "crypto";

function hash(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function buildMerkleTree(hashes) {
  if (hashes.length === 1) return hashes;

  const newLevel = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = hashes[i + 1] || left;
    newLevel.push(hash(left + right));
  }
  return buildMerkleTree(newLevel);
}

export function generateMerkleRoot(auditHashes) {
  return buildMerkleTree(auditHashes)[0];
}
