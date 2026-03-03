import { Address } from "../models/addressModel.js";

// ─────────────────────────────────────────────
// GET /api/customer/addresses
// ─────────────────────────────────────────────
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ customerId: req.userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    res.json({ success: true, addresses });
  } catch (err) {
    console.error("getAddresses error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// POST /api/customer/address
// Body: { province, district, municipality, ward, streetAddress }
// ─────────────────────────────────────────────
export const addAddress = async (req, res) => {
  try {
    const { province, district, municipality, ward, streetAddress } = req.body;

    if (!province || !district || !municipality || !ward) {
      return res
        .status(400)
        .json({ success: false, message: "Province, district, municipality, and ward are required" });
    }

    // Count existing addresses to decide default
    const existingCount = await Address.countDocuments({ customerId: req.userId });

    const address = await Address.create({
      customerId: req.userId,
      province,
      district,
      municipality,
      ward,
      streetAddress: streetAddress?.trim() || "",
      isDefault: existingCount === 0, // first address becomes default automatically
    });

    res.status(201).json({ success: true, message: "Address added successfully", address });
  } catch (err) {
    console.error("addAddress error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PUT /api/customer/address/:id
// ─────────────────────────────────────────────
export const updateAddress = async (req, res) => {
  try {
    const { province, district, municipality, ward, streetAddress } = req.body;

    if (!province || !district || !municipality || !ward) {
      return res
        .status(400)
        .json({ success: false, message: "Province, district, municipality, and ward are required" });
    }

    const address = await Address.findOne({ _id: req.params.id, customerId: req.userId });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    address.province = province;
    address.district = district;
    address.municipality = municipality;
    address.ward = ward;
    address.streetAddress = streetAddress?.trim() || "";
    await address.save();

    res.json({ success: true, message: "Address updated successfully", address });
  } catch (err) {
    console.error("updateAddress error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/customer/address/:id
// ─────────────────────────────────────────────
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, customerId: req.userId });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    const wasDefault = address.isDefault;
    await address.deleteOne();

    // If deleted address was default, promote the next most recent one
    if (wasDefault) {
      const next = await Address.findOne({ customerId: req.userId }).sort({ createdAt: -1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    res.json({ success: true, message: "Address deleted successfully" });
  } catch (err) {
    console.error("deleteAddress error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PUT /api/customer/address/set-default/:id
// ─────────────────────────────────────────────
export const setDefaultAddress = async (req, res) => {
  try {
    // Remove default from all
    await Address.updateMany({ customerId: req.userId }, { isDefault: false });

    // Set new default
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, customerId: req.userId },
      { isDefault: true },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    res.json({ success: true, message: "Default address updated", address });
  } catch (err) {
    console.error("setDefaultAddress error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
