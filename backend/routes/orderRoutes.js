import express from "express";
import { Product } from "../models/productModel.js";
import { User } from "../models/userModel.js";
import { Shop } from "../models/shopModel.js";
import { sendEmail } from "../utils/mailer.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { productId, quantity, userId } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 1️⃣ Find product
    const product = await Product.findById(productId).populate("shopId");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 2️⃣ Check stock before reducing
    if (product.quantity < quantity) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    // 3️⃣ Reduce stock
    product.quantity -= quantity;
    await product.save();

    // 4️⃣ Get owner + staff
    const shopOwner = await User.findById(product.shopId.ownerId);
    const ownerEmail = shopOwner?.email;

    const staffMembers = await User.find({
      shopId: product.shopId._id,
      role: "staff",
    });

    const staffEmails = staffMembers.map(staff => staff.email);

    // 5️⃣ Low stock alert
    if (product.quantity < 5) {
      const subject = `Stock Alert: ${product.name} is low`;
      const text = `The product "${product.name}" now has only ${product.quantity} items left in stock.`;

      if (ownerEmail) {
        await sendEmail({ to: ownerEmail, subject, text });
      }

      for (const email of staffEmails) {
        await sendEmail({ to: email, subject, text });
      }

      // 🔔 SOCKET NOTIFICATION
      const io = req.app.get("io");

      io.emit("lowStockAlert", {
        message: `${product.name} is low in stock (${product.quantity} left)`,
        productId: product._id,
        quantity: product.quantity
      });
    }

    return res.json({ 
      message: "Order placed successfully",
      remainingStock: product.quantity
    });

  } catch (err) {
    console.error("ORDER ERROR:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});


export default router;
