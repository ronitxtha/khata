import express from "express";
import { Shop } from "../models/shopModel.js";
import { Product } from "../models/productModel.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const shops = await Shop.find().populate("ownerId", "username");
    console.log("Shops fetched:", shops); // log shops

    const shopsWithProducts = await Promise.all(
      shops.map(async (shop) => {
        let products = [];
        try {
          products = await Product.find({ shopId: shop._id, deleted: false });
        } catch (err) {
          console.error(`Error fetching products for shop ${shop._id}:`, err);
        }

        return {
          _id: shop._id,
          name: shop.name,
          owner: shop.ownerId?.username || "Unknown",
          products,
        };
      })
    );

    console.log("Shops with products:", shopsWithProducts);
    res.json({ shops: shopsWithProducts });
  } catch (error) {
    console.error("Marketplace fetch error:", error);
    res.status(500).json({ message: "Server error while fetching marketplace" });
  }
});

export default router;
