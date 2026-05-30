import Order from "../models/Order.js";
import { Product } from "../models/productModel.js";

// ─────────────────────────────────────────────
// GET /api/customer/orders
// ─────────────────────────────────────────────
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    console.error("getMyOrders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PUT /api/customer/cancel-order/:id
// Body: { cancelReason } (optional)
// ─────────────────────────────────────────────
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled",
      });
    }

    const wasStockReduced = order.paymentMethod === "Cash on Delivery" || order.paymentStatus === "Paid";

    order.status = "Cancelled";
    order.cancelReason = req.body.cancelReason?.trim() || "Cancelled by customer";
    await order.save();

    if (wasStockReduced) {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.quantity += item.quantity;
          await product.save();
        }
      }
    }

    res.json({ success: true, message: "Order cancelled successfully", order });
  } catch (err) {
    console.error("cancelOrder error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
