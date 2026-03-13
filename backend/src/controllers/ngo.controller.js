import crypto from "crypto";
import { Donation } from "../models/Donation.model.js";
import { Beneficiary } from "../models/Beneficiary.model.js";
import { Campaign } from "../models/Campaign.model.js";
import { Wallet } from "../models/Wallet.model.js";
import { AuditService } from "../services/audit.service.js";
import { createWalletForBeneficiary, createWallet } from "../services/wallet.service.js";
import { evaluateBeneficiaryAI } from "../services/ai/beneficiaryEvaluation.service.js";
import { createWorkflowEngine } from "../services/workflow.service.js";

const auditService = new AuditService();

/* ──────────────────────────────────────────
   NGO DASHBOARD STATS
────────────────────────────────────────── */
export const getNGODashboardStats = async (req, res) => {
  try {
    const ngoId = req.user.id;

    const campaigns = await Campaign.find({ createdBy: ngoId });
    const campaignIds = campaigns.map((c) => c._id);

    const [totalBeneficiaries, activeBeneficiaries, pendingBeneficiaries, pendingDonations, readyDonations] = await Promise.all([
      Beneficiary.countDocuments({ campaign: { $in: campaignIds } }),
      Beneficiary.countDocuments({ campaign: { $in: campaignIds }, status: "ACTIVE" }),
      Beneficiary.countDocuments({ campaign: { $in: campaignIds }, status: { $in: ["REGISTERED", "MANUAL_REVIEW"] } }),
      Donation.countDocuments({ campaign: { $in: campaignIds }, status: "PENDING_NGO_REVIEW" }),
      Donation.countDocuments({ campaign: { $in: campaignIds }, status: "READY_FOR_USE" }),
    ]);

    const totalDonated = await Donation.aggregate([
      { $match: { campaign: { $in: campaignIds } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === "ACTIVE").length,
      totalBeneficiaries,
      activeBeneficiaries,
      pendingBeneficiaries,
      pendingDonations,
      readyDonations,
      totalDonated: totalDonated[0]?.total || 0,
    });
  } catch (err) {
    console.error("NGO STATS ERROR:", err);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
};

/* ──────────────────────────────────────────
   GET ALL PENDING DONATIONS FOR NGO
────────────────────────────────────────── */
export const getPendingDonations = async (req, res) => {
  try {
    const ngoId = req.user.id;
    const campaigns = await Campaign.find({ createdBy: ngoId }, "_id");
    const campaignIds = campaigns.map((c) => c._id);

    const donations = await Donation.find({
      campaign: { $in: campaignIds },
      status: "PENDING_NGO_REVIEW",
    })
      .populate("donor", "name email")
      .populate("campaign", "title disasterType")
      .populate("beneficiary", "name status")
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (err) {
    console.error("GET PENDING DONATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch pending donations" });
  }
};

/* ──────────────────────────────────────────
   ASSIGN BENEFICIARY TO DONATION
────────────────────────────────────────── */
export const assignDonationToBeneficiary = async (req, res) => {
  try {
    const { beneficiaryId } = req.body;
    const donation = await Donation.findById(req.params.id).populate("campaign");

    if (!donation) return res.status(404).json({ message: "Donation not found" });
    if (donation.status !== "PENDING_NGO_REVIEW")
      return res.status(400).json({ message: "Donation not eligible for assignment" });

    const beneficiary = await Beneficiary.findById(beneficiaryId);
    if (!beneficiary) return res.status(404).json({ message: "Beneficiary not found" });
    if (beneficiary.status !== "ACTIVE")
      return res.status(400).json({ message: "Beneficiary must be ACTIVE to receive donation" });

    // Verify beneficiary belongs to same campaign
    if (beneficiary.campaign.toString() !== donation.campaign._id.toString())
      return res.status(400).json({ message: "Beneficiary must belong to the same campaign" });

    donation.beneficiary = beneficiaryId;
    await donation.save();

    await auditService.log({
      eventType: "DONATION_BENEFICIARY_ASSIGNED",
      entityId: donation._id.toString(),
      payload: { donationId: donation._id, beneficiaryId },
      jobIdHash: donation._id.toString(),
      campaignId: donation.campaign._id,
      actorRole: "NGO",
    });

    res.json({ message: "Beneficiary assigned to donation", donation });
  } catch (err) {
    console.error("ASSIGN ERROR:", err);
    res.status(500).json({ message: "Assignment failed" });
  }
};

/* ──────────────────────────────────────────
   NGO APPROVES DONATION → CREATE WALLET
────────────────────────────────────────── */
export const approveNGODonation = async (req, res) => {
  try {
    // Atomic guard: ensure only PENDING_NGO_REVIEW can be approved (avoid double-approval race)
    const donation = await Donation.findOne({
      _id: req.params.id,
      status: "PENDING_NGO_REVIEW",
    }).populate("campaign");

    if (!donation) {
      return res
        .status(400)
        .json({ message: "Donation already processed or not in review state" });
    }

    if (!donation.beneficiary) {
      return res.status(400).json({ message: "Assign a beneficiary first" });
    }

    const jobIdHash = donation._id.toString();

    // Mark NGO decision on donation
    donation.lastDecisionBy = "NGO";
    await donation.save();

    // Audit NGO approval decision (before workflow resumes)
    await auditService.log({
      eventType: "DONATION_APPROVED_BY_NGO",
      entityId: donation._id.toString(),
      payload: { donationId: donation._id },
      jobIdHash,
      campaignId: donation.campaign._id,
      actorRole: "NGO",
    });

    // Resume workflow via WorkflowEngine (creates wallet, finalizes audit, etc.)
    const workflow = createWorkflowEngine();
    const wallet = await workflow.resumeAfterNGOApproval({
      donation,
      campaign: donation.campaign,
    });

    if (!wallet) {
      return res
        .status(500)
        .json({ message: "Workflow could not complete wallet creation" });
    }

    res.json({
      message: "Donation approved & wallet created",
      walletId: wallet._id,
    });
  } catch (err) {
    console.error("NGO APPROVE DONATION ERROR:", err);
    res.status(500).json({ message: "Approval failed: " + err.message });
  }
};

/* ──────────────────────────────────────────
   NGO REJECTS DONATION
────────────────────────────────────────── */
export const rejectNGODonation = async (req, res) => {
  try {
    const { reason } = req.body;
    const donation = await Donation.findById(req.params.id);
    if (!donation || donation.status !== "PENDING_NGO_REVIEW")
      return res.status(400).json({ message: "Invalid donation state" });

    donation.status = "REJECTED";
    donation.lastDecisionBy = "NGO";
    donation.decisionReason = reason || "Rejected by NGO";
    await donation.save();

    await auditService.log({
      eventType: "DONATION_REJECTED_BY_NGO",
      entityId: donation._id.toString(),
      payload: { donationId: donation._id, reason: donation.decisionReason },
      jobIdHash: donation._id.toString(),
      campaignId: donation.campaign,
      actorRole: "NGO",
    });

    res.json({ message: "Donation rejected" });
  } catch (err) {
    res.status(500).json({ message: "Rejection failed" });
  }
};

/* ──────────────────────────────────────────
   LIST ALL BENEFICIARIES (NGO-scoped)
────────────────────────────────────────── */
export const listMyBeneficiaries = async (req, res) => {
  try {
    const ngoId = req.user.id;
    const { campaignId, status } = req.query;

    const campaigns = await Campaign.find({ createdBy: ngoId }, "_id");
    const campaignIds = campaigns.map((c) => c._id);

    const filter = { campaign: { $in: campaignIds } };
    if (campaignId) filter.campaign = campaignId;
    if (status) filter.status = status;

    const beneficiaries = await Beneficiary.find(filter)
      .populate("user", "name email")
      .populate("campaign", "title disasterType")
      .sort({ createdAt: -1 });

    res.json(beneficiaries);
  } catch (err) {
    console.error("LIST BENEFICIARIES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch beneficiaries" });
  }
};

/* ──────────────────────────────────────────
   NGO APPROVES BENEFICIARY → CREATES WALLET
────────────────────────────────────────── */
export const approveBeneficiary = async (req, res) => {
  try {
    const { reason } = req.body;
    // 1. Atomic State Transition (Prevent check-then-act race)
    const beneficiary = await Beneficiary.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ["REGISTERED", "MANUAL_REVIEW"] } },
      {
        status: "ACTIVE",
        overrideByNgo: {
          decision: "APPROVE",
          reason: reason || "Approved by NGO",
          ngo: req.user.id,
          at: new Date(),
        },
      },
      { new: true }
    ).populate("campaign");

    if (!beneficiary) {
      return res.status(400).json({ message: "Beneficiary already active, blocked, or not found" });
    }

    // 2. Create wallet automatically on approval
    const wallet = await createWalletForBeneficiary(beneficiary);

    const jobIdHash = beneficiary._id.toString();

    // 3. Audit log
    await auditService.log({
      eventType: "BENEFICIARY_APPROVED_BY_NGO",
      entityId: beneficiary._id.toString(),
      payload: { beneficiaryId: beneficiary._id, walletId: wallet._id, reason },
      jobIdHash,
      campaignId: beneficiary.campaign._id,
      actorRole: "NGO",
    });

    // 4. Finalize Audit Chaining (Onboarding complete)
    try {
      await auditService.finalizeWorkflowAudit({
        jobIdHash,
        campaignId: beneficiary.campaign._id,
      });
    } catch (e) {
      console.warn("Beneficiary audit finalization skipped:", e.message);
    }

    res.json({ message: "Beneficiary approved and wallet created", walletId: wallet._id });
  } catch (err) {
    console.error("APPROVE BENEFICIARY ERROR:", err);
    res.status(500).json({ message: "Approval failed: " + err.message });
  }
};

/* ──────────────────────────────────────────
   NGO REJECTS BENEFICIARY
────────────────────────────────────────── */
export const rejectBeneficiary = async (req, res) => {
  try {
    const { reason } = req.body;
    const beneficiary = await Beneficiary.findById(req.params.id);

    if (!beneficiary) return res.status(404).json({ message: "Beneficiary not found" });

    beneficiary.status = "NGO_REJECTED";
    beneficiary.overrideByNgo = {
      decision: "REJECT",
      reason: reason || "Rejected by NGO",
      ngo: req.user.id,
      at: new Date(),
    };
    await beneficiary.save();

    await auditService.log({
      eventType: "BENEFICIARY_REJECTED_BY_NGO",
      entityId: beneficiary._id.toString(),
      payload: { beneficiaryId: beneficiary._id, reason },
      jobIdHash: beneficiary._id.toString(),
      campaignId: beneficiary.campaign,
      actorRole: "NGO",
    });

    res.json({ message: "Beneficiary rejected" });
  } catch (err) {
    res.status(500).json({ message: "Rejection failed" });
  }
};

/* ──────────────────────────────────────────
   GET NGO'S OWN DONATIONS (all statuses)
────────────────────────────────────────── */
export const getNGODonations = async (req, res) => {
  try {
    const ngoId = req.user.id;
    const { status } = req.query;
    const campaigns = await Campaign.find({ createdBy: ngoId }, "_id");
    const campaignIds = campaigns.map((c) => c._id);

    const filter = { campaign: { $in: campaignIds } };
    if (status) filter.status = status;

    const donations = await Donation.find(filter)
      .populate("donor", "name email")
      .populate("campaign", "title disasterType")
      .populate("beneficiary", "name status")
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch donations" });
  }
};
