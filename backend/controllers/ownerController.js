import { User } from "../models/userModel.js";
import { Product } from "../models/productModel.js";
import Order from "../models/Order.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// ======================== PROFILE ENDPOINTS ========================

/**
 * GET /api/owner/profile
 * Fetch owner's profile information
 */
export const getOwnerProfile = async (req, res) => {
  try {
    const owner = await User.findById(req.userId).select("-password");

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    res.status(200).json({
      success: true,
      data: owner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PUT /api/owner/profile
 * Update owner's profile information
 */
export const updateOwnerProfile = async (req, res) => {
  try {
    const {
      username,
      phone,
      shopName,
      shopEmail,
      shopPhone,
      shopAddress,
      province,
      district,
      municipality,
      ward,
    } = req.body;

    const owner = await User.findById(req.userId);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    // Update fields if provided
    if (username) owner.username = username;
    if (phone) owner.phone = phone;
    if (shopName) owner.shopName = shopName;
    if (shopEmail) owner.shopEmail = shopEmail;
    if (shopPhone) owner.shopPhone = shopPhone;
    if (shopAddress) owner.shopAddress = shopAddress;
    if (province) owner.province = province;
    if (district) owner.district = district;
    if (municipality) owner.municipality = municipality;
    if (ward) owner.ward = ward;

    await owner.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: owner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PUT /api/owner/change-password
 * Change owner's password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const owner = await User.findById(req.userId);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      owner.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    owner.password = hashedPassword;
    await owner.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/owner/upload-profile-image
 * Upload owner's profile image
 */
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const owner = await User.findById(req.userId);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    // Delete old profile image if exists
    if (owner.profileImage && fs.existsSync(owner.profileImage)) {
      fs.unlinkSync(owner.profileImage);
    }

    // Create directory if it doesn't exist
    const uploadDir = "uploads/profile";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, req.file.filename);
    fs.renameSync(req.file.path, filePath);

    owner.profileImage = filePath;
    await owner.save();

    res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      data: {
        profileImage: owner.profileImage,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/owner/upload-shop-logo
 * Upload shop logo
 */
export const uploadShopLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const owner = await User.findById(req.userId);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    // Delete old shop logo if exists
    if (owner.shopLogo && fs.existsSync(owner.shopLogo)) {
      fs.unlinkSync(owner.shopLogo);
    }

    // Create directory if it doesn't exist
    const uploadDir = "uploads/shop";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, req.file.filename);
    fs.renameSync(req.file.path, filePath);

    owner.shopLogo = filePath;
    await owner.save();

    res.status(200).json({
      success: true,
      message: "Shop logo uploaded successfully",
      data: {
        shopLogo: owner.shopLogo,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/owner/statistics
 * Fetch owner's business statistics
 */
export const getOwnerStatistics = async (req, res) => {
  try {
    const shopId = req.user.shopId;

    // Total Products
    const totalProducts = await Product.countDocuments({
      shopId: shopId,
      deleted: false,
    });

    // Total Orders
    const totalOrders = await Order.countDocuments({
      shopId: shopId,
    });

    // Low Stock Products (quantity < 5)
    const lowStockProducts = await Product.countDocuments({
      shopId: shopId,
      quantity: { $lt: 5 },
      deleted: false,
    });

    // Get low stock products details
    const lowStockDetails = await Product.find(
      {
        shopId: shopId,
        quantity: { $lt: 5 },
        deleted: false,
      },
      { name: 1, quantity: 1, price: 1 }
    ).limit(10);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        lowStockProducts,
        lowStockDetails,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
