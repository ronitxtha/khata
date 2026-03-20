import express from "express";
import { Product } from "../models/productModel.js";
import { User } from "../models/userModel.js";
import { Shop } from "../models/shopModel.js";
import { sendEmail } from "../utils/mailer.js";
import { Notification } from "../models/notificationModel.js";
import Order from "../models/Order.js";


const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { userId, items } = req.body;

    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ message: "Missing order data" });
    }

    let totalAmount = 0;
    const orderItems = [];

    // 1️⃣ Validate all products first
    for (const item of items) {
      const product = await Product.findById(item.productId).populate("shopId");

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `${product.name} does not have enough stock`
        });
      }

      totalAmount += product.price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image
      });
    }

    // 2️⃣ Get shopId from the first product
    const firstProduct = await Product.findById(items[0].productId);
    if (!firstProduct) {
        return res.status(404).json({ message: "Product not found during order creation" });
    }
    const shopId = firstProduct.shopId;

    // 3️⃣ Create order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      shopId,
      status: "Pending"
    });

    // 🚀 Speed Optimization: Send response to user immediately
    res.status(201).json(order);

    // ─────────────────────────────────────────────────────────────
    // BACKGROUND TASKS (Runs after response is sent)
    // ─────────────────────────────────────────────────────────────
    (async () => {
      try {
        // 4️⃣ Create notification for owner/staff
        await Notification.create({
          shopId,
          message: `New order #${order._id.toString().slice(-8).toUpperCase()} received!`,
          type: "new_order"
        });

        // 5️⃣ Emit real-time notification
        const io = req.app.get("io");
        if (io) {
          io.emit("newOrder", {
            shopId: shopId.toString(),
            orderId: order._id.toString(),
            message: `New order #${order._id.toString().slice(-8).toUpperCase()} received!`
          });
        }

        // 6️⃣ Reduce stock and check low stock alert
        for (const item of items) {
          const product = await Product.findById(item.productId);
          if (!product) continue;

          product.quantity -= item.quantity;
          await product.save();

          if (product.quantity < 5) {
            // Internal notification
            const existingNotification = await Notification.findOne({
              productId: product._id,
              type: "low_stock",
              isRead: false
            });

            if (!existingNotification) {
              await Notification.create({
                shopId: product.shopId,
                productId: product._id,
                message: `${product.name} is low in stock (${product.quantity} left)`,
                type: "low_stock"
              });
            }

            // Socket alert
            if (io) {
              io.emit("lowStockAlert", {
                message: `${product.name} is low in stock (${product.quantity} left)`,
                productId: product._id,
                quantity: product.quantity
              });
            }

            // Emails
            const shop = await Shop.findById(product.shopId);
            if (shop) {
              const recipients = [];
              if (shop.ownerId) {
                const owner = await User.findById(shop.ownerId);
                if (owner && owner.email) recipients.push(owner.email);
              }
              const staffMembers = await User.find({ shopId: product.shopId, role: "staff" });
              staffMembers.forEach(staff => {
                if (staff.email) recipients.push(staff.email);
              });

              for (const email of recipients) {
                try {
                  await sendEmail({
                    to: email,
                    subject: `Low Stock Alert: ${product.name}`,
                    text: `Your product "${product.name}" is running low on stock.\n\nCurrent Quantity: ${product.quantity}\n\nPlease restock soon.`
                  });
                } catch (e) { console.error("Email error:", e); }
              }
            }
          }
        }
      } catch (bgErr) {
        console.error("Background processing error:", bgErr);
      }
    })();
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
});



router.get("/my-orders/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// Get orders for a specific shop (Owner/Staff view)
router.get("/shop/:shopId", async (req, res) => {
  try {
    const orders = await Order.find({ shopId: req.params.shopId })
      .populate("user", "username email phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching shop orders" });
  }
});

// Update order status
router.put("/:id/status", async (req, res) => {
  try {
    const { status, role } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Workflow Logic
    if (role === "customer") {
      if (status === "Cancelled" && order.status === "Pending") {
        order.status = "Cancelled";
      } else {
        return res.status(403).json({ message: "Customers can only cancel pending orders" });
      }
    } else if (role === "owner" || role === "staff") {
      // Owner/Staff can update to any valid status
      const validStatuses = ["Pending", "Processing", "Delivered", "Cancelled"];
      if (validStatuses.includes(status)) {
        order.status = status;
      } else {
        return res.status(400).json({ message: "Invalid status" });
      }
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await order.save();
    res.json({ message: `Order status updated to ${status}`, order });
  } catch (err) {
    res.status(500).json({ message: "Error updating order status" });
  }
});



export default router;
