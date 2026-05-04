import express from "express";
import trustController from "./trust.controller.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

const router = express.Router();

// PUBLIC ROUTES
/**
 * @swagger
 * /api/trust/ngo/{id}:
 *   get:
 *     summary: Get NGO trust score
 *     tags: [Trust]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: NGO trust score retrieved
 */
router.get("/ngo/:id", trustController.getNGOTrust);

/**
 * @swagger
 * /api/trust/campaign/{id}:
 *   get:
 *     summary: Get Campaign trust score
 *     tags: [Trust]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign trust score retrieved
 */
router.get("/campaign/:id", trustController.getCampaignTrust);

/**
 * @swagger
 * /api/trust/merchant/{id}:
 *   get:
 *     summary: Get Merchant trust score
 *     tags: [Trust]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Merchant trust score retrieved
 */
router.get("/merchant/:id", trustController.getMerchantTrust);

/**
 * @swagger
 * /api/trust/history/{entityType}/{id}:
 *   get:
 *     summary: Get trust score history
 *     tags: [Trust]
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ngo, campaign, merchant]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Trust history retrieved
 */
router.get("/history/:entityType/:id", trustController.getTrustHistory);

/**
 * @swagger
 * /api/trust/top/{entityType}:
 *   get:
 *     summary: Get top trusted entities
 *     tags: [Trust]
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ngo, campaign, merchant]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top trusted entities retrieved
 */
router.get("/top/:entityType", trustController.getTopTrusted);

// ADMIN ROUTES
/**
 * @swagger
 * /api/trust/update/{entityType}/{id}:
 *   post:
 *     summary: Manually update trust score
 *     tags: [Trust]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ngo, campaign, merchant]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trust score updated
 */
router.post(
  "/update/:entityType/:id",
  authenticate,
  authorize(["ADMIN"]),
  trustController.updateTrustScore,
);

/**
 * @swagger
 * /api/trust/recalculate/{entityType}:
 *   post:
 *     summary: Recalculate all trust scores for entity type
 *     tags: [Trust]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ngo, campaign, merchant]
 *     responses:
 *       200:
 *         description: Trust scores recalculated
 */
router.post(
  "/recalculate/:entityType",
  authenticate,
  authorize(["ADMIN"]),
  trustController.recalculateAll,
);

export default router;
