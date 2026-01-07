import { Campaign } from "../models/Campaign.model.js";
import { AuditService } from "../services/audit.service.js";
import { runWorkflow } from "../services/workflow.engine.js";

const audit = new AuditService();

export const startWorkflow = async (req, res) => {
  const { campaignId } = req.body;

  const campaign = await Campaign.findById(campaignId);

  if (!campaign)
    return res.status(404).json({ message: "Campaign not found" });

  if (campaign.createdBy.toString() !== req.user.id)
    return res.status(403).json({ message: "Not your campaign" });

  if (campaign.status !== "ACTIVE")
    return res.status(400).json({
      message: "Workflow can only start from ACTIVE state"
    });

  // STATE TRANSITION (AUTHORITATIVE)
  campaign.status = "WORKFLOW_RUNNING";
  await campaign.save();

  await audit.log({
    eventType: "WORKFLOW_STARTED",
    jobIdHash: campaign.jobIdHash,
    campaignId: campaign._id,
    actorRole: "SYSTEM",
    payload: { campaignId }
  });

  // ASYNC WORKFLOW
  runWorkflow(campaign._id);

  res.json({ message: "Workflow started" });
};
