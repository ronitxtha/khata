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
