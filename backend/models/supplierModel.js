import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    supplierName: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    productsSupplied: { type: String, trim: true },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    totalPurchases: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalDue: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-calculate totalDue before save
supplierSchema.pre("save", function () {
  this.totalDue = this.totalPurchases - this.totalPaid;
});

export const Supplier = mongoose.model("Supplier", supplierSchema);
