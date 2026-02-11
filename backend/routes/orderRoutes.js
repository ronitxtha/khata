import express from "express";
import { Product } from "../models/productModel.js";
import { User } from "../models/userModel.js";
import { Shop } from "../models/shopModel.js";
import { sendEmail } from "../utils/mailer.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { productId, quantity, userId } = req.body;

    // 1️⃣ Find the product
    const product = await Product.findById(productId).populate("shopId");
    if (!product) return res.status(404).json({ message: "Product not found" });

    // 2️⃣ Reduce quantity
    product.quantity -= quantity;
    await product.save();

    // 3️⃣ Fetch owner email from shop
    const shopOwner = await User.findById(product.shopId.ownerId);
    const ownerEmail = shopOwner?.email;

    // 4️⃣ Fetch staff emails if needed (optional)
    const staffMembers = await User.find({
      shopId: product.shopId._id,
      role: "staff",
    });

    const staffEmails = staffMembers.map(staff => staff.email);

    // 5️⃣ Send email if remaining quantity is less than 5
    if (product.quantity < 5) {
      const subject = `Stock Alert: ${product.name} is low`;
      const text = `The product "${product.name}" now has only ${product.quantity} items left in stock.`;

      // Send to owner
      if (ownerEmail) await sendEmail({ to: ownerEmail, subject, text });

      // Send to staff (optional)
      for (const email of staffEmails) {
        await sendEmail({ to: email, subject, text });
      }
    }

    return res.json({ message: "Order placed successfully" });
  } catch (err) {
    console.error("ORDER ERROR:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;
