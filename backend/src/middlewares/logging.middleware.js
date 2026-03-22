import { logger } from "../utils/logger.js";

export const loggingMiddleware = (req, res, next) => {

  const start = Date.now();

  res.on("finish", () => {

    logger.info({
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: Date.now() - start,
      user: req.user?._id,
    });

  });

  next();
};