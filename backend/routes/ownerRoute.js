import express from "express";
import { User } from "../models/userModel.js";
import { Product } from "../models/productModel.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { deleteProduct } from "../controllers/userController.js";
import {
  getOwnerProfile,
  updateOwnerProfile,
  changePassword,
  uploadProfileImage,
  uploadShopLogo,
  getOwnerStatistics,
} from "../controllers/ownerController.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import QRCode from "qrcode";
import path from "path";
import Attendance from "../models/Attendance.js";
import fs from "fs";
console.log("✅ Owner routes loaded");

const router = express.Router();

// Multer setup for various uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/profile";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const shopStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/shop";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });
const uploadProfile = multer({ storage: profileStorage });
const uploadShop = multer({ storage: shopStorage });

// ======================== PROFILE ROUTES ========================
router.get("/profile", isAuthenticated, getOwnerProfile);
router.put("/profile", isAuthenticated, updateOwnerProfile);
router.put("/change-password", isAuthenticated, changePassword);
router.post("/upload-profile-image", isAuthenticated, uploadProfile.single("profileImage"), uploadProfileImage);
router.post("/upload-shop-logo", isAuthenticated, uploadShop.single("shopLogo"), uploadShopLogo);
router.get("/statistics", isAuthenticated, getOwnerStatistics);

// ----------------------- Owner Info -----------------------
router.get("/me", isAuthenticated, async (req, res) => {
  try {
    const owner = await User.findById(req.userId);
    let ownerId = req.userId;

    if (owner && owner.role === "staff") {
      const shop = await import("../models/shopModel.js").then(m => m.Shop.findById(owner.shopId));
      if (shop) ownerId = shop.ownerId;
    }

    res.json({ owner, ownerId });
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

// ----------------------- Update Staff -----------------------
router.put("/update-staff/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phone, address } = req.body;

    const staff = await User.findOne({ _id: id, shopId: req.user.shopId, role: "staff" });
    if (!staff) return res.status(404).json({ message: "Staff member not found" });

    if (username) staff.username = username;
    if (email) staff.email = email;
    if (phone) staff.phone = phone;
    if (address) staff.address = address;

    await staff.save();
    res.json({ message: "Staff updated successfully", staff });
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
    const { name, price, costPrice, description, category, quantity } = req.body; // include category
    const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : null;

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
      costPrice: Number(costPrice) || 0,
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
      const { name, price, costPrice, quantity, category, description } = req.body;

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
      product.costPrice = Number(costPrice) || 0;
      product.quantity = Number(quantity);
      product.category = finalCategory;
      product.description = description;

      // ✅ Update image only if new one uploaded
      if (req.file) {
        product.image = req.file.path.replace(/\\/g, "/");
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
// ----------------------- 3 Months Attendance History -----------------------
router.get("/attendance-history", isAuthenticated, async (req, res) => {
  try {
    const shopId = req.user.shopId;
    
    // Get date for 3 months ago
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    threeMonthsAgo.setHours(0, 0, 0, 0);

    const todayDate = new Date();
    todayDate.setHours(23, 59, 59, 999);
    
    // Fetch all active staff in the shop
    const staffList = await User.find({ shopId, role: "staff" }).select("username email createdAt");

    // Fetch actual attendance records for the last 3 months
    const actualAttendance = await Attendance.find({
      shopId,
      date: { $gte: threeMonthsAgo, $lte: todayDate }
    })
    .populate("staffId", "username email createdAt")
    .sort({ date: -1 });

    // We need to build a complete attendance timeline per staff member
    let combinedAttendance = [];

    staffList.forEach(staff => {
      // Determine the start date for this staff's timeline (either 3 months ago or their join date)
      let staffStartDate = new Date(staff.createdAt);
      staffStartDate.setHours(0, 0, 0, 0);

      const timelineStart = staffStartDate > threeMonthsAgo ? staffStartDate : threeMonthsAgo;
      
      // Get all real records for this specific staff
      const staffRecords = actualAttendance.filter(
        record => record.staffId && record.staffId._id.toString() === staff._id.toString()
      );

      // Create a map of YYYY-MM-DD to easily check for existing records
      const recordMap = {};
      staffRecords.forEach(record => {
        const dateStr = new Date(record.date).toISOString().split('T')[0];
        // In case there are multiple records per day for some reason, just keep the first one
        if (!recordMap[dateStr]) {
          recordMap[dateStr] = record;
        }
      });

      // Generate the daily timeline
      let currentDateIterator = new Date(timelineStart);
      while (currentDateIterator <= todayDate) {
        const dateStr = currentDateIterator.toISOString().split('T')[0];
        
        if (recordMap[dateStr]) {
          // If a real record exists for this day, use it
          combinedAttendance.push(recordMap[dateStr]);
        } else {
          // Otherwise, create an 'absent' dummy record
          combinedAttendance.push({
            _id: `absent_${staff._id}_${dateStr}`, // Fake ID for React keys
            staffId: staff,
            shopId: shopId,
            date: new Date(currentDateIterator),
            status: "absent",
            checkInTime: null,
            lastLogoutClick: null,
          });
        }

        // Increment day by 1
        currentDateIterator.setDate(currentDateIterator.getDate() + 1);
      }
    });

    // Sort the final combined array just like before: newest first
    combinedAttendance.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, attendance: combinedAttendance });
  } catch (err) {
    console.error("Attendance history fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch attendance history", error: err.message });
  }
});
// ----------------------- Sales Report (Dashboard Graph) -----------------------
router.get("/sales-report", isAuthenticated, async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { timeframe = "week" } = req.query; // 'today', 'week', 'month'
    
    const now = new Date();
    let startDate, endDate;
    let dataPoints = [];

    if (timeframe === "today") {
      // Data Points: 24 hours of today
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      for (let i = 0; i < 24; i++) {
        // e.g., "12 AM", "1 AM", ...
        const label = i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`;
        dataPoints.push({ name: label, hour: i, sales: 0, items: 0, profit: 0 });
      }
    } else if (timeframe === "month") {
      // Data Points: Last 30 days
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      
      for (let i = 0; i < 30; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); // "01 Mar"
        dataPoints.push({ name: label, timestamp: d.getTime(), sales: 0, items: 0, profit: 0 });
      }
    } else {
      // Default to "week"
      // Data Points: Last 7 days
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const label = d.toLocaleDateString('en-GB', { weekday: 'short' }); // "Mon", "Tue"
        dataPoints.push({ name: label, timestamp: d.getTime(), sales: 0, items: 0, profit: 0 });
      }
    }

    // Fetch orders within the date range
    const recentOrders = await import("../models/Order.js").then(m => m.default.find({
      shopId,
      createdAt: { $gte: startDate, $lt: endDate },
      status: { $ne: "Cancelled" }
    }));

    // Aggregate data into the pre-filled dataPoints buckets
    recentOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const totalAmount = order.totalAmount || 0;
      let totalProfit = 0;
      let itemsCount = 0;

      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          itemsCount += (item.quantity || 1);
          // Profit = (SP - CP) * Qty. If CP is missing, assume 0 for legacy orders.
          const cp = item.costPrice || 0;
          totalProfit += ((item.price || 0) - cp) * (item.quantity || 1);
        });
      }

      if (timeframe === "today") {
        const hour = orderDate.getHours();
        const point = dataPoints.find(p => p.hour === hour);
        if (point) {
          point.sales += totalAmount;
          point.items += itemsCount;
          point.profit += totalProfit;
        }
      } else {
        const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate()).getTime();
        const point = dataPoints.find(p => p.timestamp === orderDay);
        if (point) {
          point.sales += totalAmount;
          point.items += itemsCount;
          point.profit += totalProfit;
        }
      }
    });

    // Remove sorting metadata and include profit
    const cleanData = dataPoints.map(({ name, sales, items, profit }) => ({ name, sales, items, profit }));

    res.json({
      success: true,
      data: cleanData
    });

  } catch (err) {
    console.error("Sales report error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch sales report" });
  }
});

// ----------------------- Yearly Orders History -----------------------
router.get("/yearly-orders", isAuthenticated, async (req, res) => {
  try {
    const shopId = req.user.shopId;
    
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const Order = await import("../models/Order.js").then(m => m.default);
    
    const orders = await Order.find({
      shopId,
      createdAt: { $gte: startOfYear, $lte: endOfYear }
    })
    .populate("user", "username email")
    .sort({ createdAt: -1 }); // Newest first

    res.json({ success: true, orders });
  } catch (err) {
    console.error("Yearly orders error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch yearly orders" });
  }
});

// ----------------------- Product Reviews (Owner only) -----------------------
router.get("/product-reviews", isAuthenticated, async (req, res) => {
  try {
    const shopId = req.shopId;
    const products = await Product.find({ shopId, deleted: false })
      .populate("reviews.user", "username email")
      .select("name image rating numReviews reviews category price")
      .sort({ rating: -1 });

    res.json({ success: true, products });
  } catch (err) {
    console.error("Product reviews fetch error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

