import express from "express";
import cors from "cors";
import morgan from "morgan";

// Routes
import authRoutes from "./routes/auth.routes.js";
import donationRoutes from "./routes/donation.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import beneficiaryRoutes from "./routes/beneficiary.routes.js";
import donorRoutes from "./routes/donor.routes.js";




const app = express();

/**
 * --------------------
 * Global Middlewares
 * --------------------
 */
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

/**
 * --------------------
 * API Routes
 * --------------------
 */

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/beneficiary", beneficiaryRoutes);
app.use("/api/donor", donorRoutes);
app.use("/api/audit", auditRoutes);



/**
 * --------------------
 * Health Check
 * --------------------
 */
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "AidFlow Backend" });
});

export default app;
