import { verifyMail } from "../emailverify/verifyMail.js";
import { Session } from "../models/sessionModel.js";
import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtpMail } from "../emailverify/sendOtpMail.js";
import { Shop } from "../models/shopModel.js"; 
import { Product } from "../models/productModel.js";
import fs from "fs";

export const registerUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (!["customer", "owner"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role. Must be 'customer' or 'owner'."
            });
        }

        const existinguser = await User.findOne({ email });
        if (existinguser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role
        });
        if (role === "owner") {
    const newShop = await Shop.create({
        name: `${username}'s Shop`,
        ownerId: newUser._id
    });

    // attach shopId to owner
    newUser.shopId = newShop._id;
    await newUser.save();
}


        // Generate JWT token
        const token = jwt.sign({ id: newUser._id }, process.env.SECRET_KEY, { expiresIn: "10m" });

        // Send only the token in email
        await verifyMail(token, email);

        return res.status(201).json({
            success: true,
            message: "User registered successfully. Please check your email to verify.",
            data: newUser
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// Verification route
export const verification = async (req, res) => {
    try {
        const { token } = req.params; // get token from URL
        if (!token) return res.status(400).json({ success: false, message: "Token missing" });

        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.isVerified = true;
        user.token = null;
        await user.save();

        res.json({ success: true, message: "Email verified successfully" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};


export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized Access"
            });
        }
        const passwordCheck = await bcrypt.compare(password, user.password);
        if (!passwordCheck) {
            return res.status(402).json({
                success: false,
                message: "Incorrect Password"
            })
        }
       // Only enforce verification for non-staff users
if (user.role !== "staff" && !user.isVerified) {
    return res.status(403).json({
        success: false,
        message: "Please verify your email to login"
    });
}

        const existingSession = await Session.findOne({ userId: user._id });
        if (existingSession) {
            await Session.deleteOne({ userId: user._id })
        };

        await Session.create({ userId: user._id });

        //Generate Tokens
        const accessToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "10d" })
        const refreshToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "30d" })
        user.isLoggedIn = true;
        await user.save();

        return res.status(200).json({
            success: true,
            message: `Welcome Back! ${user.username}`,
            accessToken,
            refreshToken,
            user
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const logoutUser = async (req, res) => {
    // Implementation for user logout
    try {
        const userId = req.userId;
        await Session.deleteMany({ userId });
        await User.findByIdAndUpdate(userId, { isLoggedIn: false });
        return res.status(200).json({
            success: true,
            message: "User logged out successfully"
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const forgotPassword = async (req, res) => {
    // Implementation for forgot password
    try{
        const {email} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 15 minutes from now
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();
        await sendOtpMail(email, otp); /// 
        return res.status(200).json({
            success: true,
            message: "OTP sent to email"
        });
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const verifyOTP = async (req, res) => {
    // Implementation for verifying OTP
    const {otp} = req.body;
    const {email} = req.params;

    if(!otp){
        return res.status(400).json({
            success:false,
            message:"OTP is required"
        })
    }

    try{
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }
        if(!user.otp || !user.otpExpiry){
            return res.status(400).json({
                success:false,
                message:"No OTP found. Please request a new one."
            })
        }
        if(user.otpExpiry < new Date()){
            return res.status(400).json({
                success:false,
                message:"OTP has expired. Please request a new one."
            })
        }
        if(otp !== user.otp){
            return res.status(400).json({
                success:false,
                message:"Invalid OTP"
            })
        }

        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        return res.status(200).json({
            success:true,
            message:"OTP verified successfully"
        });

    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.shopId.toString() !== req.user.shopId.toString()) {
      return res.status(403).json({ message: "You are not allowed to delete this product" });
    }

    // Soft delete
    product.deleted = true;
    await product.save();

    res.status(200).json({ message: "Product deleted successfully", product });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error while deleting product" });
  }
};




export const changePassword = async (req, res) => {
    // Implementation for changing password
    const {newPassword, confirmPassword} = req.body;
    const {email} = req.params;

    if(!newPassword || !confirmPassword){
        return res.status(400).json({
            success:false,
            message:"All fields are required"
        })
    }
    if(newPassword !== confirmPassword){
        return res.status(400).json({
            success:false,
            message:"Passwords do not match"
        })
    }

    try{
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();          

        return res.status(200).json({
            success:true,
            message:"Password changed successfully"
        });

    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

}
