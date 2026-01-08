import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { getWorkflowVisibility } from "../controllers/workflow.visibility.controller.js";

const router = express.Router();

router.get(
  "/workflow/:campaignId",
  authenticate,
  authorizeRoles("NGO"),
  getWorkflowVisibility
);

export default router;
