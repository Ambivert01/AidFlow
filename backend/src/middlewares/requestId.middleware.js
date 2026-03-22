import { randomUUID } from "crypto";

export const requestIdMiddleware = (req, res, next) => {

  req.requestId = randomUUID();

  res.setHeader("x-request-id", req.requestId);

  next();
};