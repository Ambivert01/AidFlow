import crypto from "crypto";
import { ethers } from "ethers";
import { logger } from "../../utils/logger.js";
import { blockchainConfig } from "../../config/blockchain.config.js";

// ABI — only the functions we need
const ABI = [
  "function logAudit(bytes32 jobIdHash, bytes32 auditHash, string calldata campaignId) external",
  "function verifyAudit(bytes32 jobIdHash) external view returns (bytes32 auditHash, string memory campaignId, uint256 timestamp)",
  "event AuditLogged(bytes32 indexed jobIdHash, bytes32 auditHash, string campaignId, uint256 timestamp)",
];

class BlockchainAuditService {
  constructor() {
    this.pendingHashes = [];
    this.provider = null;
    this.contract = null;
    this._init();
  }

  _init() {
    try {
      if (!blockchainConfig.rpcUrl || !blockchainConfig.privateKey || !blockchainConfig.contractAddress) {
        logger.warn({ type: "BLOCKCHAIN_SKIPPED", reason: "Missing config — running in mock mode" });
        return;
      }
      if (
        blockchainConfig.privateKey === "0x0000000000000000000000000000000000000000000000000000000000000000" ||
        blockchainConfig.contractAddress === "0x0000000000000000000000000000000000000000"
      ) {
        logger.warn({ type: "BLOCKCHAIN_SKIPPED", reason: "Placeholder config — running in mock mode" });
        return;
      }
      this.provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
      const wallet = new ethers.Wallet(blockchainConfig.privateKey, this.provider);
      this.contract = new ethers.Contract(blockchainConfig.contractAddress, ABI, wallet);
      logger.info({ type: "BLOCKCHAIN_READY", contract: blockchainConfig.contractAddress });
    } catch (err) {
      logger.error({ type: "BLOCKCHAIN_INIT_ERROR", message: err.message });
    }
  }

  hashEvent(data) {
    return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
  }

  appendMerkleNode(hash) {
    this.pendingHashes.push(hash);
  }

  generateMerkleRoot() {
    if (!this.pendingHashes.length) return null;
    let nodes = [...this.pendingHashes];
    while (nodes.length > 1) {
      const temp = [];
      for (let i = 0; i < nodes.length; i += 2) {
        const left = nodes[i];
        const right = nodes[i + 1] || left;
        temp.push(this.hashEvent(left + right));
      }
      nodes = temp;
    }
    return nodes[0];
  }

  async anchorRoot(jobIdHash = "BATCH", campaignId = "") {
    const root = this.generateMerkleRoot();
    if (!root) return null;

    try {
      let txHash;

      if (this.contract) {
        // Real blockchain call
        const jobIdBytes = ethers.encodeBytes32String(jobIdHash.slice(0, 31));
        const rootBytes = "0x" + root;
        const tx = await this.contract.logAudit(jobIdBytes, rootBytes, campaignId);
        const receipt = await tx.wait();
        txHash = receipt.hash;
        logger.info({ type: "BLOCKCHAIN_ANCHORED", root, txHash, jobIdHash });
      } else {
        // Mock mode — simulate tx hash
        txHash = "0x" + root.slice(0, 64);
        logger.info({ type: "BLOCKCHAIN_MOCK_ANCHOR", root, txHash });
      }

      this.pendingHashes = [];
      return { root, txHash };
    } catch (error) {
      logger.error({ type: "BLOCKCHAIN_ERROR", message: error.message });
      // Don't throw — system continues without blockchain
      return null;
    }
  }

  async verifyAudit(jobIdHash) {
    if (!this.contract) {
      return { verified: false, reason: "Blockchain not configured" };
    }
    try {
      const jobIdBytes = ethers.encodeBytes32String(jobIdHash.slice(0, 31));
      const [auditHash, campaignId, timestamp] = await this.contract.verifyAudit(jobIdBytes);
      return {
        verified: true,
        auditHash,
        campaignId,
        timestamp: Number(timestamp),
        anchoredAt: new Date(Number(timestamp) * 1000).toISOString(),
      };
    } catch (err) {
      return { verified: false, reason: err.message };
    }
  }

  async recordAuditEvent(event) {
    const hash = this.hashEvent(event);
    this.appendMerkleNode(hash);
    return hash;
  }
}

export default new BlockchainAuditService();
