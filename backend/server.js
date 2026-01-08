import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./src/app.js";
import { logger } from "./src/utils/logger.js";

dotenv.config();

/*
import dotenv from "dotenv";
dotenv.config();
 
add in the app.js only if not added here
*/

const PORT = process.env.PORT || 5000;

/*
 * Database Connection
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error("MongoDB connection failed", { error });
    process.exit(1);
  }
};

/*
 * Server Bootstrap
 */
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
};

startServer();
