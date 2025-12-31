import express from "express";
import { Product } from "../models/productModel.js";

const router = express.Router();

// PUBLIC: Customer can see all products
router.get("/products", async (req, res) => {
  try {
    // Only products not marked as deleted
    const products = await Product.find({ deleted: false });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
