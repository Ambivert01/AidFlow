import express from "express";
import { requestAccess } from "../controllers/access.controller.js";

const router = express.Router();

// NGO / MERCHANT apply
router.post("/request", requestAccess);

export default router;
