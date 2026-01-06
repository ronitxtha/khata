// backend/models/productModel.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String }, // stored as file path
  qrCode: { type: String }, // stored as URL to QR image
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true
  },
  category: { 
    type: String, 
    enum: [
      "Electronics",
      "Fashion",
      "Beauty & Personal Care",
      "Home & Kitchen",
      "Books & Stationery",
      "Toys & Games",
      "Sports & Fitness",
      "Automotive",
      "Others"
    ],
    default: "Others",
  },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

export const Product = mongoose.model("Product", productSchema);
