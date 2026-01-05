import { WalletEngine } from "../services/wallet.engine.js";
import { AuditService } from "../services/audit.service.js";

const auditService = new AuditService();
const walletEngine = new WalletEngine({ auditService });

import { Donation } from "../models/Donation.model.js";

/*
 * Get logged-in beneficiary wallet
 */
export const getMyWallet = async (req, res) => {
  try {
    const beneficiaryId = req.user.id;

    // Find READY_FOR_USE donation assigned to beneficiary
    const donation = await Donation.findOne({
      beneficiary: beneficiaryId,
      status: "READY_FOR_USE",
    }).populate("campaign");

    if (!donation) {
      return res.json(null);
    }

    res.json({
      donationId: donation._id,
      amount: donation.amount,
      currency: donation.currency,
      allowedCategories: donation.campaign.policySnapshot.allowedCategories,
      expiresInDays: donation.campaign.policySnapshot.validityDays,
      status: donation.status,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch wallet",
      error: err.message,
    });
  }
};
