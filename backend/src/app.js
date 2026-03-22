// import "dotenv/config";

// import express from "express";
// import cors from "cors";
// import morgan from "morgan";
// import rateLimit from "express-rate-limit";
// import "./config/env.config.js";

// // Routes
// import authRoutes from "./routes/auth.routes.js";
// import adminRoutes from "./routes/admin.routes.js";
// import donorRoutes from "./routes/donor.routes.js";
// import ngoRoutes from "./routes/ngo.routes.js";
// import beneficiaryRoutes from "./routes/beneficiary.routes.js";
// import donationRoutes from "./routes/donation.routes.js";
// import campaignRoutes from "./routes/campaign.routes.js";
// import merchantRoutes from "./routes/merchant.routes.js";
// import governmentRoutes from "./routes/government.routes.js";
// import walletRoutes from "./routes/wallet.routes.js";
// import publicRoutes from "./routes/public.routes.js";
// import auditRoutes from "./routes/audit.routes.js";
// import ngoWorkflowRoutes from "./routes/ngoWorkflow.routes.js";
// import ngoDashboardRoutes from "./routes/ngoDashboard.routes.js";
// import accessRoutes from "./routes/access.routes.js";

// import { errorHandler } from "./middlewares/error.middleware.js";
// import { requestIdMiddleware } from "./middlewares/requestId.middleware.js";
// import { loggingMiddleware } from "./middlewares/logging.middleware.js";

// const app = express();

// /*
//  * Global Middlewares
//  */
// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://localhost:5174",
//   "http://localhost:3000",
//   process.env.FRONTEND_URL,
// ].filter(Boolean);

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // Allow requests with no origin (like mobile apps or curl requests)
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }
//       return callback(new Error("Not allowed by CORS"));
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// app.use(errorHandler);
// app.use(requestIdMiddleware);
// app.use(loggingMiddleware);

// app.use((req, res, next) => {
//   if (req.method === "OPTIONS") return res.sendStatus(204);
//   next();
// });

// app.use(express.json({ limit: "10mb" }));
// app.use(morgan("dev"));

// // Rate limiting
// app.use(
//   rateLimit({
//     windowMs: 1 * 60 * 1000, // 1 minute
//     max: 200,
//     message: { message: "Too many requests, please slow down" },
//     standardHeaders: true,
//     legacyHeaders: false,
//   })
// );

// /*
//  * API Routes — ordered by specificity (no conflicts)
//  */

// // Auth (public)
// app.use("/api/auth", authRoutes);
// app.use("/api/access", accessRoutes);

// // Public (unauthenticated)
// app.use("/api/public", publicRoutes);

// // Campaigns (mixed public + role-protected)
// app.use("/api/campaigns", campaignRoutes);

// // Role-specific dashboards
// app.use("/api/admin", adminRoutes);
// app.use("/api/donor", donorRoutes);
// app.use("/api/ngo", ngoRoutes);
// app.use("/api/ngo", ngoDashboardRoutes);
// app.use("/api/ngo", ngoWorkflowRoutes);
// app.use("/api/government", governmentRoutes);

// // Beneficiary (self-service)
// app.use("/api/beneficiary", beneficiaryRoutes);

// // Merchant endpoints
// app.use("/api/merchant", merchantRoutes);

// // Donations
// app.use("/api/donations", donationRoutes);

// // Wallet + payments (consolidated)
// app.use("/api", walletRoutes);   // handles /api/wallet/me, /api/payments/scan, /api/payments/confirm etc.

// // Audit
// app.use("/api/audit", auditRoutes);

// /*
//  * Health Check
//  */
// app.get("/health", (req, res) => {
//   res.json({
//     status: "OK",
//     service: "AidFlow Backend",
//     timestamp: new Date().toISOString(),
//   });
// });

// /*
//  * 404 Handler
//  */
// app.use((req, res) => {
//   res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
// });

// /*
//  * Global Error Handler
//  */
// app.use((err, req, res, next) => {
//   console.error("UNHANDLED ERROR:", err);
//   res.status(500).json({ message: err.message || "Internal server error" });
// });

// export default app;

import express from "express";

import "./config/env.config.js";

import routes from "./routes/index.js";

import { errorHandler } from "./middlewares/error.middleware.js";

import { requestIdMiddleware } from "./middlewares/requestId.middleware.js";

import { loggingMiddleware } from "./middlewares/logging.middleware.js";

import helmet from "helmet";

import hpp from "hpp";

const app = express();

app.use(helmet());

app.use(hpp());

app.use(express.json());

app.use(requestIdMiddleware);

app.use(loggingMiddleware);

// all routes

app.use("/api", routes);

// error handler (must be last)

app.use(errorHandler);

export default app;
