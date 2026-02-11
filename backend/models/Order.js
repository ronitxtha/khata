import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantity: Number,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Order", OrderSchema);
