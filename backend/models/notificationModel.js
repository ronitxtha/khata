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
    required: false
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["low_stock", "new_order"],
    default: "new_order"
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export const Notification = mongoose.model("Notification", notificationSchema);
