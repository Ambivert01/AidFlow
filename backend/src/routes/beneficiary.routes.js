import express from "express";
import {
  registerBeneficiary,
  listBeneficiaries,
} from "../controllers/beneficiary.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authenticate, authorizeRoles("NGO"));

router.post("/", registerBeneficiary);
router.get("/", listBeneficiaries);

export default router;
