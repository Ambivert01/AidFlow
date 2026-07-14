import { Settlement } from "../../models/merchant/Settlement.model.js";
import { Wallet } from "../../models/wallet/Wallet.model.js";
import { Merchant } from "../../models/merchant/Merchant.model.js";

import { BaseService } from "../../core/base.service.js";
import { AppError } from "../../utils/AppError.js";

import { createAuditLog } from "../audit/audit.service.js";
import { settlementQueue } from "../../queues/settlement.queue.js";

export const createSettlementRecord = async (data) => {
  const settlement = await Settlement.create({
    merchant: data.merchantId,

    batchId: `BATCH_${Date.now()}`,

    transactions: data.walletIds || [data.walletId],

    amount: data.amount,

    transactionCount: data.transactionCount || 1,

    status: "CREATED",
  });

  await settlementQueue.add("process-settlement", {
    settlementId: settlement._id,
  });

  await createAuditLog({
    eventType: "SETTLEMENT_CREATED",

    entityType: "Settlement",

    entityId: settlement._id,

    actorRole: "SYSTEM",

    payload: {
      merchantId: data.merchantId,

      amount: data.amount,
    },
  });

  return settlement;
};

/**
 * Create a settlement for a single merchant covering their entire current
 * pending balance. Admin-triggered (POST /settlements/merchant/:id/create).
 */
export const createSettlementForMerchant = async (merchantId) => {
  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new AppError("Merchant not found", 404);

  if (!merchant.pendingBalance || merchant.pendingBalance <= 0) {
    throw new AppError("Merchant has no pending balance to settle", 400);
  }

  // Find wallets whose transactions contributed to this merchant's pending
  // balance and haven't yet been included in a completed settlement.
  const wallets = await Wallet.find({
    "transactions.merchant": merchantId,
  })
    .select("_id")
    .lean();

  const settlement = await createSettlementRecord({
    merchantId,
    walletIds: wallets.map((w) => w._id),
    transactionCount: merchant.transactionCount || wallets.length,
    amount: merchant.pendingBalance,
  });

  return BaseService.created(settlement);
};

/**
 * Batch-creates settlements for every merchant with a positive pending
 * balance. Intended to be called by a scheduled (e.g. weekly) cron job -
 * see workers/bootstrap.js.
 */
export const createSettlementsForAllEligibleMerchants = async () => {
  const merchants = await Merchant.find({
    pendingBalance: { $gt: 0 },
    status: "ACTIVE",
  }).select("_id pendingBalance transactionCount");

  const created = [];
  for (const merchant of merchants) {
    try {
      const settlement = await createSettlementRecord({
        merchantId: merchant._id,
        transactionCount: merchant.transactionCount || 1,
        amount: merchant.pendingBalance,
      });
      created.push(settlement._id);
    } catch (error) {
      // Don't let one merchant's failure block the rest of the batch
      console.error(
        `[Settlement] Failed to create settlement for merchant ${merchant._id}:`,
        error.message,
      );
    }
  }

  return created;
};

export const processSettlement = async (settlementId) => {
  const settlement = await Settlement.findById(settlementId);

  if (!settlement) {
    throw new AppError("Settlement not found", 404);
  }

  if (settlement.status === "COMPLETED") {
    // Already processed - idempotent no-op (e.g. job retried after success)
    return BaseService.updated(settlement);
  }

  settlement.status = "PROCESSING";
  await settlement.save();

  try {
    // NOTE: This simulates a bank transfer. There is no real payment-gateway
    // or NEFT/IMPS/UPI integration wired up yet - this generates a
    // deterministic reference so the record is at least internally
    // consistent and traceable, but no money actually moves until a real
    // payment provider is integrated here.
    const bankReference = `SIM-${settlement.batchId}-${Date.now()}`;

    settlement.status = "COMPLETED";
    settlement.processedAt = new Date();
    settlement.bankReference = bankReference;
    await settlement.save();

    // Move the settled amount out of the merchant's pending balance into
    // their settled total - this is the actual financial effect of a
    // settlement and was previously never applied anywhere.
    const merchant = await Merchant.findById(settlement.merchant);
    if (merchant) {
      merchant.pendingBalance = Math.max(
        0,
        (merchant.pendingBalance || 0) - settlement.amount,
      );
      merchant.settlement.totalSettled =
        (merchant.settlement?.totalSettled || 0) + settlement.amount;
      merchant.settlement.lastSettlementAt = new Date();
      await merchant.save();
    }

    await createAuditLog({
      eventType: "SETTLEMENT_COMPLETED",
      entityType: "Settlement",
      entityId: settlement._id,
      actorRole: "SYSTEM",
      payload: {
        merchantId: settlement.merchant,
        amount: settlement.amount,
        bankReference,
      },
    });

    return BaseService.updated(settlement);
  } catch (error) {
    settlement.status = "FAILED";
    settlement.failureReason = error.message;
    await settlement.save();

    await createAuditLog({
      eventType: "SETTLEMENT_FAILED",
      entityType: "Settlement",
      entityId: settlement._id,
      actorRole: "SYSTEM",
      payload: { error: error.message },
    });

    throw error;
  }
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
