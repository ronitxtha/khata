import express from "express";
import { Product } from "../models/productModel.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import Attendance from "../models/attendance.js";

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

router.post("/logout-click", isAuthenticated, async (req, res) => {
  try {
    const staffId = req.user._id;
    const today = new Date();
    today.setHours(0,0,0,0);

    const attendance = await Attendance.findOne({ staffId, date: today });
    if (!attendance) return res.status(400).json({ message: "Attendance not found" });

    // Record only the last logout click
    attendance.lastLogoutClick = new Date();
    await attendance.save();

    res.json({ message: "Logout click recorded (will be saved at end of day)" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
