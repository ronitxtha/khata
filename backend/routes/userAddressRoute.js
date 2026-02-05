// routes/userAddressRoute.js
import express from "express";
import { User } from "../models/userModel.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

// GET saved address
router.get("/address", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ address: user.address || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT save / update address
router.put("/address", isAuthenticated, async (req, res) => {
  const { province, district, municipality, ward, exactLocation } = req.body;
  if (!province || !district || !municipality || !ward) {
    return res.status(400).json({ success: false, message: "Please provide full address" });
  }

  try {
    const user = await User.findById(req.user._id);
    user.address = { province, district, municipality, ward, exactLocation };
    await user.save();
    res.json({ success: true, address: user.address });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
