import { IdempotencyKey } from "../models/IdempotencyKey.model.js";

export const idempotencyMiddleware = async (req, res, next) => {
  const key = req.headers["idempotency-key"];

  if (!key) return next();

  const existing = await IdempotencyKey.findOne({ key });

  if (existing) {
    return res.json(existing.response);
  }

  req.idempotencyKey = key;

  next();
};
