import { Supplier } from "../models/supplierModel.js";
import { Purchase } from "../models/purchaseModel.js";
import { Payment } from "../models/paymentModel.js";
import { Product } from "../models/productModel.js";
import QRCode from "qrcode";

/* ─────────────────────────────
   SUPPLIER CRUD
───────────────────────────── */

// POST /api/suppliers/add
export const addSupplier = async (req, res) => {
  try {
    const shopId = req.shopId;
    const {
      supplierName,
      companyName,
      phone,
      email,
      address,
      productsSupplied,
    } = req.body;

    if (!supplierName || !companyName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Supplier name, company name, and phone are required.",
      });
    }

    const supplier = new Supplier({
      supplierName,
      companyName,
      phone,
      email,
      address,
      productsSupplied,
      shopId,
    });

    await supplier.save();
    return res.status(201).json({ success: true, supplier });
  } catch (error) {
    console.error("addSupplier error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/suppliers
export const getSuppliers = async (req, res) => {
  try {
    const shopId = req.shopId;
    const suppliers = await Supplier.find({ shopId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, suppliers });
  } catch (error) {
    console.error("getSuppliers error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/suppliers/:id
export const updateSupplier = async (req, res) => {
  try {
    const shopId = req.shopId;
    const { id } = req.params;

    const supplier = await Supplier.findOne({ _id: id, shopId });
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found." });
    }

    const allowedFields = [
      "supplierName",
      "companyName",
      "phone",
      "email",
      "address",
      "productsSupplied",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) supplier[field] = req.body[field];
    });

    await supplier.save();
    return res.status(200).json({ success: true, supplier });
  } catch (error) {
    console.error("updateSupplier error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/suppliers/:id
export const deleteSupplier = async (req, res) => {
  try {
    const shopId = req.shopId;
    const { id } = req.params;

    const supplier = await Supplier.findOneAndDelete({ _id: id, shopId });
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found." });
    }

    return res.status(200).json({ success: true, message: "Supplier deleted." });
  } catch (error) {
    console.error("deleteSupplier error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─────────────────────────────
   PURCHASES
───────────────────────────── */

// POST /api/suppliers/purchase
export const recordPurchase = async (req, res) => {
  try {
    const shopId = req.shopId;
    const {
      supplierId,
      productId,
      productName,
      quantity,
      costPrice,
      sellingPrice,
      description,
      category,
      purchaseDate,
    } = req.body;

    if (!supplierId || !productName || !quantity || !costPrice) {
      return res.status(400).json({
        success: false,
        message: "supplierId, productName, quantity, and costPrice are required.",
      });
    }

    const supplier = await Supplier.findOne({ _id: supplierId, shopId });
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found." });
    }

    const totalCost = Number(quantity) * Number(costPrice);
    const imagePath = req.file ? req.file.path : null;

    let targetProduct;

    // Handle Product (New or Existing)
    if (productId && productId !== "null" && productId !== "") {
      // Existing Product Update
      targetProduct = await Product.findOne({ _id: productId, shopId });
      if (targetProduct) {
        targetProduct.name = productName;
        targetProduct.price = Number(sellingPrice) || targetProduct.price;
        targetProduct.description = description || targetProduct.description;
        targetProduct.category = category || targetProduct.category;
        targetProduct.quantity += Number(quantity);
        if (imagePath) targetProduct.image = imagePath;
        await targetProduct.save();
      }
    } else {
      // Create New Product
      targetProduct = new Product({
        name: productName,
        price: Number(sellingPrice) || 0,
        description: description || "",
        category: category || "Others",
        quantity: Number(quantity),
        image: imagePath,
        shopId,
      });
      await targetProduct.save();

      // Generate QR code for new product
      const qrFileName = `qr-${targetProduct._id}.png`;
      const qrPath = `uploads/${qrFileName}`;
      await QRCode.toFile(qrPath, targetProduct._id.toString());
      targetProduct.qrCode = qrPath;
      await targetProduct.save();
    }

    // Create purchase record
    const purchase = new Purchase({
      supplierId,
      supplierName: supplier.supplierName,
      productId: targetProduct ? targetProduct._id : null,
      productName,
      quantity: Number(quantity),
      costPrice: Number(costPrice),
      totalCost,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      shopId,
    });
    await purchase.save();

    // Update supplier financials
    supplier.totalPurchases += totalCost;
    supplier.totalDue = supplier.totalPurchases - supplier.totalPaid;
    await supplier.save();

    return res.status(201).json({ success: true, purchase, supplier, product: targetProduct });
  } catch (error) {
    console.error("recordPurchase error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/suppliers/purchases
export const getPurchases = async (req, res) => {
  try {
    const shopId = req.shopId;
    const purchases = await Purchase.find({ shopId }).sort({ purchaseDate: -1 });
    return res.status(200).json({ success: true, purchases });
  } catch (error) {
    console.error("getPurchases error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─────────────────────────────
   PAYMENTS
───────────────────────────── */

// POST /api/suppliers/payment
export const recordPayment = async (req, res) => {
  try {
    const shopId = req.shopId;
    const { supplierId, amountPaid, paymentMethod, paymentDate, note } = req.body;

    if (!supplierId || !amountPaid) {
      return res.status(400).json({
        success: false,
        message: "supplierId and amountPaid are required.",
      });
    }

    const supplier = await Supplier.findOne({ _id: supplierId, shopId });
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found." });
    }

    // Validation: amountPaid should not exceed totalDue
    if (Number(amountPaid) > supplier.totalDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${amountPaid}) cannot exceed outstanding due (${supplier.totalDue}).`,
      });
    }

    const payment = new Payment({
      supplierId,
      supplierName: supplier.supplierName,
      amountPaid: Number(amountPaid),
      paymentMethod: paymentMethod || "Cash",
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      shopId,
      note,
    });
    await payment.save();

    // Update supplier financials
    supplier.totalPaid += Number(amountPaid);
    supplier.totalDue = supplier.totalPurchases - supplier.totalPaid;
    await supplier.save();

    return res.status(201).json({ success: true, payment, supplier });
  } catch (error) {
    console.error("recordPayment error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/suppliers/payments
export const getPayments = async (req, res) => {
  try {
    const shopId = req.shopId;
    const payments = await Payment.find({ shopId }).sort({ paymentDate: -1 });
    return res.status(200).json({ success: true, payments });
  } catch (error) {
    console.error("getPayments error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─────────────────────────────
   SUMMARY STATS
───────────────────────────── */

// GET /api/suppliers/stats
export const getSupplierStats = async (req, res) => {
  try {
    const shopId = req.shopId;
    const suppliers = await Supplier.find({ shopId });

    const totalSuppliers = suppliers.length;
    const totalPurchases = suppliers.reduce((sum, s) => sum + s.totalPurchases, 0);
    const totalAmountPaid = suppliers.reduce((sum, s) => sum + s.totalPaid, 0);
    const totalOutstandingDue = suppliers.reduce((sum, s) => sum + s.totalDue, 0);

    return res.status(200).json({
      success: true,
      stats: { totalSuppliers, totalPurchases, totalAmountPaid, totalOutstandingDue },
    });
  } catch (error) {
    console.error("getSupplierStats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
