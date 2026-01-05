import { WalletEngine } from "../services/wallet.engine.js";
import { AuditService } from "../services/audit.service.js";

const auditService = new AuditService();
const walletEngine = new WalletEngine({ auditService });

export const spendFromWallet = async (req, res) => {
  try {
    const { walletId, amount, category } = req.body;

    const wallet = await walletEngine.spend({
      walletId,
      amount,
      category,
      merchantId: req.user.id,
    });

    res.json({
      message: "Payment successful",
      balance: wallet.balance,
      status: wallet.status,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
