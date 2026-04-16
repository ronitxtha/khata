import express from "express";
import { Product } from "../models/productModel.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { User } from "../models/userModel.js";

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

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
router.post("/products/:id/reviews", isAuthenticated, async (req, res) => {
  const { rating, comment } = req.body;
  console.log("Review request received for product:", req.params.id);

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.userId.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({ message: "Product already reviewed" });
      }

      const user = await User.findById(req.userId);

      const review = {
        name: user.username,
        rating: Number(rating),
        comment,
        user: req.userId,
      };

      product.reviews.push(review);

      product.numReviews = product.reviews.length;

      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: "Review added" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (err) {
    console.error("Review error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// @desc    Edit existing review
// @route   PUT /api/products/:id/reviews
// @access  Private
router.put("/products/:id/reviews", isAuthenticated, async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const existingReview = product.reviews.find(
      (r) => r.user.toString() === req.userId.toString()
    );

    if (!existingReview) {
      return res.status(404).json({ message: "Review not found. Submit a review first." });
    }

    existingReview.rating = Number(rating);
    existingReview.comment = comment;

    // Recalculate average
    product.rating =
      product.reviews.reduce((acc, r) => r.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.json({ message: "Review updated successfully" });
  } catch (err) {
    console.error("Edit review error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;

