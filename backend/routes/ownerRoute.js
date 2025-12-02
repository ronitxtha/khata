import express from "express";
import { User } from "../models/userModel.js";
import { Product } from "../models/productModel.js"; // make sure you have a Product model
import { isAuthenticated } from "../middleware/isAuthenticated.js";


import bcrypt from "bcryptjs";

const router = express.Router();

// Get owner info
router.get("/me", isAuthenticated, async (req, res) => {
  try {
    const owner = await User.findById(req.userId);
    res.json({ owner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get staff list
router.get("/staff", isAuthenticated, async (req, res) => {
  try {
    const staff = await User.find({ shopId: req.user.shopId, role: "staff" });
    res.json({ staff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get products list
router.get("/products", isAuthenticated, async (req, res) => {
  try {
    const products = await Product.find({ shopId: req.user.shopId });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add staff
router.post("/add-staff", isAuthenticated, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Staff already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await User.create({
      username: name,
      email,
      password: hashedPassword,
      role: "staff",
      shopId: req.user.shopId
    });

    res.json({ message: "Staff added successfully", staff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add product
router.post("/add-product", isAuthenticated, async (req, res) => {
  try {
    const { name, price } = req.body;

    const product = await Product.create({
      name,
      price,
      shopId: req.user.shopId
    });

    res.json({ message: "Product added successfully", product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
