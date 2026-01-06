import express from "express";
import { Shop } from "../models/shopModel.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

// Update shop name
router.put("/update-shop-name", isAuthenticated, async (req, res) => {
  try {
    const ownerId = req.user._id; // from your auth middleware
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: "Shop name is required" });

    const shop = await Shop.findOneAndUpdate(
      { ownerId },
      { name },
      { new: true }
    );

    if (!shop) return res.status(404).json({ message: "Shop not found" });

    res.json({ shop });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating shop name" });
  }
});

export default router;
