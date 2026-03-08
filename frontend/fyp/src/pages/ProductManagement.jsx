import React, { useState, useEffect } from "react";
import axios from "axios";
import QRScanner from "./QRScanner"; 
import "../styles/ownerDashboard.css";
import Sidebar from "../components/Sidebar";

const ProductManagement = () => {
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });

  const [products, setProducts] = useState([]);
  const [scannedProduct, setScannedProduct] = useState(null);

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImage, setProductImage] = useState(null);

  const [qrVisible, setQrVisible] = useState({});

  const [scannerOpen, setScannerOpen] = useState(false);
  const [productCategory, setProductCategory] = useState("");
  const [productQuantity, setProductQuantity] = useState("");

  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState(null);

  const [reAddQuantity, setReAddQuantity] = useState(1);
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [closedScannedProduct, setClosedScannedProduct] = useState(false);

  const API_BASE = "http://localhost:8000";

  useEffect(() => {
    if (scannedProduct?._id) {
      setReAddQuantity(1);
      setClosedScannedProduct(false);
    }
  }, [scannedProduct?._id]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const resProducts = await axios.get(`${API_BASE}/api/owner/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(resProducts.data.products || []);
      } catch (err) {
        console.error(err);
        showToast(err.response?.data?.message || "Error loading products");
      }
    };
    fetchProducts();
  }, []);

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast({ ...toast, visible: false });
    }, duration);
  };

  const CATEGORY_LIST = [
    "Electronics", "Fashion", "Beauty & Personal Care", "Home & Kitchen",
    "Books & Stationery", "Toys & Games", "Sports & Fitness", "Automotive", "Others",
  ];

  const handleEditClick = (product) => {
    setEditingProduct(product._id);
    setEditName(product.name || "");
    setEditPrice(product.price || "");
    setEditQuantity(product.quantity || "");
    setEditCategory(product.category || "Others");
    setEditDescription(product.description || "");
    setEditImage(null);  
  };

  const handleUpdateProduct = async (e, productId) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("name", editName);
      formData.append("price", editPrice);
      formData.append("quantity", editQuantity);
      formData.append("category", editCategory);
      formData.append("description", editDescription);

      if (editImage) {
        formData.append("image", editImage);
      }

      const res = await axios.put(
        `${API_BASE}/api/owner/update-product/${productId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? res.data.product : p))
      );
      setEditingProduct(null);
      showToast("Product updated successfully!");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Update failed");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productCategory) {
      showToast("Please select a product category");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("name", productName);
      formData.append("price", productPrice);
      formData.append("quantity", productQuantity);
      formData.append("description", productDescription);
      formData.append("image", productImage);
      formData.append("category", productCategory);

      const res = await axios.post(`${API_BASE}/api/owner/add-product`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast("Product added successfully!");
      setProducts([...products, res.data.product]);
      setProductName("");
      setProductPrice("");
      setProductQuantity("");
      setProductDescription("");
      setProductCategory("");
      setProductImage(null);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Error adding product");
    }
  };

  const handleAddProductAgain = async (product) => {
    setIsAddingStock(true);
    setClosedScannedProduct(true);
    const quantityToAdd = reAddQuantity;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(
        `${API_BASE}/api/owner/restore-product/${product._id}`,
        { quantity: quantityToAdd },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProducts(prev => {
        const exists = prev.find(p => p._id === product._id);
        if (exists) {
          return prev.map(p => (p._id === product._id ? res.data.product : p));
        } else {
          return [...prev, res.data.product];
        }
      });

      setReAddQuantity(1);
      showToast("Stock added successfully!");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update stock");
      setClosedScannedProduct(false);
    } finally {
      setIsAddingStock(false);
    }
  };

  const toggleQR = (productId) => {
    setQrVisible((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const downloadQR = async (productId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/api/owner/download-qr/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `product-${productId}-qr.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed", err);
      alert("Download failed");
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_BASE}/api/owner/delete-product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(products.filter((p) => p._id !== productId));
      showToast("Product deleted successfully");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Delete failed");
    }
  };

  const handleScanSuccess = async (productId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/api/owner/product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success && res.data.product) {
        const product = res.data.product;
        setScannedProduct({
          ...product,
          deleted: !!product.deleted,
          imageFile: product.image ? product.image : null,
        });
      } else {
        setScannedProduct({
          name: "Product not found",
          price: "-",
          description: "-",
          deleted: true,
          imageFile: null,
        });
      }
      setScannerOpen(false);
    } catch (err) {
      console.error("Product fetch failed:", err.response?.data || err.message);
      setScannedProduct({
        name: "Product not found",
        price: "-",
        description: "-",
        deleted: true,
        imageFile: null,
      });
      setScannerOpen(false);
    }
  };

  return (
    <div className="owner-layout">
      <Sidebar />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <header>
            <h1>Products Management</h1>
            <p className="subtitle">Manage your products and inventory</p>
          </header>

          <button className="scan-btn-primary" onClick={() => setScannerOpen(true)}>
            📱 Scan Product QR
          </button>
        </div>

        {scannerOpen && (
          <QRScanner
            onScanSuccess={handleScanSuccess}
            onClose={() => setScannerOpen(false)}
          />
        )}

        {scannedProduct && !closedScannedProduct && (
          <div className="scanned-product-card">
            <div className="scanned-header">
              <h3>
                {scannedProduct.name}
                {scannedProduct.deleted && <span className="deleted-badge">Deleted</span>}
              </h3>
              <button className="close-scanned" onClick={() => {
                setScannedProduct(null);
                setClosedScannedProduct(false);
              }}>✕</button>
            </div>
            
            {scannedProduct.imageFile && (
              <img 
                src={`${API_BASE}/${scannedProduct.imageFile}`} 
                alt={scannedProduct.name}
                className="scanned-product-img"
              />
            )}
            
            <div className="scanned-details">
              <p><span className="label">Price:</span> <span className="price">NPR {scannedProduct.price}</span></p>
              <p><span className="label">Description:</span> {scannedProduct.description}</p>
            </div>

            {scannedProduct.deleted && (
              <div className="readd-section">
                <div className="readd-input">
                  <label>Add Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={reAddQuantity}
                    onChange={(e) => setReAddQuantity(Number(e.target.value))}
                    disabled={isAddingStock}
                  />
                  <button
                    type="button"
                    className="re-add-btn"
                    onClick={() => handleAddProductAgain(scannedProduct)}
                    disabled={isAddingStock}
                  >
                    {isAddingStock ? "Adding..." : "➕ Add Stock"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <section className="add-product-section">
          <div className="section-header">
            <h2>📦 Add New Product</h2>
          </div>
          <form onSubmit={handleAddProduct} encType="multipart/form-data" className="product-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Price (NPR) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  placeholder="1"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  {CATEGORY_LIST.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                placeholder="Describe your product..."
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Product Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProductImage(e.target.files[0])}
              />
              {productImage && <p className="file-preview">✓ {productImage.name}</p>}
            </div>

            <button type="submit" className="btn-submit">Add Product</button>
          </form>
        </section>

        <section className="product-list">
          <div className="section-header">
            <h2>📋 Your Products ({products.length})</h2>
          </div>
          
          {Array.isArray(products) && products.length > 0 ? (
            <div className="products-grid">
              {products.map((p) => 
                p ? (
                  <div key={p._id || Math.random()} className="product-card">
                    {p.image ? (
                      <div className="product-img-container">
                        <img 
                          src={`${API_BASE}/${p.image}`} 
                          alt={p.name}
                          className="product-img"
                        />
                      </div>
                    ) : (
                      <div className="product-img-placeholder">
                        <span>📷</span>
                      </div>
                    )}

                    <div className="product-info">
                      <h3 className="product-name">{p.name || "Unnamed"}</h3>
                      <p className="product-category">{p.category || "Others"}</p>
                      
                      <div className="product-details">
                        <div className="detail-item">
                          <span className="label">Price:</span>
                          <span className="value price">NPR {p.price ?? 0}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Stock:</span>
                          <span className={`value ${p.quantity > 0 ? 'in-stock' : 'out-stock'}`}>
                            {p.quantity ?? 0}
                          </span>
                        </div>
                      </div>

                      <p className="product-desc">{p.description?.substring(0, 80)}...</p>
                    </div>

                    {qrVisible[p._id] && p.qrCode && (
                      <div className="qr-code-section">
                        <img
                          src={`${API_BASE}/${p.qrCode}`}
                          alt="QR Code"
                          className="qr-image"
                        />
                        <button className="btn-download-qr" onClick={() => downloadQR(p._id)}>
                          ⬇ Download QR
                        </button>
                      </div>
                    )}

                    <div className="product-actions">
                      <button
                        className="btn-qr"
                        onClick={() => toggleQR(p._id)}
                        title="Show/Hide QR Code"
                      >
                        {qrVisible[p._id] ? "🔒 Hide QR" : "🔓 Show QR"}
                      </button>

                      <button
                        className="btn-edit"
                        onClick={() => handleEditClick(p)}
                        title="Edit product"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteProduct(p._id)}
                        title="Delete product"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>📦 No products yet. Add your first product above!</p>
            </div>
          )}
        </section>

        {editingProduct && (
          <div className="full-page-edit-modal">
            <div className="edit-modal-container">
              <div className="edit-modal-header">
                <h2>✏️ Edit Product</h2>
                <button 
                  className="edit-modal-close" 
                  onClick={() => setEditingProduct(null)}
                >
                  ✕
                </button>
              </div>

              <div className="edit-modal-content">
                <form
                  onSubmit={(e) => handleUpdateProduct(e, editingProduct)}
                  className="full-edit-form"
                >
                  <div className="edit-form-grid">
                    <div className="edit-image-section">
                      <h3>Product Image</h3>
                      {products.find(p => p._id === editingProduct)?.image && !editImage && (
                        <img
                          src={`${API_BASE}/${products.find(p => p._id === editingProduct)?.image}`}
                          alt="Current product"
                          className="edit-current-img"
                        />
                      )}
                      <div className="edit-upload-box">
                        <label>Upload New Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditImage(e.target.files[0])}
                        />
                        {editImage && <p className="file-preview">✓ {editImage.name}</p>}
                      </div>
                    </div>

                    <div className="edit-fields-section">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Product Name *</label>
                          <input
                            type="text"
                            value={editName || ""}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Product Name"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Price (NPR) *</label>
                          <input
                            type="number"
                            value={editPrice ?? ""}
                            onChange={(e) => setEditPrice(e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Quantity *</label>
                          <input
                            type="number"
                            value={editQuantity ?? ""}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            placeholder="1"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Category *</label>
                          <select
                            value={editCategory || "Others"}
                            onChange={(e) => setEditCategory(e.target.value)}
                            required
                          >
                            {CATEGORY_LIST.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Description *</label>
                          <textarea
                            value={editDescription || ""}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Enter product description..."
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="edit-modal-actions">
                    <button type="submit" className="btn-save-modal">
                      💾 Save Changes
                    </button>
                    <button
                      type="button"
                      className="btn-cancel-modal"
                      onClick={() => setEditingProduct(null)}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {toast.visible && (
          <div className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
