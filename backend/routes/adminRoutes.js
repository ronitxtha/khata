import express from "express";
import { User } from "../models/userModel.js";
import { Shop } from "../models/shopModel.js";
import { Product } from "../models/productModel.js";
import { Report } from "../models/reportModel.js";
import { isAuthenticated, isAdmin } from "../middleware/isAuthenticated.js";
import fs from "fs";
import path from "path";

const router = express.Router();

// ── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get("/stats", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [totalUsers, totalShops, totalProducts] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      Shop.countDocuments(),
      Product.countDocuments(),
    ]);

    const validReportsAgg = await Report.aggregate([
      {
        $group: {
          _id: "$targetId",
          totalCount: { $sum: 1 },
          reports: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          reports: {
            $filter: {
              input: "$reports",
              as: "report",
              cond: {
                $gte: ["$totalCount", 2]
              }
            }
          }
        }
      },
      { $unwind: "$reports" },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          pendingReports: {
            $sum: { $cond: [{ $eq: ["$reports.status", "pending"] }, 1, 0] }
          }
        }
      }
    ]);

    const totalReports = validReportsAgg[0]?.totalReports || 0;
    const pendingReports = validReportsAgg[0]?.pendingReports || 0;

    const recentUsers = await User.find({ role: { $ne: "admin" } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("username email role createdAt isActive");

    res.json({ success: true, stats: { totalUsers, totalShops, totalProducts, totalReports, pendingReports }, recentUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/users ─────────────────────────────────────────────────────
router.get("/users", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = { role: { $ne: "admin" } };
    if (role && role !== "all") filter.role = role;
    if (search) filter.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .select("-password -otp -otpExpiry -token");

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/admin/users/:id ──────────────────────────────────────────────
router.delete("/users/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role === "admin") return res.status(403).json({ success: false, message: "Cannot delete admin" });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/users/:id/toggle-active ─────────────────────────────────
router.patch("/users/:id/toggle-active", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isBeingDisabled = user.isActive === true; // if currently active, we're disabling
    user.isActive = !user.isActive;
    await user.save();

    // Emit socket event to notify the user and all admins
    const io = req.app.get("io");
    if (io) {
      // Notify the user being disabled/enabled
      io.emit("user-status-changed", {
        userId: user._id,
        isActive: user.isActive,
        username: user.username,
        message: user.isActive ? "enabled" : "disabled"
      });

      // Broadcast to update admin dashboard user list
      io.emit("admin-user-list-update", {
        userId: user._id,
        isActive: user.isActive,
        username: user.username,
        action: isBeingDisabled ? "disabled" : "enabled"
      });
    }

    res.json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/shops ─────────────────────────────────────────────────────
router.get("/shops", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (search) filter.name = { $regex: search, $options: "i" };

    const shops = await Shop.find(filter)
      .sort({ createdAt: -1 })
      .populate("ownerId", "username email isActive");

    res.json({ success: true, shops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/shops/:id/suspend ──────────────────────────────────────
router.patch("/shops/:id/suspend", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });
    shop.status = "suspended";
    shop.suspendedReason = reason || "Violated platform rules";
    await shop.save();

    const owner = await User.findById(shop.ownerId);
    if (owner && owner.email) {
      const { sendSuspensionMail } = await import("../emailverify/sendSuspensionMail.js");
      sendSuspensionMail(owner.email, shop.suspendedReason);
    }

    const { Notification } = await import("../models/notificationModel.js");
    await Notification.create({
      shopId: shop._id,
      message: `Your shop has been suspended by the admin. Reason: ${shop.suspendedReason}`,
      type: "suspension"
    });

    res.json({ success: true, message: "Shop suspended", shop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/shops/:id/reactivate ────────────────────────────────────
router.patch("/shops/:id/reactivate", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });
    shop.status = "active";
    shop.suspendedReason = "";
    await shop.save();
    res.json({ success: true, message: "Shop reactivated", shop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/admin/shops/:id ──────────────────────────────────────────────
router.delete("/shops/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });

    // Delete all products associated with this shop
    await Product.deleteMany({ shopId: req.params.id });

    await Shop.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Shop deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/products ──────────────────────────────────────────────────
router.get("/products", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: "shopId",
        select: "name ownerId",
        populate: {
          path: "ownerId",
          select: "username email"
        }
      });

    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/admin/products/:id ──────────────────────────────────────────
router.delete("/products/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // Delete image file if exists
    if (product.image) {
      const imgPath = path.join(path.resolve(), product.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/reports ───────────────────────────────────────────────────
router.get("/reports", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;

    const allReports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .populate("reportedBy", "username email")
      .populate("resolvedBy", "username");

    // Calculate report counts per target
    const targetCounts = await Report.aggregate([
      { $group: { _id: "$targetId", count: { $sum: 1 } } }
    ]);

    const targetCountMap = {};
    targetCounts.forEach(t => targetCountMap[t._id.toString()] = t.count);

    // Apply threshold: both product and shop reports only show if count >= 2
    const reports = allReports.filter(r => {
      return targetCountMap[r.targetId.toString()] >= 2;
    });

    // Attach target name for display
    const enriched = await Promise.all(reports.map(async r => {
      const obj = r.toObject();
      if (r.targetType === "shop") {
        const shop = await Shop.findById(r.targetId).select("name status");
        obj.targetName = shop?.name || "Deleted Shop";
        obj.targetStatus = shop?.status;
      } else {
        const product = await Product.findById(r.targetId).select("name");
        obj.targetName = product?.name || "Deleted Product";
      }
      return obj;
    }));

    res.json({ success: true, reports: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/reports (customer reports a shop/product) ────────────────
router.post("/reports", isAuthenticated, async (req, res) => {
  try {
    const { targetType, targetId, reason } = req.body;
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ success: false, message: "targetType, targetId and reason are required" });
    }
    const report = await Report.create({
      reportedBy: req.userId,
      targetType,
      targetId,
      reason,
    });
    res.status(201).json({ success: true, message: "Report submitted", report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/reports/:id/resolve ────────────────────────────────────
router.patch("/reports/:id/resolve", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { adminNote } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    report.status = "resolved";
    report.adminNote = adminNote || "";
    report.resolvedBy = req.userId;
    report.resolvedAt = new Date();
    await report.save();
    res.json({ success: true, message: "Report resolved", report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/reports/:id/dismiss ────────────────────────────────────
router.patch("/reports/:id/dismiss", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    report.status = "dismissed";
    report.resolvedBy = req.userId;
    report.resolvedAt = new Date();
    await report.save();
    res.json({ success: true, message: "Report dismissed", report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
