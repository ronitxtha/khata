import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    phone: { type: String, default: "" },
    address: { type: String, default: "" },

    // Profile image for user
    profileImage: { type: String, default: "" },

    // Shop information (for owners)
    shopName: { type: String, default: "" },
    shopEmail: { type: String, default: "" },
    shopPhone: { type: String, default: "" },
    shopAddress: { type: String, default: "" },
    shopLogo: { type: String, default: "" },

    // Shop location (Nepal)
    province: { type: String, default: "" },
    district: { type: String, default: "" },
    municipality: { type: String, default: "" },
    ward: { type: String, default: "" },

    role: { 
        type: String, 
        enum: ["customer", "owner", "staff"],
        default: "customer"
    },

    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
        default: null
    },

    isVerified: { type: Boolean, default: false },
    isLoggedIn: { type: Boolean, default: false },
    token: { type: String, default: null },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
