import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  addSupplier,
  getSuppliers,
  updateSupplier,
  deleteSupplier,
  recordPurchase,
  getPurchases,
  recordPayment,
  getPayments,
  getSupplierStats,
} from "../controllers/supplierController.js";

// Multer setup for purchase images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/products";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

const router = express.Router();

// All routes are protected
router.use(isAuthenticated);

// Supplier CRUD
router.post("/add", addSupplier);
router.get("/", getSuppliers);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

// Summary stats
router.get("/stats", getSupplierStats);

// Purchase routes
router.post("/purchase", upload.single("image"), recordPurchase);
router.get("/purchases", getPurchases);

// Payment routes
router.post("/payment", recordPayment);
router.get("/payments", getPayments);

export default router;
