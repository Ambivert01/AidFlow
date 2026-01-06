import { User } from "../models/User.model.js";
import bcrypt from "bcryptjs";

export const requestAccess = async (req, res) => {
  try {
    const { name, email, password, role, documents } = req.body;

    if (!["NGO", "MERCHANT"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role request",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      verificationStatus: "PENDING",
      documents,
    });

    res.status(201).json({
      message: "Access request submitted. Await admin approval.",
    });
  } catch (err) {
    res.status(500).json({ message: "Request failed" });
  }
};
