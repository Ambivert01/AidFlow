import { Wallet } from "../models/Wallet.model.js";
import { Campaign } from "../models/Campaign.model.js";
import { AuditService } from "./audit.service.js";

const auditService = new AuditService();

/*
 * Create wallet for a beneficiary after NGO approval
 * Used by: ngo.controller → approveBeneficiary
 */
export const createWalletForBeneficiary = async (beneficiary) => {
  const campaign = await Campaign.findById(beneficiary.campaign);

  if (!campaign) {
    throw new Error("Campaign not found for wallet creation");
  }

  // Prevent duplicate wallet
  const existing = await Wallet.findOne({
    beneficiary: beneficiary._id,
    campaign: campaign._id,
  });
  if (existing) return existing;

  const wallet = await Wallet.create({
    beneficiary: beneficiary._id,
    campaign: campaign._id,
    balance: campaign.policySnapshot.maxPerBeneficiary || 5000,
    policy: {
      allowedCategories: campaign.policySnapshot.allowedCategories || ["FOOD", "MEDICINE"],
      maxPerTransaction: campaign.policySnapshot.maxPerTransaction || campaign.policySnapshot.maxPerBeneficiary || 1000,
      expiresAt: new Date(
        Date.now() + (campaign.policySnapshot.validityDays || 14) * 24 * 60 * 60 * 1000
      ),
    },
    status: "ACTIVE",
  });

  // Audit wallet creation
  await auditService.log({
    eventType: "WALLET_CREATED",
    entityId: wallet._id.toString(),
    payload: {
      walletId: wallet._id,
      beneficiaryId: beneficiary._id,
      campaignId: campaign._id,
      balance: wallet.balance,
    },
    jobIdHash: beneficiary._id.toString(),
    campaignId: campaign._id,
    actorRole: "SYSTEM",
  });

  return wallet;
};

/*
 * Full wallet creation for WorkflowEngine (called during donation approval)
 * Accepts: { beneficiaryId, campaign, amount, jobIdHash }
 */
export const createWallet = async ({
  beneficiaryId,
  campaign,
  amount,
  jobIdHash,
}) => {
  // Prevent duplicate wallet per beneficiary+campaign
  const existing = await Wallet.findOne({
    beneficiary: beneficiaryId,
    campaign: campaign._id,
  });
  if (existing) return existing;

  const policy = campaign.policySnapshot || {};

  const wallet = await Wallet.create({
    beneficiary: beneficiaryId,
    campaign: campaign._id,
    jobIdHash,
    balance: amount,
    policy: {
      allowedCategories: policy.allowedCategories || ["FOOD", "MEDICINE"],
      maxPerTransaction: policy.maxPerTransaction || 1000,
      expiresAt: new Date(
        Date.now() + (policy.validityDays || 14) * 24 * 60 * 60 * 1000
      ),
    },
    status: "ACTIVE",
  });

  await auditService.log({
    eventType: "WALLET_CREATED",
    entityId: wallet._id.toString(),
    payload: {
      walletId: wallet._id,
      beneficiaryId,
      campaignId: campaign._id,
      balance: amount,
    },
    jobIdHash,
    campaignId: campaign._id,
    actorRole: "SYSTEM",
  });

  return wallet;
};
