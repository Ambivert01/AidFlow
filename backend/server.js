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
    // Temporary debug log — remove after confirming env vars are injected
    logger.info(
      `MONGO_URI set: ${process.env.MONGO_URI ? "YES (length=" + process.env.MONGO_URI.length + ")" : "NO - undefined"}`,
    );
    logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);

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
