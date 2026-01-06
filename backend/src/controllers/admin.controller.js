import { User } from "../models/User.model.js";
import { AuditService } from "../services/audit.service.js";

const auditService = new AuditService();

/**
 * Get all pending access requests
 */
export const getPendingRequests = async (req, res) => {
  const requests = await User.find({
    verificationStatus: "PENDING",
    role: { $in: ["NGO", "MERCHANT"] },
  }).select("-password");

  res.json(requests);
};

/**
 * Approve NGO / Merchant
 */
export const approveRequest = async (req, res) => {
  const adminId = req.user.id;
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user || user.verificationStatus !== "PENDING") {
    return res.status(400).json({ message: "Invalid request" });
  }

  user.verificationStatus = "APPROVED";
  user.approvedBy = adminId;
  await user.save();

  await auditService.log({
    eventType: "ACCESS_APPROVED",
    payload: {
      userId: user._id,
      role: user.role,
    },
    jobIdHash: `ACCESS-${user._id}`,
    campaignId: null,
    actorRole: "ADMIN",
  });

  res.json({ message: "Access approved" });
};

/**
 * Reject NGO / Merchant
 */
export const rejectRequest = async (req, res) => {
  const adminId = req.user.id;
  const { id } = req.params;
  const { reason } = req.body;

  const user = await User.findById(id);
  if (!user || user.verificationStatus !== "PENDING") {
    return res.status(400).json({ message: "Invalid request" });
  }

  user.verificationStatus = "REJECTED";
  user.rejectionReason = reason || "Rejected by admin";
  user.approvedBy = adminId;
  await user.save();

  await auditService.log({
    eventType: "ACCESS_REJECTED",
    payload: {
      userId: user._id,
      role: user.role,
      reason: user.rejectionReason,
    },
    jobIdHash: `ACCESS-${user._id}`,
    campaignId: null,
    actorRole: "ADMIN",
  });

  res.json({ message: "Access rejected" });
};
