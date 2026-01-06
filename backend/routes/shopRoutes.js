import express from "express";
import { Shop } from "../models/shopModel.js";

const router = express.Router();

// PUBLIC: Get all shops
router.get("/", async (req, res) => {
  try {
    const shops = await Shop.find()
      .populate("ownerId", "username");

    res.json({ shops });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
