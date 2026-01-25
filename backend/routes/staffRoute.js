import express from "express";
import { Product } from "../models/productModel.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import Attendance from "../models/Attendance.js";

const router = express.Router();

// ----------------------- Staff: View Products -----------------------
router.get("/products", isAuthenticated, async (req, res) => {
  try {
    // staff only sees products from their shop
    const products = await Product.find({ shopId: req.shopId });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Staff login endpoint
router.post("/login", isAuthenticated, async (req, res) => {
  try {
    const staffId = req.user._id;
    const shopId = req.user.shopId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Find today's attendance for staff
    let attendance = await Attendance.findOne({
      staffId,
      shopId,
      date: { $gte: today, $lt: tomorrow },
    });

    if (!attendance) {
      // First login of the day
      attendance = await Attendance.create({
        staffId,
        shopId,
        date: today,
        sessions: [{ checkInTime: new Date() }],
      });
    } else {
      // Already has attendance today, add a new session
      attendance.sessions.push({ checkInTime: new Date() });
      await attendance.save();
    }

    res.json({ message: "Login recorded", attendance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

router.post("/logout-click", isAuthenticated, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const staffId = req.user._id;

    const start = new Date();
    start.setHours(0,0,0,0);

    const end = new Date();
    end.setHours(23,59,59,999);

    const attendance = await Attendance.findOne({
      staffId,
      date: { $gte: start, $lte: end },
    });

    if (!attendance) {
      return res.status(400).json({ message: "Attendance not found for today" });
    }

    attendance.lastLogoutClick = new Date();
    await attendance.save();

    res.json({
      message: "Logout click recorded (finalized at end of day)",
    });

  } catch (err) {
    console.error("Logout-click error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



export default router;
