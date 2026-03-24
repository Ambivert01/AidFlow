import mongoose from "mongoose";
import app from "./src/app.js";
import { logger } from "./src/utils/logger.js";

const PORT = process.env.PORT || 5000;

/*
DATABASE CONNECTION
*/
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    logger.info("MongoDB connected");
  } catch (error) {
    logger.error("MongoDB connection failed", error);

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

  app.listen(PORT, () => {
    logger.info(`AidFlow server running on port ${PORT}`);
  });
};

startServer();

/*
HANDLE TERMINATION SIGNALS
*/
process.on("SIGINT", shutdown);

process.on("SIGTERM", shutdown);
