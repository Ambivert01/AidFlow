import jwt from "jsonwebtoken";
import { User } from "../models/auth/User.model.js";
import { jwtConfig } from "../config/jwt.config.js";
import {
  requiresApproval,
  VERIFICATION_STATUS,
} from "../constants/roles.constants.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, jwtConfig.secret);

    const user = await User.findById(decoded.sub);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid user" });
    }

    // Re-check approval status on every request, not just at login. Roles
    // that require admin approval (NGO / MERCHANT / GOVERNMENT) can be
    // rejected or have their approval revoked *after* they already hold a
    // valid, unexpired token - without this check, a revoked organisation
    // could keep using the platform until their old token naturally expires.
    if (
      requiresApproval(user.role) &&
      user.verificationStatus !== VERIFICATION_STATUS.APPROVED
    ) {
      return res.status(403).json({
        message:
          user.verificationStatus === VERIFICATION_STATUS.REJECTED
            ? "Your account approval has been revoked. Contact support."
            : "Your account is pending admin approval.",
        code: "PENDING_APPROVAL",
      });
    }

    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
