import { Donation } from "../models/Donation.model.js";
import { Wallet } from "../models/Wallet.model.js";
import { AuditLog } from "../models/AuditLog.model.js";

/*
 * Get beneficiary dashboard summary
 */
export const getBeneficiaryDashboard = async (req, res) => {
  try {
    const beneficiaryId = req.user.id;

    // Wallet
    const wallet = await Wallet.findOne({ beneficiary: beneficiaryId });

    // Donations received
    const donations = await Donation.find({
      beneficiary: beneficiaryId,
    }).sort({ createdAt: -1 });

    // Usage / audit history
    const audits = await AuditLog.find({
      entityId: wallet ? wallet._id.toString() : null,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      wallet: wallet
        ? {
            balance: wallet.balance,
            status: wallet.status,
            updatedAt: wallet.updatedAt,
          }
        : null,
      donations,
      activity: audits,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to load beneficiary dashboard",
    });
  }
};
