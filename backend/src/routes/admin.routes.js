import express from "express";
import {
  getPendingRequests,
  approveRequest,
  rejectRequest,
} from "../controllers/admin.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authenticate, authorizeRoles("ADMIN"));

router.get("/access/pending", getPendingRequests);
router.post("/access/:id/approve", approveRequest);
router.post("/access/:id/reject", rejectRequest);

export default router;
