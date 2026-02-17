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
        quantity: Number,
        image: String
      }
    ],

    totalAmount: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      default: "Processing"
    }

  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
