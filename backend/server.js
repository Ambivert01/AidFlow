import mongoose from "mongoose";
import { createServer } from "http";
import app from "./src/app.js";
import { logger } from "./src/utils/logger.js";
import { initializeWebSocket } from "./src/modules/donation/donation.websocket.service.js";

const PORT = process.env.PORT || 5000;

/*
DATABASE CONNECTION
*/
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    logger.info("MongoDB connected");
  } catch (error) {
    logger.error(
      { err: error.message, code: error.code, name: error.name },
      "MongoDB connection failed",
    );

    process.exit(1);
  }
};

/*
GRACEFUL SHUTDOWN
*/
const shutdown = async (signal) => {
  logger.warn(`Received ${signal}. Closing server...`);

  await mongoose.connection.close();

  logger.info("MongoDB disconnected");

  process.exit(0);
};

/*
GLOBAL ERROR HANDLING
*/
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION", err);

  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION", err);

  process.exit(1);
});

/*
SERVER START
*/
const startServer = async () => {
  await connectDB();

  // Start workers in the same process when STANDALONE_WORKERS is not set.
  // This lets the free Render tier run both API + workers in one service.
  // In production with a dedicated worker service, set STANDALONE_WORKERS=true
  // and run `node src/workers/index.js` as a separate process instead.
  if (process.env.STANDALONE_WORKERS !== "true") {
    const { connectWorkerDB } = await import("./src/workers/bootstrap.js");
    await connectWorkerDB(); // no-op if mongoose already connected (readyState===1)
    await import("./src/workers/donation.worker.js");
    await import("./src/workers/walletExpiry.worker.js");
    await import("./src/workers/ai.worker.js");
    await import("./src/workers/fraud.worker.js");
    await import("./src/workers/recurring.worker.js");
    await import("./src/workers/proof.worker.js");
    await import("./src/workers/settlement.worker.js");
    await import("./src/workers/reset.worker.js");
    const { startScheduledJobs } = await import("./src/workers/scheduler.js");
    startScheduledJobs();
    logger.info("Workers started in-process");
  }

  // Start campaign completion cron job
  const { startCampaignCompletionJob } =
    await import("./src/jobs/campaign.job.js");
  startCampaignCompletionJob();

  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize WebSocket server
  initializeWebSocket(httpServer);

  httpServer.listen(PORT, () => {
    logger.info(`AidFlow server running on port ${PORT}`);
    logger.info(`WebSocket server ready at ws://localhost:${PORT}`);
  });
};

startServer();

/*
HANDLE TERMINATION SIGNALS
*/
process.on("SIGINT", shutdown);

process.on("SIGTERM", shutdown);
