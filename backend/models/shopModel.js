import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },

    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Optional fields you may use later
    description: { type: String, default: "" },
    address: { type: String, default: "" },
    logoUrl: { type: String, default: "" },

}, { timestamps: true });

export const Shop = mongoose.model("Shop", shopSchema);
