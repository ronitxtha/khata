import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  targetType: {
    type: String,
    enum: ["shop", "product"],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "resolved", "dismissed"],
    default: "pending",
  },
  adminNote: {
    type: String,
    default: "",
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

export const Report = mongoose.model("Report", reportSchema);
