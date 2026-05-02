import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import "../styles/staffInventory.css";
import "../styles/ownerDashboard.css";
import StaffSidebar from "../components/StaffSidebar";
import QRScanner from "./QRScanner";

const API_BASE = "http://localhost:8000";

const CATEGORY_LIST = [
  "Electronics",
  "Fashion",
  "Beauty & Personal Care",
  "Home & Kitchen",
  "Books & Stationery",
  "Toys & Games",
  "Sports & Fitness",
  "Automotive",
  "Others",
];

const StaffInventory = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState({});
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewQr, setViewQr] = useState(null);

  // Add product form
  const [showAddForm, setShowAddForm] = useState(false);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCostPrice, setProductCostPrice] = useState("");
  const [productQuantity, setProductQuantity] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImage, setProductImage] = useState(null);

  // Edit product form
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCostPrice, setEditCostPrice] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState(null);

  // Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [closedScannedProduct, setClosedScannedProduct] = useState(false);
  const [reAddQuantity, setReAddQuantity] = useState(1);
  const [isAddingStock, setIsAddingStock] = useState(false);

  const [editScannedPrice, setEditScannedPrice] = useState("");
  const [editScannedCostPrice, setEditScannedCostPrice] = useState("");
  const [editScannedQuantity, setEditScannedQuantity] = useState("");
  const [isUpdatingScanned, setIsUpdatingScanned] = useState(false);

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  };

  // Fetch staff info + products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const resStaff = await axios.get(`${API_BASE}/api/owner/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStaff(resStaff.data.owner || resStaff.data.staff);

        const res = await axios.get(`${API_BASE}/api/owner/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(res.data.products || []);
      } catch (err) {
        console.error(err);
        showToast("Failed to load inventory", "error");
      }
    };
    fetchData();
  }, []);

  // Scanner effect
  useEffect(() => {
    if (scannedProduct?._id) {
      setReAddQuantity(1);
      setClosedScannedProduct(false);
    }
  }, [scannedProduct?._id]);

  // Logout
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${API_BASE}/api/staff/logout-click`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  // Add product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productCategory) { showToast("Please select a category", "error"); return; }
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("name", productName);
      formData.append("price", productPrice);
      formData.append("costPrice", productCostPrice);
      formData.append("quantity", productQuantity);
      formData.append("description", productDescription);
      formData.append("category", productCategory);
      if (productImage) formData.append("image", productImage);

      const res = await axios.post(`${API_BASE}/api/owner/add-product`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((prev) => [...prev, res.data.product]);
      showToast("Product added successfully!");
      setProductName(""); setProductPrice(""); setProductCostPrice(""); setProductQuantity("");
      setProductDescription(""); setProductCategory(""); setProductImage(null);
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Error adding product", "error");
    }
  };

  // Edit click
  const handleEditClick = (product) => {
    setEditingProduct(product._id);
    setEditName(product.name || "");
    setEditPrice(product.price || "");
    setEditCostPrice(product.costPrice || "");
    setEditQuantity(product.quantity || "");
    setEditCategory(product.category || "Others");
    setEditDescription(product.description || "");
    setEditImage(null);
  };

  // Update product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("name", editName);
      formData.append("price", editPrice);
      formData.append("costPrice", editCostPrice);
      formData.append("quantity", editQuantity);
      formData.append("category", editCategory);
      formData.append("description", editDescription);
      if (editImage) formData.append("image", editImage);

      const res = await axios.put(
        `${API_BASE}/api/owner/update-product/${editingProduct}`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      setProducts((prev) => prev.map((p) => p._id === editingProduct ? res.data.product : p));
      setEditingProduct(null);
      showToast("Product updated successfully!");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Update failed", "error");
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_BASE}/api/owner/delete-product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(products.filter((p) => p._id !== productId));
      showToast("Product deleted successfully");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Delete failed", "error");
    }
  };

  // QR Download
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
      showToast("QR Download failed", "error");
    }
  };

  // Scanner Logic
  const handleScanSuccess = async (productId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/api/owner/product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && res.data.product) {
        setScannedProduct({
          ...res.data.product,
          deleted: !!res.data.product.deleted,
          imageFile: res.data.product.image || null,
        });
        setEditScannedPrice(res.data.product.price || 0);
        setEditScannedCostPrice(res.data.product.costPrice || 0);
        setEditScannedQuantity(res.data.product.quantity || 0);
      }
      setScannerOpen(false);
    } catch (err) {
      setScannedProduct({ name: "Product not found", price: "-", description: "-", deleted: true, imageFile: null });
      setScannerOpen(false);
    }
  };

  const handleUpdateScannedProduct = async () => {
    setIsUpdatingScanned(true);
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("name", scannedProduct.name);
      formData.append("price", editScannedPrice);
      formData.append("costPrice", editScannedCostPrice);
      formData.append("quantity", editScannedQuantity);
      formData.append("category", scannedProduct.category || "Others");
      formData.append("description", scannedProduct.description || "");

      const res = await axios.put(
        `${API_BASE}/api/owner/update-product/${scannedProduct._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setProducts((prev) => {
        const exists = prev.find((p) => p._id === scannedProduct._id);
        if (exists) return prev.map((p) => (p._id === scannedProduct._id ? res.data.product : p));
        return [...prev, res.data.product];
      });
      
      setScannedProduct(null);
      setClosedScannedProduct(true);
      showToast("Product updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update product", "error");
    } finally {
      setIsUpdatingScanned(false);
    }
  };

  const handleAddProductAgain = async (product) => {
    setIsAddingStock(true);
    setClosedScannedProduct(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(`${API_BASE}/api/owner/restore-product/${product._id}`,
        { quantity: reAddQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts((prev) => {
        const exists = prev.find((p) => p._id === product._id);
        return exists ? prev.map((p) => (p._id === product._id ? res.data.product : p)) : [...prev, res.data.product];
      });
      setReAddQuantity(1);
      showToast("Stock added successfully!");
    } catch (err) {
      showToast("Failed to update stock", "error");
      setClosedScannedProduct(false);
    } finally {
      setIsAddingStock(false);
    }
  };

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === "All" || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const lowStockCount = products.filter((p) => p.quantity > 0 && p.quantity < 5).length;
  const outOfStockCount = products.filter((p) => p.quantity === 0).length;

  const navLinks = [
    { label: "Dashboard", icon: "🏠", path: "/staff-dashboard" },
    { label: "Product Management", icon: "📦", path: "/staff-inventory" },
    { label: "Orders", icon: "🛒", path: "/order-management" },
    { label: "Attendance", icon: "📅", path: "/staff-attendance" },
    { label: "Profile", icon: "👤", path: "/staff-profile" },
  ];

  return (
    <div className="od-shell">
      {/* Shared Staff Sidebar */}
      <StaffSidebar staff={staff} />

      {/* ========== MAIN AREA ========== */}
      <div className="od-main">
        {/* ---- TOP NAVBAR ---- */}
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">Product Management</h1>
            <div className="od-topbar__date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <div className="od-topbar__right">
            <button className="od-pill od-pill--active" onClick={() => setShowAddForm(true)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>+</span> Add Product
            </button>
            <button className="od-pill" onClick={() => setScannerOpen(true)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🔍</span> Scan QR
            </button>

            <div className="od-topbar__profile" onClick={() => navigate("/staff-profile")}>
              <div className="od-topbar__avatar">
                {staff?.profileImage ? (
                  <img src={imgUrl(staff.profileImage)} alt="avatar" />
                ) : (
                  <span>{(staff?.username || "S")[0].toUpperCase()}</span>
                )}
              </div>
            </div>

            <button className="od-topbar__logout" onClick={handleLogout} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </header>

        {/* ---- CONTENT ---- */}
        <main className="od-content">

          {/* ── Stat cards ── */}
          <div className="od-stat-grid">
            {[
              { label: "Total Products", value: products.length.toLocaleString(), color: "#8b5cf6", icon: "M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
              { label: "In Stock", value: products.filter((p) => p.quantity > 4).length.toLocaleString(), color: "#10b981", icon: "M5 13l4 4L19 7" },
              { label: "Low Stock", value: lowStockCount, color: "#f59e0b", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
              { label: "Out of Stock", value: outOfStockCount, color: "#ef4444", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" },
            ].map(card => (
              <div className="od-stat-card" key={card.label}>
                <div className="od-stat-card__icon" style={{ background: card.color + "18", color: card.color }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={card.icon} />
                  </svg>
                </div>
                <div>
                  <div className="od-stat-card__label">{card.label}</div>
                  <div className="od-stat-card__value">{card.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 3. Filter Row */}
          <div className="od-panel" style={{ marginBottom: "16px", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <input
                  type="text"
                  placeholder="Search product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '280px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', background: '#fff' }}
                >
                  <option value="All">All Categories</option>
                  {CATEGORY_LIST.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{filteredProducts.length} Results</span>
              </div>
            </div>
          </div>

          {/* 4. The Ledger Table */}
          <div className="od-panel od-panel--table" style={{ marginBottom: "40px" }}>
            <div className="od-panel__head" style={{ paddingBottom: '16px' }}>
              <div>
                <div className="od-panel__title">Inventory Ledger</div>
                <div className="od-panel__sub">All available products</div>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="od-table">
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Product</th>
                    <th>Category</th>
                    <th>Price (NPR)</th>
                    <th>Inventory</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>QR Code</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const isOutOfStock = (p.quantity || 0) === 0;
                    const isLowStock = (p.quantity || 0) > 0 && (p.quantity || 0) < 5;
                    
                    return (
                      <tr key={p._id}>
                        <td>
                          <div className="si-ledger-product">
                            {p.image ? (
                              <img src={imgUrl(p.image)} alt={p.name} className="si-ledger-img" />
                            ) : (
                              <div className="si-ledger-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</div>
                            )}
                            
                            <div className="si-ledger-product-info">
                              <span className="si-ledger-name">{p.name || "Unnamed"}</span>
                              <span className="si-ledger-desc">{p.description}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="si-ledger-tag">{p.category || "Others"}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            Rs. {(p.price ?? 0).toLocaleString()}
                          </div>
                        </td>
                        <td style={{ color: '#0f172a', fontWeight: 500 }}>
                          {p.quantity ?? 0} units
                        </td>
                        <td>
                          <span className={`od-badge od-badge--${isOutOfStock ? 'red' : isLowStock ? 'amber' : 'green'}`}>
                            {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {p.qrCode ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                              <img 
                                src={imgUrl(p.qrCode)} 
                                alt="QR" 
                                style={{ width: "36px", height: "36px", objectFit: "contain", borderRadius: "4px", border: "1px solid #e2e8f0", cursor: "pointer" }}
                                onClick={() => setViewQr(imgUrl(p.qrCode))}
                                title="Click to enlarge"
                              />
                              <button 
                                onClick={() => downloadQR(p._id)} 
                                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                                title="Download QR"
                              >
                                Download
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>N/A</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="si-actions" style={{ justifyContent: 'flex-end' }}>
                            <button className="si-btn si-btn--edit" onClick={() => handleEditClick(p)} >Edit</button>
                            <button className="si-btn si-btn--delete" onClick={() => handleDeleteProduct(p._id)} >Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ========== ADD PRODUCT MODAL ========== */}
      {showAddForm && (
        <div className="si-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false); }}>
          <div className="si-modal">
            <div className="si-modal__header">
              <h2>➕ Add New Product</h2>
              <button className="si-modal__close" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            <form onSubmit={handleAddProduct} className="si-form">
              <div className="si-form__grid">
                <div className="si-form__group">
                  <label>Product Name *</label>
                  <input type="text" placeholder="Enter product name" value={productName}
                    onChange={(e) => setProductName(e.target.value)} required />
                </div>
                <div className="si-form__group">
                  <label>Cost Price *</label>
                  <input type="number" placeholder="Cost Price" value={productCostPrice}
                    onChange={(e) => setProductCostPrice(e.target.value)} required />
                </div>
                <div className="si-form__group">
                  <label>Selling Price (NPR) *</label>
                  <input type="number" placeholder="0.00" value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)} required />
                </div>
                <div className="si-form__group">
                  <label>Quantity *</label>
                  <input type="number" placeholder="1" min="1" value={productQuantity}
                    onChange={(e) => setProductQuantity(e.target.value)} required />
                </div>
                <div className="si-form__group">
                  <label>Category *</label>
                  <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} required>
                    <option value="">Select Category</option>
                    {CATEGORY_LIST.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="si-form__group">
                <label>Description *</label>
                <textarea placeholder="Describe your product..." value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)} required />
              </div>
              <div className="si-form__group">
                <label>Product Image</label>
                <input type="file" accept="image/*" onChange={(e) => setProductImage(e.target.files[0])} />
                {productImage && <span className="si-file-hint">✓ {productImage.name}</span>}
              </div>
              <div className="si-form__actions">
                <button type="button" className="si-btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="si-btn-submit">Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== EDIT PRODUCT MODAL ========== */}
      {editingProduct && (
        <div className="si-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditingProduct(null); }}>
          <div className="si-modal">
            <div className="si-modal__header">
              <h2>✏️ Edit Product</h2>
              <button className="si-modal__close" onClick={() => setEditingProduct(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdateProduct} className="si-form">
              {/* Current image preview */}
              {products.find((p) => p._id === editingProduct)?.image && !editImage && (
                <div className="si-edit-img-preview">
                  <img
                    src={imgUrl(products.find((p) => p._id === editingProduct)?.image)}
                    alt="Current"
                  />
                </div>
              )}
              <div className="si-form__grid">
                <div className="si-form__group">
                  <label>Product Name *</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    placeholder="Product Name" required />
                </div>
                <div className="si-form__group">
                  <label>Cost Price *</label>
                  <input type="number" value={editCostPrice} onChange={(e) => setEditCostPrice(e.target.value)}
                    placeholder="0.00" required />
                </div>
                <div className="si-form__group">
                  <label>Selling Price (NPR) *</label>
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="0.00" required />
                </div>
                <div className="si-form__group">
                  <label>Quantity *</label>
                  <input type="number" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)}
                    placeholder="1" required />
                </div>
                <div className="si-form__group">
                  <label>Category *</label>
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} required>
                    {CATEGORY_LIST.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="si-form__group">
                <label>Description *</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Product description..." required />
              </div>
              <div className="si-form__group">
                <label>New Image (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setEditImage(e.target.files[0])} />
                {editImage && <span className="si-file-hint">✓ {editImage.name}</span>}
              </div>
              <div className="si-form__actions">
                <button type="button" className="si-btn-cancel" onClick={() => setEditingProduct(null)}>Cancel</button>
                <button type="submit" className="si-btn-submit">💾 Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR SCANNER */}
      {scannerOpen && <QRScanner onScanSuccess={handleScanSuccess} onClose={() => setScannerOpen(false)} />}

      {/* ========== VIEW QR MODAL ========== */}
      {viewQr && (
        <div className="si-modal-overlay" onClick={() => setViewQr(null)} style={{ zIndex: 9999 }}>
          <div className="si-modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="si-modal__header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <h2 style={{ fontSize: '18px' }}>Scan QR Code</h2>
              <button className="si-modal__close" onClick={() => setViewQr(null)}>✕</button>
            </div>
            <div style={{ padding: '20px' }}>
              <img src={viewQr} alt="Large QR" style={{ width: '100%', maxWidth: '300px', height: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            </div>
          </div>
        </div>
      )}

      {/* ========== TOAST ========== */}
      {toast.visible && (
        <div className={`od-toast od-toast--${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default StaffInventory;
