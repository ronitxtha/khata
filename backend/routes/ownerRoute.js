import express from "express";
import { User } from "../models/userModel.js";
import { Product } from "../models/productModel.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

const router = express.Router();

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ----------------------- Owner Info -----------------------
router.get("/me", isAuthenticated, async (req, res) => {
  try {
    const owner = await User.findById(req.userId);
    res.json({ owner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ----------------------- Staff List -----------------------
router.get("/staff", isAuthenticated, async (req, res) => {
  try {
    const staff = await User.find({ shopId: req.user.shopId, role: "staff" });
    res.json({ staff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ----------------------- Products List -----------------------
router.get("/products", isAuthenticated, async (req, res) => {
  try {
    const products = await Product.find({ shopId: req.user.shopId });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ----------------------- Add Staff -----------------------
router.post("/add-staff", isAuthenticated, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Staff already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await User.create({
      username: name,
      email,
      password: hashedPassword,
      role: "staff",
      shopId: req.user.shopId,
    });

    res.json({ message: "Staff added successfully", staff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ----------------------- Add Product with QR -----------------------
router.post(
  "/add-product",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, price, description } = req.body;
      const imagePath = req.file ? req.file.path : null;

      // Create product in DB
      const product = await Product.create({
        name,
        price,
        description,
        image: imagePath,
        shopId: req.user.shopId,
      });

      // Generate QR code
      const qrFileName = `qr-${product._id}.png`;
      const qrPath = `uploads/${qrFileName}`;
      await QRCode.toFile(qrPath, product._id.toString());

      // Save QR path in DB
      product.qrCode = qrPath;
      await product.save();

      res.json({
        message: "Product added successfully",
        product,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ----------------------- Download QR -----------------------
router.get("/download-qr/:productId", isAuthenticated, async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product || !product.qrCode)
      return res.status(404).json({ message: "QR code not found" });

    const filePath = path.join(process.cwd(), product.qrCode);

    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: "QR file does not exist" });

    // Force download
    res.download(filePath, `product-${productId}-qr.png`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to download QR" });
  }
});

export default router;
