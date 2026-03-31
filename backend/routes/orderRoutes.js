import express from "express";
import crypto from "crypto";
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
        costPrice: product.costPrice || 0,
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

// ─────────────────────────────────────────────────────────────────────────────
// eSewa Payment Routes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/orders/initiate-esewa
 * Creates a pending order and returns signed eSewa form params.
 */
router.post("/initiate-esewa", async (req, res) => {
  try {
    const { userId, items, deliveryAddress } = req.body;

    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ message: "Missing order data" });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: "Product not found" });
      if (product.quantity < item.quantity) {
        return res.status(400).json({ message: `${product.name} does not have enough stock` });
      }
      totalAmount += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        costPrice: product.costPrice || 0,
        quantity: item.quantity,
        image: product.image
      });
    }

    const firstProduct = await Product.findById(items[0].productId);
    const shopId = firstProduct.shopId;

    // Generate a unique transaction UUID: YYYYMMDD-HHMMSS-XXXXX
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const transactionUuid = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create order with eSewa payment method, paymentStatus Pending
    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      shopId,
      deliveryAddress,
      paymentMethod: "eSewa",
      paymentStatus: "Pending",
      transactionUuid,
      status: "Pending"
    });

    // Generate HMAC-SHA256 signature
    const secretKey = process.env.ESEWA_SECRET_KEY;
    const productCode = process.env.ESEWA_PRODUCT_CODE;
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(message)
      .digest("base64");

    const FRONTEND_BASE = "http://localhost:5173";

    res.status(201).json({
      orderId: order._id,
      amount: totalAmount,
      tax_amount: 0,
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: 0,
      product_delivery_charge: 0,
      success_url: `${FRONTEND_BASE}/esewa/success`,
      failure_url: `${FRONTEND_BASE}/esewa/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature
    });

  } catch (err) {
    console.error("eSewa initiation error:", err);
    res.status(500).json({ message: "Failed to initiate eSewa payment" });
  }
});

/**
 * POST /api/orders/esewa-success
 * Called by the frontend after eSewa redirects to success URL.
 * Decodes and verifies the base64 response from eSewa, then marks order as Paid.
 */
router.post("/esewa-success", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ message: "No response data from eSewa" });

    // Decode base64 response
    const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    const { transaction_uuid, signed_field_names, signature, status } = decoded;

    if (status !== "COMPLETE") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    // Verify signature
    const secretKey = process.env.ESEWA_SECRET_KEY;
    const fields = signed_field_names.split(",");
    const message = fields.map(f => `${f}=${decoded[f]}`).join(",");
    const expectedSig = crypto
      .createHmac("sha256", secretKey)
      .update(message)
      .digest("base64");

    if (expectedSig !== signature) {
      return res.status(400).json({ message: "Signature verification failed. Possible fraud!" });
    }

    // Find and update the order
    const order = await Order.findOne({ transactionUuid: transaction_uuid });
    if (!order) return res.status(404).json({ message: "Order not found for this transaction" });

    order.paymentStatus = "Paid";
    order.status = "Processing";
    await order.save();

    // Fire-and-forget: notification + stock reduction
    (async () => {
      try {
        await Notification.create({
          shopId: order.shopId,
          message: `eSewa payment received for order #${order._id.toString().slice(-8).toUpperCase()}!`,
          type: "new_order"
        });

        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (!product) continue;
          product.quantity -= item.quantity;
          await product.save();
        }
      } catch (e) {
        console.error("eSewa post-payment background error:", e);
      }
    })();

    res.json({ message: "Payment verified successfully", orderId: order._id });
  } catch (err) {
    console.error("eSewa success verification error:", err);
    res.status(500).json({ message: "Failed to verify eSewa payment" });
  }
});


export default router;
