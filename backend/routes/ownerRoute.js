import express from "express";
import { User } from "../models/userModel.js";
import { Product } from "../models/productModel.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { deleteProduct } from "../controllers/userController.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import QRCode from "qrcode";
import path from "path";
import Attendance from "../models/Attendance.js";
import fs from "fs";
console.log("✅ Owner routes loaded");

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

// ----------------------- Delete Staff -----------------------
router.delete("/delete-staff/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the staff in the same shop
    const staff = await User.findOne({ _id: id, shopId: req.user.shopId, role: "staff" });
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Option 1: Hard delete
    await User.findByIdAndDelete(id);

    // Option 2: Soft delete (optional)
    // staff.deleted = true;
    // await staff.save();

    res.json({ message: "Staff deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


router.delete("/delete-product/:id", isAuthenticated, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, shopId: req.user.shopId },
      { deleted: true },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully", product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ----------------------- Restore Product & Increase Quantity -----------------------
// ----------------------- Restore Product & Increase Quantity -----------------------
router.put("/restore-product/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const product = await Product.findOne({
      _id: id,
      shopId: req.user.shopId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const addQty = Number(quantity) || 1;

    // Restore if deleted - SET quantity instead of adding
    if (product.deleted) {
      product.deleted = false;
      product.quantity = addQty; // SET the quantity
    } else {
      // Increase quantity for existing products
      product.quantity = Number(product.quantity || 0) + addQty;
    }

    await product.save();

    res.status(200).json({
      message: "Stock updated successfully",
      product,
    });

  } catch (err) {
    console.error("Restore product error:", err);
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
// ----------------------- Products List -----------------------
router.get("/products", isAuthenticated, async (req, res) => {
  try {
    // Only fetch products that are not marked as deleted
    const products = await Product.find({ shopId: req.user.shopId, deleted: false });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ----------------------- Add Staff -----------------------
router.post("/add-staff", isAuthenticated, async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Staff already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await User.create({
  username: name,
  email,
  password: hashedPassword,
  phone,
  address,
  role: "staff",
  shopId: req.user.shopId
});

    res.json({ message: "Staff added successfully", staff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ----------------------- Add Product with QR -----------------------

router.post("/add-product", isAuthenticated, upload.single("image"), async (req, res) => {
  try {
    const { name, price, description, category, quantity } = req.body; // include category
    const imagePath = req.file ? req.file.path : null;

    // Optional: Validate category against allowed list
    const MAIN_CATEGORIES = [
      "Electronics",
      "Fashion",
      "Beauty & Personal Care",
      "Home & Kitchen",
      "Books & Stationery",
      "Toys & Games",
      "Sports & Fitness",
      "Automotive",
      "Others",
    ];

    const finalCategory = MAIN_CATEGORIES.includes(category) ? category : "Others";

    const product = await Product.create({
      name,
      price,
      description,
      image: imagePath,
      shopId: req.user.shopId,
      category: finalCategory,
      quantity: Number(quantity) // save category
    });

    // Generate QR code
    const qrFileName = `qr-${product._id}.png`;
    const qrPath = `uploads/${qrFileName}`;
    await QRCode.toFile(qrPath, product._id.toString());

    product.qrCode = qrPath;
    await product.save();

    res.json({ message: "Product added successfully", product });
  } catch (err) {
    console.error("Add product error:", err);
    res.status(500).json({ message: err.message });
  }
});
router.put(
  "/update-product/:id",
  upload.single("image"),   // 🔥 MUST come FIRST
  isAuthenticated,          // then auth
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, quantity, category, description } = req.body;

      const MAIN_CATEGORIES = [
        "Electronics",
        "Fashion",
        "Beauty & Personal Care",
        "Home & Kitchen",
        "Books & Stationery",
        "Toys & Games",
        "Sports & Fitness",
        "Automotive",
        "Others",
      ];

      const finalCategory = MAIN_CATEGORIES.includes(category)
        ? category
        : "Others";

      const product = await Product.findOne({
        _id: id,
        shopId: req.user.shopId,
        deleted: false,
      });

      if (!product)
        return res.status(404).json({ message: "Product not found" });

      product.name = name;
      product.price = price;
      product.quantity = Number(quantity);
      product.category = finalCategory;
      product.description = description;

      // ✅ Update image only if new one uploaded
      if (req.file) {
        product.image = req.file.path;
      }

      await product.save();

      res.status(200).json({
        message: "Product updated successfully",
        product,
      });
    } catch (err) {
      console.error("Update product error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);



// ----------------------- Get Single Product by ID -----------------------
router.get("/product/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Include deleted products too
    const product = await Product.findOne({
      _id: id,
      shopId: req.user.shopId,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});




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

// ----------------------- Today's Attendance -----------------------
router.get("/today-attendance", isAuthenticated, async (req, res) => {
  try {
    const shopId = req.user.shopId;

    console.log("Fetching attendance for shopId:", shopId);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
  shopId,
  checkInTime: { $gte: start, $lte: end },
}).populate("staffId", "username email"); // works now because ref is "User"

    console.log("Attendance raw:", attendance);

    // Check if staffId references exist
    const populatedAttendance = await Attendance.populate(attendance, {
      path: "staffId",
      select: "username email",
    });

    console.log("Attendance populated:", populatedAttendance);

    res.json({ attendance: populatedAttendance });
  } catch (err) {
    console.error("Attendance fetch error:", err);
    res.status(500).json({ message: "Failed to fetch attendance", error: err.message });
  }
});




export default router;
