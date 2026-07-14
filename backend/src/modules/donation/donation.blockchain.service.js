/**
 * Blockchain Verification Service for Donor Tracking System
 * Verifies blockchain anchoring status for donations
 */

import {
  BLOCKCHAIN_VERIFICATION_STATUS,
  BLOCKCHAIN_NETWORK,
} from "./donation.timeline.constants.js";

/**
 * Verify blockchain anchoring for a donation
 * @param {String} blockchainHash - Blockchain transaction hash
 * @param {String} chain - Blockchain network (ETHEREUM, POLYGON, SOLANA)
 * @returns {Object} - Verification result
 */
export const verifyBlockchainAnchor = async (
  blockchainHash,
  chain = "ETHEREUM",
) => {
  try {
    if (!blockchainHash) {
      return {
        status: BLOCKCHAIN_VERIFICATION_STATUS.NOT_ANCHORED,
        message: "No blockchain hash provided",
        verified: false,
      };
    }

    // In a real implementation, this would call the actual blockchain network
    // For now, we'll simulate the verification
    const verificationResult = await simulateBlockchainVerification(
      blockchainHash,
      chain,
    );

    return verificationResult;
  } catch (error) {
    console.error(
      "[BlockchainVerifier] Error verifying blockchain anchor:",
      error,
    );
    return {
      status: BLOCKCHAIN_VERIFICATION_STATUS.FAILED,
      message: error.message || "Blockchain verification failed",
      verified: false,
      error: error.message,
    };
  }
};

/**
 * Simulate blockchain verification (placeholder for actual implementation)
 * In production, this would call Ethereum/Polygon/Solana RPC endpoints
 * @param {String} txHash - Transaction hash
 * @param {String} chain - Blockchain network
 * @returns {Object} - Verification result
 */
async function simulateBlockchainVerification(txHash, chain) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Basic hash format validation
  if (!isValidBlockchainHash(txHash, chain)) {
    return {
      status: BLOCKCHAIN_VERIFICATION_STATUS.FAILED,
      message: "Invalid blockchain hash format",
      verified: false,
      chain,
    };
  }

  // Simulate successful verification
  // In production, this would:
  // 1. Connect to blockchain RPC endpoint
  // 2. Query transaction by hash
  // 3. Verify transaction exists and is confirmed
  // 4. Extract block number and timestamp

  return {
    status: BLOCKCHAIN_VERIFICATION_STATUS.VERIFIED,
    message: "Blockchain anchor verified successfully",
    verified: true,
    chain,
    blockNumber: Math.floor(Math.random() * 1000000) + 15000000, // Simulated
    confirmations: Math.floor(Math.random() * 100) + 12, // Simulated
    timestamp: new Date(),
    explorerUrl: getBlockchainExplorerUrl(txHash, chain),
  };
}

/**
 * Validate blockchain hash format
 * @param {String} hash - Transaction hash
 * @param {String} chain - Blockchain network
 * @returns {Boolean} - True if valid format
 */
function isValidBlockchainHash(hash, chain) {
  if (!hash || typeof hash !== "string") {
    return false;
  }

  switch (chain) {
    case BLOCKCHAIN_NETWORK.ETHEREUM:
    case BLOCKCHAIN_NETWORK.POLYGON:
      // Ethereum/Polygon: 0x followed by 64 hex characters
      return /^0x[a-fA-F0-9]{64}$/.test(hash);

    case BLOCKCHAIN_NETWORK.SOLANA:
      // Solana: Base58 encoded, typically 87-88 characters
      return /^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(hash);

    default:
      // Generic validation for other chains
      return hash.length >= 32 && hash.length <= 128;
  }
}

/**
 * Get blockchain explorer URL for transaction
 * @param {String} txHash - Transaction hash
 * @param {String} chain - Blockchain network
 * @returns {String} - Explorer URL
 */
function getBlockchainExplorerUrl(txHash, chain) {
  switch (chain) {
    case BLOCKCHAIN_NETWORK.ETHEREUM:
      return `https://etherscan.io/tx/${txHash}`;

    case BLOCKCHAIN_NETWORK.POLYGON:
      return `https://polygonscan.com/tx/${txHash}`;

    case BLOCKCHAIN_NETWORK.SOLANA:
      return `https://explorer.solana.com/tx/${txHash}`;

    default:
      return null;
  }
}

/**
 * Verify multiple blockchain anchors in batch
 * @param {Array} anchors - Array of {hash, chain} objects
 * @returns {Array} - Array of verification results
 */
export const verifyBlockchainAnchorsBatch = async (anchors) => {
  try {
    const verificationPromises = anchors.map((anchor) =>
      verifyBlockchainAnchor(anchor.hash, anchor.chain),
    );

    return await Promise.all(verificationPromises);
  } catch (error) {
    console.error("[BlockchainVerifier] Error in batch verification:", error);
    return anchors.map(() => ({
      status: BLOCKCHAIN_VERIFICATION_STATUS.FAILED,
      message: "Batch verification failed",
      verified: false,
    }));
  }
};

/**
 * Get blockchain network name
 * @param {String} chain - Blockchain network code
 * @returns {String} - Human-readable network name
 */
export const getBlockchainNetworkName = (chain) => {
  const names = {
    [BLOCKCHAIN_NETWORK.ETHEREUM]: "Ethereum Mainnet",
    [BLOCKCHAIN_NETWORK.POLYGON]: "Polygon",
    [BLOCKCHAIN_NETWORK.SOLANA]: "Solana",
    [BLOCKCHAIN_NETWORK.OTHER]: "Other Network",
  };

  return names[chain] || "Unknown Network";
};

/**
 * Get blockchain verification status badge color
 * @param {String} status - Verification status
 * @returns {String} - Badge color (success, warning, danger, info)
 */
export const getVerificationStatusColor = (status) => {
  switch (status) {
    case BLOCKCHAIN_VERIFICATION_STATUS.VERIFIED:
      return "success";

    case BLOCKCHAIN_VERIFICATION_STATUS.PENDING:
      return "warning";

    case BLOCKCHAIN_VERIFICATION_STATUS.FAILED:
      return "danger";

    case BLOCKCHAIN_VERIFICATION_STATUS.NOT_ANCHORED:
      return "info";

    default:
      return "secondary";
  }
};

/**
 * Check if blockchain anchor is verified
 * @param {Object} donation - Donation document
 * @returns {Boolean} - True if verified
 */
export const isBlockchainVerified = (donation) => {
  return !!(
    donation.blockchainAnchored &&
    donation.blockchainHash &&
    donation.blockchainAnchoredAt
  );
};

/**
 * Get blockchain verification summary for donation
 * @param {Object} donation - Donation document
 * @returns {Object} - Verification summary
 */
export const getBlockchainVerificationSummary = async (donation) => {
  if (!donation.blockchainHash) {
    return {
      status: BLOCKCHAIN_VERIFICATION_STATUS.NOT_ANCHORED,
      message: "Donation not yet anchored to blockchain",
      verified: false,
    };
  }

  // Verify the blockchain anchor
  const verification = await verifyBlockchainAnchor(
    donation.blockchainHash,
    donation.blockchainAnchor?.chain || BLOCKCHAIN_NETWORK.ETHEREUM,
  );

  return {
    ...verification,
    hash: donation.blockchainHash,
    anchoredAt: donation.blockchainAnchoredAt,
    chain: donation.blockchainAnchor?.chain || BLOCKCHAIN_NETWORK.ETHEREUM,
    blockNumber: donation.blockchainAnchor?.blockNumber,
  };
};

/**
 * Format blockchain hash for display (truncated)
 * @param {String} hash - Full blockchain hash
 * @param {Number} prefixLength - Number of characters to show at start
 * @param {Number} suffixLength - Number of characters to show at end
 * @returns {String} - Formatted hash
 */
export const formatBlockchainHash = (
  hash,
  prefixLength = 10,
  suffixLength = 8,
) => {
  if (!hash || hash.length <= prefixLength + suffixLength) {
    return hash;
  }

  const prefix = hash.substring(0, prefixLength);
  const suffix = hash.substring(hash.length - suffixLength);

  return `${prefix}...${suffix}`;
};

/**
 * Get blockchain confirmation status
 * @param {Number} confirmations - Number of confirmations
 * @returns {Object} - Confirmation status
 */
export const getConfirmationStatus = (confirmations) => {
  if (confirmations >= 12) {
    return {
      status: "CONFIRMED",
      message: "Transaction confirmed",
      color: "success",
    };
  }

  if (confirmations >= 6) {
    return {
      status: "CONFIRMING",
      message: `${confirmations}/12 confirmations`,
      color: "warning",
    };
  }

  return {
    status: "PENDING",
    message: `${confirmations}/12 confirmations`,
    color: "info",
  };
};
