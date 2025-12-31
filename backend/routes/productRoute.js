import express from "express";
import { Product } from "../models/productModel.js";

const router = express.Router();

// PUBLIC: Customer can see all products that are NOT deleted
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({ deleted: { $ne: true } }); // Exclude deleted products
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
