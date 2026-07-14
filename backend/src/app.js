import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { validateEnv, getAllowedOrigins } from "./config/env.config.js";

import routes from "./routes/index.js";

import { errorHandler } from "./middlewares/error.middleware.js";
import { requestIdMiddleware } from "./middlewares/requestId.middleware.js";
import { loggingMiddleware } from "./middlewares/logging.middleware.js";
import { idempotencyMiddleware } from "./middlewares/idempotency.middleware.js";

import queueDashboard from "./infrastructure/queue-dashboard.js";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

import helmet from "helmet";
import hpp from "hpp";

// Fail fast if required env vars are missing/misconfigured rather than
// booting into a silently broken state.
validateEnv();

const app = express();

/*
SECURITY
*/
app.use(helmet());
app.use(hpp());

/*
CORS
SECURITY: origin must be an explicit allowlist, never `true` (which
reflects any request's Origin header and lets any website make
credentialed requests as a logged-in user). FRONTEND_URL supports a
comma-separated list for multi-environment deploys.
*/
const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl, server-to-server, mobile apps) with no Origin header
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

/*
BODY PARSER
*/
app.use(express.json({ limit: "10mb" }));

/*
REQUEST TRACE
*/
app.use(requestIdMiddleware);

/*
LOGGING
*/
app.use(loggingMiddleware);

/*
IDEMPOTENCY (important for payments)
*/
app.use(idempotencyMiddleware);

/*
QUEUE DASHBOARD
*/
app.use("/admin/queues", queueDashboard.getRouter());

/*
SWAGGER DOCS
*/
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/*
API ROUTES
*/
app.use("/api", routes);

/*
UPLOADED FILES (local storage mode only)
fileStorage.service.js writes to UPLOAD_PATH (default ./uploads/proofs) and
returns URLs like /uploads/proofs/<file>. Serve the parent of that
directory at /uploads so the returned URL shape is actually reachable -
this route didn't exist before, so every proof photo/document URL 404'd
whenever the app ran in local-storage mode (S3 mode is unaffected, it
returns real signed URLs).
*/
if ((process.env.STORAGE_TYPE || "LOCAL") === "LOCAL") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const uploadPath = process.env.UPLOAD_PATH || "./uploads/proofs";
  const uploadsRoot = path.dirname(path.resolve(__dirname, uploadPath));
  app.use("/uploads", express.static(uploadsRoot));
}

/*
HEALTH CHECK
*/
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "AidFlow Backend",
    timestamp: new Date().toISOString(),
  });
});

/*
404 HANDLER
*/
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

/*
ERROR HANDLER (always last)
*/
app.use(errorHandler);

export default app;
