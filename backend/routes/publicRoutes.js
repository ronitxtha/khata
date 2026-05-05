import express from "express";
import { Shop } from "../models/shopModel.js";

const router = express.Router();

// Get all shops
router.get("/shops", async (req, res) => {
  try {
    const shops = await Shop.find()
      .populate("ownerId", "username isActive");

    const validShops = shops.filter(shop => shop.ownerId?.isActive && shop.status !== "suspended");

    res.json({ shops: validShops });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
