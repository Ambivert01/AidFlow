import crypto from "crypto";
import { Beneficiary } from "../models/Beneficiary.model.js";
import { Campaign } from "../models/Campaign.model.js";
import { User } from "../models/User.model.js";
import { AuditService } from "../services/audit.service.js";
import { evaluateBeneficiaryAI } from "../services/ai/beneficiaryEvaluation.service.js";

const auditService = new AuditService();

/*
 * NGO: Register Beneficiary
 */
export const registerBeneficiary = async (req, res) => {
  try {
    const { name, aadhaar, location, campaignId } = req.body;

    // 1 Validate campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Invalid or inactive campaign",
      });
    }

    // 2 Hash Aadhaar (NO PII STORAGE)
    const aadhaarHash = crypto
      .createHash("sha256")
      .update(aadhaar)
      .digest("hex");

    // 3 Create User (BENEFICIARY)
    const user = await User.create({
      name,
      role: "BENEFICIARY",
      aadhaarHash,
    });

    // 4 Run AI evaluation
    const aiDecision = await evaluateBeneficiaryAI({
      aadhaarHash,
      location,
    });

    // 5 Persist Beneficiary
    const beneficiary = await Beneficiary.create({
      user: user._id,
      campaign: campaign._id,
      aiDecision,
      status:
        aiDecision.risk.decision === "ALLOW"
          ? "APPROVED"
          : aiDecision.risk.decision === "BLOCK"
          ? "BLOCKED"
          : "REGISTERED",
      registeredBy: req.user.id,
    });

    // 6 AUDIT LOG
    await auditService.log({
      eventType: "BENEFICIARY_REGISTERED",
      payload: {
        beneficiaryId: beneficiary._id,
        decision: aiDecision.risk.decision,
      },
      jobIdHash: beneficiary._id.toString(),
      campaignId: campaign._id,
      actorRole: "NGO",
    });

    res.status(201).json({
      message: "Beneficiary registered",
      beneficiary,
    });
  } catch (err) {
    console.error("BENEFICIARY REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};

/*
 * NGO: List Beneficiaries
 */
export const listBeneficiaries = async (req, res) => {
  const beneficiaries = await Beneficiary.find()
    .populate("user campaign")
    .sort({ createdAt: -1 });

  res.json(beneficiaries);
};
