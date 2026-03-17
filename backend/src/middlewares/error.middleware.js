import pino from "pino";

const logger = pino();

export const errorHandler = (err, req, res, next) => {
  logger.error(err); 

  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let code = err.code || "INTERNAL_ERROR";

  // Zod validation error
  if (err.name === "ZodError") {
    statusCode = 400;
    message = "Validation failed";
    code = "VALIDATION_ERROR";

    return res.status(statusCode).json({
      success: false,
      code,
      message,
      errors: err.errors,
    });
  }

  // Mongo duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      code: "DUPLICATE_ERROR",
      message: "Duplicate field value",
    });
  }

  res.status(statusCode).json({
    success: false,
    code,
    message,
  });
};