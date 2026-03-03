import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { uploadCustomer } from "../middleware/uploadCustomer.js";
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
} from "../controllers/customerProfileController.js";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/addressController.js";
import {
  getMyOrders,
  cancelOrder,
} from "../controllers/customerOrderController.js";

const router = express.Router();

// ── Middleware: ensure customer role ──────────────────────────────────────────
const requireCustomer = (req, res, next) => {
  if (!req.user || req.user.role !== "customer") {
    return res.status(403).json({ success: false, message: "Access denied: customers only" });
  }
  next();
};

// ── Profile ───────────────────────────────────────────────────────────────────
router.get("/profile", isAuthenticated, requireCustomer, getProfile);
router.put("/profile", isAuthenticated, requireCustomer, updateProfile);
router.put("/change-password", isAuthenticated, requireCustomer, changePassword);
router.post(
  "/upload-profile-image",
  isAuthenticated,
  requireCustomer,
  uploadCustomer.single("profileImage"),
  uploadProfileImage
);

// ── Addresses ─────────────────────────────────────────────────────────────────
// NOTE: /set-default/:id MUST be defined before /:id to avoid Express
//       treating "set-default" as the :id param
router.get("/addresses", isAuthenticated, requireCustomer, getAddresses);
router.post("/address", isAuthenticated, requireCustomer, addAddress);
router.put("/address/set-default/:id", isAuthenticated, requireCustomer, setDefaultAddress);
router.put("/address/:id", isAuthenticated, requireCustomer, updateAddress);
router.delete("/address/:id", isAuthenticated, requireCustomer, deleteAddress);

// ── Orders ────────────────────────────────────────────────────────────────────
router.get("/orders", isAuthenticated, requireCustomer, getMyOrders);
router.put("/cancel-order/:id", isAuthenticated, requireCustomer, cancelOrder);

export default router;
