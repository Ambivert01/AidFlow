import express from "express";
import cors from "cors";

import "./config/env.config.js";

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

const app = express();

/*
SECURITY
*/
app.use(helmet());
app.use(hpp());

/*
CORS
*/
app.use(
  cors({
    origin: true,
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
