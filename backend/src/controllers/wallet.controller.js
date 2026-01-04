import { WalletEngine } from "../services/wallet.engine.js";
import { AuditService } from "../services/audit.service.js";

const auditService = new AuditService();
const walletEngine = new WalletEngine({ auditService });

/*
 * Get logged-in beneficiary wallet
 */
export const getMyWallet = async (req, res) => {
  try {
    const beneficiaryId = req.user.id;

    const wallet = await walletEngine.getOrCreateWallet(beneficiaryId);

    res.json({
      walletId: wallet._id,
      balance: wallet.balance,
      status: wallet.status,
      updatedAt: wallet.updatedAt,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch wallet",
    });
  }
};
