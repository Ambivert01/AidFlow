import crypto from "crypto";
import { Beneficiary } from "../models/Beneficiary.model.js";
import { Campaign } from "../models/Campaign.model.js";
import { AuditService } from "../services/audit.service.js";
import { createWalletForBeneficiary } from "../services/wallet.service.js";
import { aiClients } from "../services/aiDecision.js";

const auditService = new AuditService();

/*
NGO: Register Beneficiary (NGO-managed onboarding)
*/
export const registerBeneficiary = async (req, res) => {
  try {
    const { aadhaar, location, campaignId } = req.body;

    // 1. Validate campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== "ACTIVE") {
      return res.status(400).json({ message: "Invalid or inactive campaign" });
    }

    // 2. Hash Aadhaar (NO PII STORAGE)
    const aadhaarHash = crypto
      .createHash("sha256")
      .update(aadhaar)
      .digest("hex");

    // 3. Prevent duplicate beneficiary (CROSS-CAMPAIGN CHECK)
    const existingRegistration = await Beneficiary.findOne({ aadhaarHash }).populate("campaign", "title status");
    if (existingRegistration) {
      return res.status(400).json({
        message: "Beneficiary already registered in the system",
        existingCampaign: existingRegistration.campaign?.title || "Unknown Campaign",
        status: existingRegistration.status,
      });
    }

    // 4. Run AI evaluation with Graceful Fallback (deterministic FastAPI agents)
    let eligibilityResult;
    let fraudResult;
    let riskResult;

    try {
      eligibilityResult = await aiClients.eligibility.check({
        beneficiary: {
          aadhaarHash,
          ward: location.ward,
        },
        disaster: {
          type: campaign.disasterType,
          affectedWards: [location.ward],
          severity: 1,
        },
      });

      fraudResult = await aiClients.fraud.detect({
        beneficiaryId: null,
        walletId: null,
        deviceFingerprint: "NGO_ONBOARDED",
        location: location.ward,
        recentTransactions: 0,
        totalAidReceived: 0,
        merchantId: null,
        timeWindowHours: 24,
      });

      riskResult = await aiClients.risk.assess({
        eligibility: eligibilityResult,
        fraud: fraudResult,
        policy: {
          maxAllowedRisk: campaign.policySnapshot?.maxFraudRisk ?? 0.7,
          minEligibilityConfidence:
            campaign.policySnapshot?.minEligibilityConfidence ?? 0.6,
        },
      });
    } catch (aiErr) {
      console.error(
        "AI AGENT UNAVAILABLE — FALLING BACK TO MANUAL REVIEW:",
        aiErr.message
      );
      riskResult = {
        decision: "MANUAL_REVIEW",
        finalRiskScore: null,
      };
      eligibilityResult = {
        eligible: true,
        confidence: 0,
        signals: {},
      };
      fraudResult = {
        riskScore: 0,
        flags: ["AI_OFFLINE_BYPASS"],
      };
    }

    // 5. Decide initial status
    let status = "ELIGIBLE";
    if (riskResult.decision === "BLOCK") {
      status = "BLOCKED";
    } else if (riskResult.decision === "MANUAL_REVIEW") {
      status = "MANUAL_REVIEW";
    }

    // 6. Create Beneficiary record (NO USER ACCOUNT YET)
    const beneficiary = await Beneficiary.create({
      campaign: campaignId,
      aadhaarHash,
      location,
      aiDecision: {
        eligibilityConfidence: eligibilityResult.confidence ?? null,
        fraudRisk: fraudResult.riskScore ?? null,
        decision: riskResult.decision,
        flags: fraudResult.flags ?? [],
        evaluatedAt: new Date(),
      },
      status,
      registeredBy: req.user.id,
    });

    // 7. Audit log
    await auditService.log({
      eventType: "BENEFICIARY_REGISTERED",
      payload: {
        beneficiaryId: beneficiary._id,
        aiDecision: aiDecision.risk.decision,
      },
      jobIdHash: beneficiary._id.toString(),
      campaignId: campaignId,
      actorRole: "NGO",
    });

    res.status(201).json({
      message: "Beneficiary registered",
      beneficiary,
    });
  } catch (err) {
    console.error("BENEFICIARY REGISTER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/*
BENEFICIARY: Self-apply to campaign (NO auto-approval)
*/
export const applyToCampaign = async (req, res) => {
  try {
    const userId = req.user.id;
    const { campaignId } = req.body;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== "ACTIVE") {
      return res.status(400).json({ message: "Invalid campaign" });
    }

    const already = await Beneficiary.findOne({
      user: userId,
      campaign: campaignId,
    });
    if (already) {
      return res.status(400).json({ message: "Already applied" });
    }

    const beneficiary = await Beneficiary.create({
      user: userId,
      campaign: campaignId,
      status: "REGISTERED",
    });

    await auditService.log({
      eventType: "BENEFICIARY_SELF_APPLIED",
      payload: { beneficiaryId: beneficiary._id },
      jobIdHash: beneficiary._id.toString(),
      campaignId,
      actorRole: "BENEFICIARY",
    });

    res.json({
      message: "Applied successfully. Await NGO review",
    });
  } catch (err) {
    console.error("APPLY ERROR:", err);
    res.status(500).json({ message: "Apply failed" });
  }
};

/*
NGO: List beneficiaries (campaign-scoped)
*/
export const listBeneficiaries = async (req, res) => {
  const { campaignId } = req.query;

  const filter = campaignId ? { campaign: campaignId } : {};

  const beneficiaries = await Beneficiary.find(filter)
    .populate("user", "name email")
    .populate("campaign", "title")
    .sort({ createdAt: -1 });

  res.json(beneficiaries);
};

/*
NGO: Final decision (override AI)
*/
export const ngoDecision = async (req, res) => {
  try {
    const { decision, reason } = req.body;

    if (!["APPROVE", "REJECT"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision" });
    }

    const beneficiary = await Beneficiary.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ["REGISTERED", "MANUAL_REVIEW"] } },
      {
        status: decision === "APPROVE" ? "ACTIVE" : "NGO_REJECTED",
        overrideByNgo: {
          decision,
          reason,
          ngo: req.user.id,
          at: new Date(),
        },
      },
      { new: true }
    );

    if (!beneficiary) {
      return res.status(400).json({ message: "Beneficiary already processed or not found" });
    }

    const jobIdHash = beneficiary._id.toString();

    if (decision === "APPROVE") {
      try {
        await createWalletForBeneficiary(beneficiary);
        
        // Finalize audit on approval
        await auditService.finalizeWorkflowAudit({
          jobIdHash,
          campaignId: beneficiary.campaign,
        });
      } catch (e) {
         console.warn("Wallet creation or audit finalization failed:", e.message);
      }
    }

    await auditService.log({
      eventType: "BENEFICIARY_NGO_DECISION",
      payload: { decision, reason },
      jobIdHash,
      campaignId: beneficiary.campaign,
      actorRole: "NGO",
    });

    res.json(beneficiary);
  } catch (err) {
    console.error("NGO DECISION ERROR:", err);
    res.status(500).json({ message: "Decision failed" });
  }
};

/*
 * BENEFICIARY: Get my beneficiary record
 */
export const getMyBeneficiary = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findOne({
      user: req.user.id,
    }).populate("campaign", "title status");

    if (!beneficiary) {
      return res.json(null);
    }

    res.json(beneficiary);
  } catch (err) {
    console.error("GET MY BENEFICIARY ERROR:", err);
    res.status(500).json({ message: "Failed to fetch beneficiary" });
  }
};
