import mongoose from "mongoose";

const userInteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  interactionType: {
    type: String,
    enum: ["product_click", "search", "category_view", "product_view"],
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    default: null
  },
  category: {
    type: String,
    default: null
  },
  searchQuery: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: false });

userInteractionSchema.index({ userId: 1, interactionType: 1, timestamp: -1 });
userInteractionSchema.index({ userId: 1, category: 1, timestamp: -1 });
userInteractionSchema.index({ userId: 1, productId: 1 });

export const UserInteraction = mongoose.model("UserInteraction", userInteractionSchema);
