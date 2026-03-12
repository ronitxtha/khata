import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    supplierName: { type: String },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    costPrice: { type: Number, required: true, min: 0 },
    totalCost: { type: Number },
    purchaseDate: { type: Date, default: Date.now },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
  },
  { timestamps: true }
);

purchaseSchema.pre("save", function () {
  this.totalCost = this.quantity * this.costPrice;
});

export const Purchase = mongoose.model("Purchase", purchaseSchema);
