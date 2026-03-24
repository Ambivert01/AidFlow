// src/infrastructure/blockchain/audit.service.js

import crypto from "crypto";
import logger from "../../utils/logger.js";

class BlockchainAuditService {
  constructor() {
    this.pendingHashes = [];
  }

  hashEvent(data) {
    const payload = JSON.stringify(data);

    return crypto.createHash("sha256").update(payload).digest("hex");
  }

  appendMerkleNode(hash) {
    this.pendingHashes.push(hash);
  }

  generateMerkleRoot() {
    if (this.pendingHashes.length === 0) {
      return null;
    }

    let nodes = [...this.pendingHashes];

    while (nodes.length > 1) {
      const temp = [];

      for (let i = 0; i < nodes.length; i += 2) {
        const left = nodes[i];

        const right = nodes[i + 1] || left;

        const combined = this.hashEvent(left + right);

        temp.push(combined);
      }

      nodes = temp;
    }

    return nodes[0];
  }

  async anchorRoot() {
    const root = this.generateMerkleRoot();

    if (!root) return;

    try {
      // placeholder for actual blockchain call

      const txHash = "0x" + root.slice(0, 32);

      logger.info({
        type: "BLOCKCHAIN_ANCHOR",

        root,

        txHash,
      });

      this.pendingHashes = [];

      return {
        root,

        txHash,
      };
    } catch (error) {
      logger.error({
        type: "BLOCKCHAIN_ERROR",

        message: error.message,
      });

      throw new Error("BLOCKCHAIN_ANCHOR_FAILED");
    }
  }

  async recordAuditEvent(event) {
    const hash = this.hashEvent(event);

    this.appendMerkleNode(hash);

    return hash;
  }
}

export default new BlockchainAuditService();
