import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";

const ALLOWED_ROLES = [
  "DONOR",
  "NGO",
  "BENEFICIARY",
  "MERCHANT",
  "GOVERNMENT",
  "ADMIN",
];

/*
 * Register new user
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (role !== "DONOR") {
      return res.status(403).json({
        message: "Only donors can self-register",
      });
    }

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
};

/*
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1 Fetch user first
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 2 Check verification status (NOW user exists)
    if (user.verificationStatus === "PENDING") {
      return res.status(403).json({
        message: "Account pending admin approval",
      });
    }

    if (user.verificationStatus === "REJECTED") {
      return res.status(403).json({
        message: "Access request rejected",
      });
    }

    // 3 Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4 Generate JWT (ROLE IS CRITICAL)
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5 Respond
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

