import bcrypt from "bcryptjs";
import { User } from "../models/userModel.js";
import { Shop } from "../models/shopModel.js";
import Attendance from "../models/Attendance.js";

// ─────────────────────────────────────────────
// GET /api/staff/profile
// ─────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const staff = await User.findById(req.userId).select("-password -token -otp -otpExpiry");

    if (!staff || staff.role !== "staff") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Populate shop name
    let shopName = "Not assigned";
    if (req.shopId) {
      const shop = await Shop.findById(req.shopId).select("name");
      if (shop) shopName = shop.name;
    }

    res.json({
      success: true,
      staff: {
        _id: staff._id,
        username: staff.username,
        email: staff.email,
        phone: staff.phone || "",
        role: staff.role,
        profileImage: staff.profileImage || "",
        shopName,
        createdAt: staff.createdAt,
      },
    });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PUT /api/staff/profile
// Body: { username, phone }
// ─────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { username, phone } = req.body;

    if (!username || username.trim() === "") {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const updated = await User.findByIdAndUpdate(
      req.userId,
      { username: username.trim(), phone: phone?.trim() || "" },
      { new: true, select: "-password -token -otp -otpExpiry" }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    res.json({ success: true, message: "Profile updated successfully", staff: updated });
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PUT /api/staff/change-password
// Body: { currentPassword, newPassword }
// ─────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    // Fetch the user WITH password for comparison
    const staff = await User.findById(req.userId);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, staff.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    staff.password = hashed;
    await staff.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/staff/today-attendance
// ─────────────────────────────────────────────
export const getTodayAttendance = async (req, res) => {
  try {
    const staffId = req.userId;

    // Build today's date range (midnight → 23:59:59)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayRecord = await Attendance.findOne({
      staffId,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    if (!todayRecord) {
      return res.json({
        success: true,
        today: null,
        message: "No attendance record found for today",
        week: [],
      });
    }

    // Calculate total working hours for today
    const checkIn = todayRecord.checkInTime;
    const checkOut = todayRecord.checkOutTime || todayRecord.lastLogoutClick;
    const endTime = checkOut || new Date(); // if still working, use now

    let totalHours = 0;
    if (checkIn) {
      const diffMs = endTime - checkIn;
      totalHours = Math.max(0, diffMs / (1000 * 60 * 60));
    }

    const isStillWorking = !todayRecord.checkOutTime && !todayRecord.lastLogoutClick;

    // Fetch last 7 days for the weekly table
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weekRecords = await Attendance.find({
      staffId,
      date: { $gte: weekStart, $lte: todayEnd },
    }).sort({ date: -1 });

    const week = weekRecords.map((rec) => {
      const cin = rec.checkInTime;
      const cout = rec.checkOutTime || rec.lastLogoutClick;
      let hours = 0;
      if (cin && cout) {
        hours = Math.max(0, (cout - cin) / (1000 * 60 * 60));
      }
      return {
        date: rec.date,
        checkIn: cin,
        checkOut: cout,
        totalHours: hours.toFixed(2),
        status: rec.status,
      };
    });

    res.json({
      success: true,
      today: {
        checkInTime: todayRecord.checkInTime,
        checkOutTime: todayRecord.checkOutTime || todayRecord.lastLogoutClick,
        totalHours: totalHours.toFixed(2),
        isStillWorking,
        status: todayRecord.status,
      },
      week,
    });
  } catch (err) {
    console.error("getTodayAttendance error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// POST /api/staff/upload-profile-image
// multer processes the file → req.file
// ─────────────────────────────────────────────
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file uploaded" });
    }

    // Store path relative to server root (e.g. "uploads/staff/staff-xxx-timestamp.jpg")
    const imagePath = req.file.path.replace(/\\/g, "/");

    const updated = await User.findByIdAndUpdate(
      req.userId,
      { profileImage: imagePath },
      { new: true, select: "-password -token -otp -otpExpiry" }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Staff not found" });
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
