import express from "express";
import { Notification } from "../models/notificationModel.js";

const router = express.Router();

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Notification routes are live!" });
});

// Mark all unread notifications for a shop as read
router.put("/mark-all-read/:shopId", async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { shopId: req.params.shopId, isRead: false },
      { $set: { isRead: true } }
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

// Fetch unread notifications for a shop
router.get("/:shopId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      shopId: req.params.shopId,
      isRead: false
    }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (err) {
    console.error("NOTIFICATION FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

export default router;
