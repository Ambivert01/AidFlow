import express from "express";
import cors from "cors";
import morgan from "morgan";

// Routes
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import donationRoutes from "./routes/donation.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import beneficiaryRoutes from "./routes/beneficiary.routes.js";
import donorRoutes from "./routes/donor.routes.js";
import merchantRoutes from "./routes/merchant.routes.js";
import accessRoutes from "./routes/access.routes.js";
import ngoDashboardRoutes from "./routes/ngoDashboard.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import publicRoutes from "./routes/public.routes.js";
import rateLimit from "express-rate-limit";


const app = express();

/*
 * Global Middlewares
 */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.use(morgan("dev"));

app.use(rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100
}));

/*
 * API Routes
 */

app.use("/api/access", accessRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/beneficiary", beneficiaryRoutes);
app.use("/api/donor", donorRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/ngo", ngoDashboardRoutes);
app.use("/api/merchant", merchantRoutes);
app.use("/api/public", publicRoutes);
app.use("/payments", paymentsRoutes);



/*
 * Health Check
 */
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "AidFlow Backend" });
});

export default app;
