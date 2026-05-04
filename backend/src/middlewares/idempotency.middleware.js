import { IdempotencyKey } from "../models/IdempotencyKey.model.js";
import { AppError } from "../utils/AppError.js";

/**
 * Idempotency middleware for preventing duplicate operations
 * Checks for Idempotency-Key header and manages operation state
 */
export const idempotencyMiddleware = async (req, res, next) => {
  // Check for idempotency key in header or body
  const idempotencyKey =
    req.headers["idempotency-key"] || (req.body && req.body.idempotencyKey);

  // If no idempotency key provided, proceed without idempotency check
  if (!idempotencyKey) {
    return next();
  }

  try {
    // Check for existing idempotency record
    let idempotencyRecord = await IdempotencyKey.findOne({
      key: idempotencyKey,
    });

    if (idempotencyRecord) {
      // If operation is completed, return cached result
      if (idempotencyRecord.status === "COMPLETED") {
        return res.status(200).json(idempotencyRecord.result);
      }

      // If operation is pending, wait and retry (simple polling approach)
      if (idempotencyRecord.status === "PENDING") {
        // Wait for a short time and check again
        await new Promise((resolve) => setTimeout(resolve, 1000));
        idempotencyRecord = await IdempotencyKey.findOne({
          key: idempotencyKey,
        });

        if (idempotencyRecord && idempotencyRecord.status === "COMPLETED") {
          return res.status(200).json(idempotencyRecord.result);
        }

        // If still pending after wait, return conflict error
        throw new AppError("Operation in progress, please retry", 409);
      }

      // If operation failed, allow retry
      if (idempotencyRecord.status === "FAILED") {
        // Delete failed record to allow retry
        await IdempotencyKey.deleteOne({ key: idempotencyKey });
      }
    }

    // Determine operation type from route
    let operationType = "WALLET_CREATE";
    if (req.path.includes("/spend")) {
      operationType = "WALLET_SPEND";
    } else if (req.path.includes("/credit")) {
      operationType = "WALLET_CREDIT";
    } else if (req.path.includes("/adjust")) {
      operationType = "WALLET_ADJUST";
    }

    // Create new idempotency record
    const newRecord = await IdempotencyKey.create({
      key: idempotencyKey,
      operation: operationType,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours TTL
    });

    // Store idempotency record ID in request for later use
    req.idempotencyRecordId = newRecord._id;
    req.idempotencyKey = idempotencyKey;

    // Intercept response to store result
    const originalJson = res.json.bind(res);
    res.json = async function (data) {
      try {
        // Update idempotency record with result
        await IdempotencyKey.findByIdAndUpdate(req.idempotencyRecordId, {
          status: "COMPLETED",
          result: data,
        });
      } catch (error) {
        console.error("Failed to update idempotency record:", error);
      }
      return originalJson(data);
    };

    // Handle errors by updating idempotency record
    const originalNext = next;
    next = async function (error) {
      if (error && req.idempotencyRecordId) {
        try {
          await IdempotencyKey.findByIdAndUpdate(req.idempotencyRecordId, {
            status: "FAILED",
            error: {
              message: error.message,
              code: error.statusCode || 500,
            },
          });
        } catch (updateError) {
          console.error(
            "Failed to update idempotency record with error:",
            updateError,
          );
        }
      }
      return originalNext(error);
    };

    next();
  } catch (error) {
    console.error("Idempotency middleware error:", error);
    next(error);
  }
};
