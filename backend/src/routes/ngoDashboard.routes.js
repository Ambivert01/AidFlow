import express from "express";
import { getNgoDashboard } from "../controllers/ngoDashboard.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  authenticate,
  authorizeRoles("NGO"),
  getNgoDashboard
);

export default router;
