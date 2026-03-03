import bcrypt from "bcryptjs";
import { User } from "../models/userModel.js";

// ─────────────────────────────────────────────
// GET /api/customer/profile
// ─────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const customer = await User.findById(req.userId).select(
      "-password -token -otp -otpExpiry"
    );

    if (!customer || customer.role !== "customer") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({
      success: true,
      customer: {
        _id: customer._id,
        name: customer.username,
        email: customer.email,
        phone: customer.phone || "",
        profileImage: customer.profileImage || "",
        createdAt: customer.createdAt,
      },
    });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PUT /api/customer/profile
// Body: { name, phone }
// ─────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const updated = await User.findByIdAndUpdate(
      req.userId,
      { username: name.trim(), phone: phone?.trim() || "" },
      { new: true, select: "-password -token -otp -otpExpiry" }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      customer: {
        name: updated.username,
        phone: updated.phone,
        email: updated.email,
        profileImage: updated.profileImage,
      },
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PUT /api/customer/change-password
// Body: { currentPassword, newPassword }
// ─────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "New password must be at least 6 characters" });
    }

    const customer = await User.findById(req.userId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, customer.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    customer.password = hashed;
    await customer.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// POST /api/customer/upload-profile-image
// multer processes the file → req.file
// ─────────────────────────────────────────────
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image file uploaded" });
    }

    const imagePath = req.file.path.replace(/\\/g, "/");

    const updated = await User.findByIdAndUpdate(
      req.userId,
      { profileImage: imagePath },
      { new: true, select: "-password -token -otp -otpExpiry" }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({
      success: true,
      message: "Profile image updated successfully",
      profileImage: imagePath,
    });
  } catch (err) {
    console.error("uploadProfileImage error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
