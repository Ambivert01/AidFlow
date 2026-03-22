import { Settlement } from "../../models/Settlement.model.js";
import { Wallet } from "../../models/Wallet.model.js";
import { Merchant } from "../../models/Merchant.model.js";

import { BaseService } from "../../core/base.service.js";
import { AppError } from "../../utils/AppError.js";

import { createAuditLog } from "../audit/audit.service.js";

export const createSettlementRecord = async (data) => {
  const settlement = await Settlement.create({
    merchant: data.merchantId,

    wallet: data.walletId,

    amount: data.amount,

    type: "WALLET_SPEND",

    status: "PENDING",
  });

  await createAuditLog({
    eventType: "MERCHANT_PAID",

    entityId: settlement._id,

    actorRole: "SYSTEM",

    payload: {
      merchantId: data.merchantId,

      amount: data.amount,
    },
  });

  return settlement;
};

export const processSettlement = async (settlementId) => {
  const settlement = await Settlement.findById(settlementId);

  if (!settlement) {
    throw new AppError("Settlement not found", 404);
  }

  settlement.status = "PROCESSING";

  await settlement.save();

  // simulate bank transfer

  settlement.status = "COMPLETED";

  settlement.completedAt = new Date();

  await settlement.save();

  return BaseService.updated(settlement);
};

export const getMerchantSettlements = async (merchantId) => {
  const settlements = await Settlement.find({
    merchant: merchantId,
  });

  return BaseService.success(settlements);
};

export const getAllSettlements = async () => {
  const settlements = await Settlement.find();

  return BaseService.success(settlements);
};
