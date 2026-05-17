import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

// ── General auth middleware (all roles) ──────────────────────────────────────
export const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authorization token is missing or invalid" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Your account has been disabled by the admin." });
    }

    // Admin and customer don't need a shopId
    let shopId = user.shopId;
    if (user.role === "staff" && !shopId) {
      const owner = await User.findById(user.ownerId);
      shopId = owner?.shopId || null;
    }

    if (user.role !== "customer" && user.role !== "admin" && !shopId) {
      return res.status(400).json({ success: false, message: "Shop not associated with this user" });
    }

    // Check if the shop owner is disabled (for staff) or shop is suspended
    if (shopId) {
      const { Shop } = await import("../models/shopModel.js");
      const shop = await Shop.findById(shopId).populate("ownerId");
      if (shop) {
        if (shop.ownerId && !shop.ownerId.isActive && user.role === "staff") {
          return res.status(403).json({ success: false, message: "The store owner's account has been disabled." });
        }
      }
    }

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    req.shopId = shopId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === "TokenExpiredError"
        ? "Access token expired, generate a new one"
        : "Access token is invalid",
    });
  }
};

// ── Token-only middleware (no isActive check) ────────────────────────────────
// Use ONLY for status-check endpoints where a disabled user must still get a
// meaningful response rather than a blanket 403.
export const checkTokenOnly = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authorization token missing" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    req.user   = user;
    req.userId = user._id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// ── Role-specific guard middleware ───────────────────────────────────────────
export const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

export const isOwner = (req, res, next) => {
  if (req.user?.role !== "owner") {
    return res.status(403).json({ success: false, message: "Owner access required" });
  }
  next();
};

export const isStaff = (req, res, next) => {
  if (req.user?.role !== "staff") {
    return res.status(403).json({ success: false, message: "Staff access required" });
  }
  next();
};

export const isOwnerOrStaff = (req, res, next) => {
  if (req.user?.role !== "owner" && req.user?.role !== "staff") {
    return res.status(403).json({ success: false, message: "Owner or Staff access required" });
  }
  next();
};
