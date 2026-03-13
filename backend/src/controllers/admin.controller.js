import { User } from "../models/User.model.js";
import { Campaign } from "../models/Campaign.model.js";
import { Donation } from "../models/Donation.model.js";
import { Wallet } from "../models/Wallet.model.js";
import { Merchant } from "../models/Merchant.model.js";
import { AuditLog } from "../models/AuditLog.model.js";
import { AuditService } from "../services/audit.service.js";

const auditService = new AuditService();

/* ──────────────────────────────────────────
   PENDING ACCESS REQUESTS (NGO / MERCHANT / GOVT)
────────────────────────────────────────── */
export const getPendingRequests = async (req, res) => {
  try {
    const requests = await User.find({
      verificationStatus: "PENDING",
      role: { $in: ["NGO", "MERCHANT", "GOVERNMENT"] },
    }).select("-password").sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pending requests" });
  }
};

/* ──────────────────────────────────────────
   APPROVE USER (NGO / MERCHANT / GOVT)
────────────────────────────────────────── */
export const approveRequest = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { category } = req.body; // for merchant: FOOD | MEDICINE | SHELTER

    const user = await User.findById(id);
    if (!user || user.verificationStatus !== "PENDING")
      return res.status(400).json({ message: "Invalid or already processed request" });

    user.verificationStatus = "APPROVED";
    user.approvedBy = adminId;
    await user.save();

    // Auto-create Merchant profile
    if (user.role === "MERCHANT") {
      const existing = await Merchant.findOne({ user: user._id });
      if (!existing) {
        await Merchant.create({
          user: user._id,
          shopName: user.merchantProfile?.shopName || user.name + "'s Shop",
          category: category || user.merchantProfile?.category || "FOOD",
          location: user.merchantProfile?.location || {},
          status: "ACTIVE",
          approvedBy: adminId,
        });
      }
    }

    await auditService.log({
      eventType: "USER_ACCESS_APPROVED",
      entityId: user._id.toString(),
      payload: { userId: user._id, role: user.role },
      jobIdHash: `ACCESS-${user._id}`,
      campaignId: null,
      actorRole: "ADMIN",
    });

    res.json({ message: `${user.role} access approved` });
  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({ message: "Approval failed" });
  }
};

/* ──────────────────────────────────────────
   REJECT USER
────────────────────────────────────────── */
export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);
    if (!user || user.verificationStatus !== "PENDING")
      return res.status(400).json({ message: "Invalid request" });

    user.verificationStatus = "REJECTED";
    user.rejectionReason = reason || "Rejected by admin";
    user.approvedBy = req.user.id;
    await user.save();

    await auditService.log({
      eventType: "USER_ACCESS_REJECTED",
      entityId: user._id.toString(),
      payload: { userId: user._id, role: user.role, reason: user.rejectionReason },
      jobIdHash: `ACCESS-${user._id}`,
      campaignId: null,
      actorRole: "ADMIN",
    });

    res.json({ message: "Access rejected" });
  } catch (err) {
    res.status(500).json({ message: "Rejection failed" });
  }
};

/* ──────────────────────────────────────────
   SYSTEM STATS
────────────────────────────────────────── */
export const getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers, totalNGOs, totalMerchants, totalAuditLogs, pendingRequests,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "NGO", verificationStatus: "APPROVED" }),
      User.countDocuments({ role: "MERCHANT", verificationStatus: "APPROVED" }),
      AuditLog.countDocuments(),
      User.countDocuments({
        verificationStatus: "PENDING",
        role: { $in: ["NGO", "MERCHANT", "GOVERNMENT"] },
      }),
    ]);

    const totalDonatedAgg = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      totalUsers,
      totalNGOs,
      totalMerchants,
      totalDonationVolume: totalDonatedAgg[0]?.total || 0,
      totalAuditLogs,
      pendingRequests,
    });
  } catch (err) {
    console.error("SYSTEM STATS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

/* ──────────────────────────────────────────
   GET ALL USERS (paginated)
────────────────────────────────────────── */
export const getAllUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.verificationStatus = status;

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.json({ users, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

/* ──────────────────────────────────────────
   SUSPEND / RESTORE USER
────────────────────────────────────────── */
export const toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "ADMIN") return res.status(403).json({ message: "Cannot suspend admin" });

    user.isActive = !user.isActive;
    await user.save();

    await auditService.log({
      eventType: user.isActive ? "USER_RESTORED" : "USER_SUSPENDED",
      entityId: user._id.toString(),
      payload: { userId: user._id, role: user.role, isActive: user.isActive },
      jobIdHash: `USER-${user._id}`,
      campaignId: null,
      actorRole: "ADMIN",
    });

    res.json({ message: `User ${user.isActive ? "restored" : "suspended"}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle user status" });
  }
};

/* ──────────────────────────────────────────
   GET ALL MERCHANTS
────────────────────────────────────────── */
export const getAllMerchants = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const merchants = await Merchant.find(filter)
      .populate("user", "name email isActive")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 });

    res.json(merchants);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch merchants" });
  }
};

/* ──────────────────────────────────────────
   UPDATE MERCHANT CATEGORY
────────────────────────────────────────── */
export const updateMerchantCategory = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { category, status } = req.body;

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) return res.status(404).json({ message: "Merchant not found" });

    if (category) merchant.category = category;
    if (status) merchant.status = status;
    await merchant.save();

    await auditService.log({
      eventType: "MERCHANT_UPDATED_BY_ADMIN",
      entityId: merchant._id.toString(),
      payload: { merchantId: merchant._id, category, status },
      jobIdHash: `MERCHANT-${merchant._id}`,
      campaignId: null,
      actorRole: "ADMIN",
    });

    res.json({ message: "Merchant updated", merchant });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

/* ──────────────────────────────────────────
   GET RECENT AUDIT LOGS (admin view)
────────────────────────────────────────── */
export const getAuditLogs = async (req, res) => {
  try {
    const { eventType, actorRole, limit = 100 } = req.query;
    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (actorRole) filter.actorRole = actorRole;

    const logs = await AuditLog.find(filter)
      .populate("campaignId", "title")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};
