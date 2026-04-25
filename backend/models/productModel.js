// backend/models/productModel.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    }
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  costPrice: { 
    type: Number, 
    default: 0 
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
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
  reviews: [reviewSchema],
  rating: {
    type: Number,
    required: true,
    default: 0,
  },
  numReviews: {
    type: Number,
    required: true,
    default: 0,
  },
  views: {
    type: Number,
    default: 0
  },
  totalSold: {
    type: Number,
    default: 0
  },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

// ============ INDEXES FOR RECOMMENDATIONS ============
productSchema.index({ views: -1, createdAt: -1 });
productSchema.index({ totalSold: -1 });
productSchema.index({ category: 1 });
productSchema.index({ category: 1, views: -1 });
productSchema.index({ category: 1, totalSold: -1 });
productSchema.index({ deleted: 1 });
productSchema.index({ shopId: 1, deleted: 1 });

export const Product = mongoose.model("Product", productSchema);
