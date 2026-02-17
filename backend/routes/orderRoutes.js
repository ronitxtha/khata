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

    // 2️⃣ Create order FIRST
    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      status: "Processing"
    });

    // 3️⃣ Now reduce stock
    for (const item of items) {
      const product = await Product.findById(item.productId).populate("shopId");

      product.quantity -= item.quantity;
      await product.save();

      // Low stock alert logic (reuse yours)
      if (product.quantity < 5) {
        const existingNotification = await Notification.findOne({
          productId: product._id,
          type: "low_stock",
          isRead: false
        });

        if (!existingNotification) {
          await Notification.create({
            shopId: product.shopId._id,
            productId: product._id,
            message: `${product.name} is low in stock (${product.quantity} left)`
          });
        }

        const io = req.app.get("io");
        io.emit("lowStockAlert", {
          message: `${product.name} is low in stock (${product.quantity} left)`,
          productId: product._id,
          quantity: product.quantity
        });
      }
    }

    return res.json({
      message: "Order placed successfully",
      orderId: order._id
    });

  } catch (err) {
    console.error("ORDER ERROR:", err);
    res.status(500).json({ message: "Something went wrong" });
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



export default router;
