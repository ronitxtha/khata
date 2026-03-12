import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
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
router.post("/purchase", recordPurchase);
router.get("/purchases", getPurchases);

// Payment routes
router.post("/payment", recordPayment);
router.get("/payments", getPayments);

export default router;
