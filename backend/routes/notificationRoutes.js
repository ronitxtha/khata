import express from "express";
import { Notification } from "../models/notificationModel.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Notification routes are live!" });
});

// Mark all unread notifications for a shop as read
router.put("/mark-all-read/:shopId", isAuthenticated, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { shopId: req.params.shopId },
      { $addToSet: { readBy: req.userId } }
    );
    res.status(200).json({ 
      message: "Notifications cleared", 
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    console.error("MARK AS READ ERROR:", err);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
});

// Clear all notifications for a shop (hard delete)
router.delete("/clear-all/:shopId", isAuthenticated, async (req, res) => {
  try {
    await Notification.deleteMany({ shopId: req.params.shopId });
    res.status(200).json({ message: "All notifications cleared" });
  } catch (err) {
    console.error("CLEAR ALL ERROR:", err);
    res.status(500).json({ message: "Failed to clear notifications" });
  }
});

// Fetch all notifications for a shop (with read status per user)
router.get("/:shopId", isAuthenticated, async (req, res) => {
  try {
    const notifications = await Notification.find({
      shopId: req.params.shopId,
    }).sort({ createdAt: -1 });

    // Attach per-user read status
    const withReadStatus = notifications.map(n => ({
      ...n.toObject(),
      read: Array.isArray(n.readBy) && n.readBy.map(String).includes(String(req.userId)),
    }));

    res.status(200).json(withReadStatus);
  } catch (err) {
    console.error("NOTIFICATION FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

export default router;
