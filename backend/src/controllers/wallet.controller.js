import { Wallet } from "../models/Wallet.model.js";

/*
 * BENEFICIARY: View wallet
 */
export const getMyWallet = async (req, res) => {
  const wallet = await Wallet.findOne({
    beneficiary: req.user.id,
  });

  if (!wallet) {
    return res.status(404).json({
      message: "Wallet not assigned yet",
    });
  }

  res.json(wallet);
};
