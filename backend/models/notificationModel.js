import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["low_stock"],
    default: "low_stock"
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export const Notification = mongoose.model("Notification", notificationSchema);
