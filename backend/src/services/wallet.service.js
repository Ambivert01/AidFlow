import { Wallet } from "../models/Wallet.model.js";
import { AuditService } from "./audit.service.js";

const auditService = new AuditService();

export async function createWallet({
  beneficiaryId,
  campaign,
  amount,
  jobIdHash,
}) {
  const expiresAt = new Date();
  expiresAt.setDate(
    expiresAt.getDate() + campaign.policySnapshot.validityDays
  );

  const wallet = await Wallet.create({
    beneficiary: beneficiaryId,
    campaign: campaign._id,
    balance: amount,
    jobIdHash,
    policy: {
      allowedCategories: campaign.policySnapshot.allowedCategories,
      maxPerTransaction: campaign.policySnapshot.maxPerBeneficiary,
      expiresAt,
    },
  });

  await auditService.log({
    eventType: "WALLET_CREATED",
    payload: {
      walletId: wallet._id,
      balance: wallet.balance,
    },
    jobIdHash,
    campaignId: campaign._id,
    actorRole: "SYSTEM",
  });

  return wallet;
}
