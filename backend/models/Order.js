import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        name: String,
        price: Number,
        costPrice: Number,
        quantity: Number,
        image: String
      }
    ],

    totalAmount: {
      type: Number,
      required: true
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true
    },

    status: {
      type: String,
      default: "Pending"
    },

    paymentMethod: {
      type: String,
      default: "Cash on Delivery"
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending"
    },

    transactionUuid: {
      type: String,
      default: ""
    },

    cancelReason: {
      type: String,
      default: ""
    }

  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
