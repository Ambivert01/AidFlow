import { asyncHandler } from "../../core/asyncHandler.js";
import { FraudCase } from "../../models/FraudCase.model.js";
import { ApiResponse } from "../../core/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import { createAuditLog } from "../audit/audit.service.js";
import mongoose from "mongoose";

/**
 * Get all fraud cases with filters
 */
export const getFraudCases = asyncHandler(async (req, res) => {
  const { status, entityType, assignedTo } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (entityType) filter.entityType = entityType;
  if (assignedTo) filter.assignedTo = assignedTo;

  const cases = await FraudCase.find(filter)
    .populate("assignedTo", "name email")
    .populate("resolvedBy", "name email")
    .populate("relatedCampaign", "title")
    .populate("relatedUser", "name email role")
    .sort({ createdAt: -1 })
    .limit(200);

  res.json(ApiResponse.success(cases));
});

/**
 * Get single fraud case with full details
 */
export const getFraudCase = asyncHandler(async (req, res) => {
  const fraudCase = await FraudCase.findById(req.params.id)
    .populate("assignedTo", "name email")
    .populate("resolvedBy", "name email")
    .populate("relatedCampaign", "title status")
    .populate("relatedUser", "name email role")
    .populate("notes.addedBy", "name email");

  if (!fraudCase) {
    throw new AppError("Fraud case not found", 404);
  }

  res.json(ApiResponse.success(fraudCase));
});

/**
 * Assign fraud case to investigator
 */
export const assignFraudCase = asyncHandler(async (req, res) => {
  const { investigatorId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(investigatorId)) {
    throw new AppError("Invalid investigator ID", 400);
  }

  const fraudCase = await FraudCase.findById(req.params.id);
  if (!fraudCase) {
    throw new AppError("Fraud case not found", 404);
  }

  fraudCase.assignedTo = investigatorId;
  fraudCase.status = "INVESTIGATING";
  await fraudCase.save();

  // Create audit log
  await createAuditLog({
    eventType: "FRAUD_CASE_ASSIGNED",
    eventCategory: "FRAUD",
    entityType: "FraudCase",
    entityId: fraudCase._id.toString(),
    actorId: req.user._id.toString(),
    actorRole: req.user.role,
    payload: {
      caseId: fraudCase._id,
      assignedTo: investigatorId,
    },
  });

  res.json(ApiResponse.updated(fraudCase));
});

/**
 * Add note to fraud case
 */
export const addFraudCaseNote = asyncHandler(async (req, res) => {
  const { note } = req.body;

  if (!note || note.trim() === "") {
    throw new AppError("Note is required", 400);
  }

  const fraudCase = await FraudCase.findById(req.params.id);
  if (!fraudCase) {
    throw new AppError("Fraud case not found", 404);
  }

  fraudCase.notes.push({
    addedBy: req.user._id,
    note: note.trim(),
    addedAt: new Date(),
  });

  await fraudCase.save();

  res.json(ApiResponse.updated(fraudCase));
});

/**
 * Resolve fraud case
 */
export const resolveFraudCase = asyncHandler(async (req, res) => {
  const { decision, notes, actionTaken } = req.body;

  if (!decision) {
    throw new AppError("Decision is required", 400);
  }

  if (!["CONFIRMED_FRAUD", "FALSE_POSITIVE", "DISMISSED"].includes(decision)) {
    throw new AppError("Invalid decision", 400);
  }

  const fraudCase = await FraudCase.findById(req.params.id);
  if (!fraudCase) {
    throw new AppError("Fraud case not found", 404);
  }

  if (fraudCase.status === "RESOLVED") {
    throw new AppError("Case already resolved", 400);
  }

  fraudCase.status = "RESOLVED";
  fraudCase.resolution = {
    decision,
    notes: notes || null,
    actionTaken: actionTaken || null,
  };
  fraudCase.resolvedBy = req.user._id;
  fraudCase.resolvedAt = new Date();

  await fraudCase.save();

  // Create audit log
  await createAuditLog({
    eventType: "FRAUD_CASE_RESOLVED",
    eventCategory: "FRAUD",
    entityType: "FraudCase",
    entityId: fraudCase._id.toString(),
    actorId: req.user._id.toString(),
    actorRole: req.user.role,
    payload: {
      caseId: fraudCase._id,
      decision,
      actionTaken,
    },
  });

  res.json(ApiResponse.updated(fraudCase));
});

/**
 * Get fraud statistics
 */
export const getFraudStats = asyncHandler(async (req, res) => {
  const [totalCases, openCases, investigating, resolved, confirmedFraud] =
    await Promise.all([
      FraudCase.countDocuments(),
      FraudCase.countDocuments({ status: "OPEN" }),
      FraudCase.countDocuments({ status: "INVESTIGATING" }),
      FraudCase.countDocuments({ status: "RESOLVED" }),
      FraudCase.countDocuments({
        "resolution.decision": "CONFIRMED_FRAUD",
      }),
    ]);

  const stats = {
    totalCases,
    openCases,
    investigating,
    resolved,
    confirmedFraud,
    falsePositives: resolved - confirmedFraud,
  };

  res.json(ApiResponse.success(stats));
});
