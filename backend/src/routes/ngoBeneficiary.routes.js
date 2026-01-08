import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
  registerBeneficiary,
  ngoOverrideDecision
} from "../controllers/ngoBeneficiary.controller.js";

const router = express.Router();

router.use(authenticate, authorizeRoles("NGO"));

router.post("/beneficiaries", registerBeneficiary);
router.post("/beneficiaries/:id/override", ngoOverrideDecision);

export default router;
