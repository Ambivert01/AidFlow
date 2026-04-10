import { User } from "../../models/auth/User.model.js";
import { Wallet } from "../../models/wallet/Wallet.model.js";
import { Merchant } from "../../models/merchant/Merchant.model.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { Donation } from "../../models/donor/Donation.model.js";
import { AuditLog } from "../../models/audit/AuditLog.model.js";
import { FraudAlert } from "../../models/governance/FraudAlert.model.js";
import { BaseService } from "../../core/base.service.js";
import { AppError } from "../../utils/AppError.js";
import mongoose from "mongoose";

/*
PLATFORM STATS
*/
export const getAdminStats = async () => {
  const [
    totalUsers,
    totalNGOs,
    totalMerchants,
    totalDonations,
    totalAuditLogs,
    pendingRequests,
    donationVolume,
  ] = await Promise.all([
    User.countDocuments({ isDeleted: false }),
    User.countDocuments({ role: "NGO", verificationStatus: "APPROVED" }),
    User.countDocuments({ role: "MERCHANT", verificationStatus: "APPROVED" }),
    Donation.countDocuments(),
    AuditLog.countDocuments(),
    User.countDocuments({ verificationStatus: "PENDING" }),
    Donation.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
  ]);

  return BaseService.success({
    totalUsers,
    totalNGOs,
    totalMerchants,
    totalDonations,
    totalAuditLogs,
    pendingRequests,
    totalDonationVolume: donationVolume[0]?.total || 0,
  });
};

/*
PENDING ACCESS REQUESTS
users with verificationStatus PENDING
*/
export const getPendingRequests = async () => {
  const users = await User.find({ verificationStatus: "PENDING" })
    .select("name email role createdAt")
    .sort({ createdAt: -1 });

  return BaseService.success(users);
};

/*
APPROVE USER
for NGO/MERCHANT/GOVERNMENT — also creates Merchant profile if role is MERCHANT
*/
export const approveUser = async (userId, adminId, extraData = {}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError("Invalid user id", 400);

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.verificationStatus === "APPROVED") return BaseService.success(user, "Already approved");

  user.verificationStatus = "APPROVED";
  user.approvedBy = adminId;
  await user.save();

  // Auto-create Merchant profile when admin approves a MERCHANT user
  if (user.role === "MERCHANT") {
    const existing = await Merchant.findOne({ user: user._id });
    if (!existing) {
      await Merchant.create({
        user: user._id,
        shopName: extraData.shopName || `${user.name}'s Shop`,
        category: extraData.category || "OTHER",
        location: extraData.location || {},
        status: "ACTIVE",
        approvedBy: adminId,
        approvedAt: new Date(),
      });
    }
  }

  return BaseService.updated(user);
};

/*
REJECT USER
*/
export const rejectUser = async (userId, adminId, reason) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError("Invalid user id", 400);

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  user.verificationStatus = "REJECTED";
  user.rejectionReason = reason || "Did not meet KYC requirements";
  await user.save();

  return BaseService.updated(user);
};

/*
GET ALL USERS (with filters)
*/
export const getAllUsers = async (query = {}) => {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.verificationStatus = query.status;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .limit(100);

  return BaseService.success(users);
};

/*
TOGGLE USER ACTIVE STATUS
*/
export const toggleUserActive = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  user.isActive = !user.isActive;
  await user.save();

  return BaseService.updated(user);
};

/*
GET ALL MERCHANTS
*/
export const getAllMerchants = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;

  const merchants = await Merchant.find(filter)
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  return BaseService.success(merchants);
};

/*
UPDATE MERCHANT (category / status)
*/
export const updateMerchant = async (merchantId, data) => {
  const merchant = await Merchant.findByIdAndUpdate(merchantId, data, { new: true });
  if (!merchant) throw new AppError("Merchant not found", 404);
  return BaseService.updated(merchant);
};

/*
GET AUDIT LOGS (admin view)
*/
export const getAuditLogs = async (query = {}) => {
  const filter = {};
  if (query.eventCategory) filter.eventCategory = query.eventCategory;
  if (query.entityType) filter.entityType = query.entityType;
  if (query.actorRole) filter["actor.role"] = query.actorRole;

  const logs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(200);

  return BaseService.success(logs);
};

/*
FREEZE WALLET (admin)
*/
export const freezeWallet = async (walletId, reason, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(walletId)) throw new AppError("Invalid wallet id", 400);

  const wallet = await Wallet.findById(walletId);
  if (!wallet) throw new AppError("Wallet not found", 404);

  wallet.status = "FROZEN";
  wallet.freezeReason = reason;
  wallet.frozenBy = adminId;
  wallet.frozenAt = new Date();
  await wallet.save();

  return BaseService.updated(wallet);
};

/*
BAN MERCHANT (admin)
*/
export const banMerchant = async (merchantId, reason) => {
  if (!mongoose.Types.ObjectId.isValid(merchantId)) throw new AppError("Invalid merchant id", 400);

  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new AppError("Merchant not found", 404);

  merchant.status = "BANNED";
  merchant.suspendedReason = reason;
  merchant.bannedAt = new Date();
  await merchant.save();

  return BaseService.updated(merchant);
};

/*
GET FRAUD ALERTS
*/
export const getFraudAlerts = async () => {
  const alerts = await FraudAlert.find({ status: "OPEN" }).sort({ createdAt: -1 });
  return BaseService.success(alerts);
};
