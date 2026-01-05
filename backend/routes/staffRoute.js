import express from "express";
import { Product } from "../models/productModel.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

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

export default router;
