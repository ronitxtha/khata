import express from "express";
import { Product } from "../models/productModel.js";

const router = express.Router();

// QUICK DEBUG CHECK
router.get("/test", (req, res) => {
  res.json({ message: "Product routes are working!" });
});

// PUBLIC: Get all non-deleted products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({ deleted: { $ne: true } });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ NEW: Get single product by ID (needed for Product Details page)
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || product.deleted) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
