import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/staffDashboard.css";
import "../styles/staffInventory.css";
import StaffSidebar from "../components/StaffSidebar";

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

  // Add product form
  const [showAddForm, setShowAddForm] = useState(false);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productQuantity, setProductQuantity] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImage, setProductImage] = useState(null);

  // Edit product form
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState(null);

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
      formData.append("quantity", productQuantity);
      formData.append("description", productDescription);
      formData.append("category", productCategory);
      if (productImage) formData.append("image", productImage);

      const res = await axios.post(`${API_BASE}/api/owner/add-product`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((prev) => [...prev, res.data.product]);
      showToast("Product added successfully!");
      setProductName(""); setProductPrice(""); setProductQuantity("");
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
    <div className="sd-layout od-modern-layout">
      {/* Shared Staff Sidebar */}
      <StaffSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        staff={staff} 
        handleLogout={handleLogout} 
      />

      {/* ========== MAIN AREA ========== */}
      <div className={`sd-main od-main-content ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        {/* ---- TOP NAVBAR ---- */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)} onMouseEnter={() => { if (window.sidebarTimer) clearTimeout(window.sidebarTimer); setSidebarOpen(true); }} onMouseLeave={() => { window.sidebarTimer = setTimeout(() => setSidebarOpen(false), 300); }}>☰</button>
            <div className="sd-navbar__title">
              <h1>Product Management</h1>
              <span className="sd-navbar__subtitle">Manage your inventory</span>
            </div>
          </div>
          <div className="sd-navbar__right">
            <div
              onClick={() => navigate("/staff-profile")}
              style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
            >
              <div className="sd-avatar">
                {staff?.profileImage ? (
                  <img src={`${API_BASE}/${staff.profileImage}`} alt="avatar" />
                ) : (
                  <span>{(staff?.username || "S")[0].toUpperCase()}</span>
                )}
              </div>
              <div className="sd-navbar__staff-info">
                <span className="sd-navbar__name">{staff?.username || "Staff"}</span>
                <span className="sd-navbar__role">Staff</span>
              </div>
            </div>
          </div>
        </header>

        {/* ---- CONTENT ---- */}
        <main className="sd-content od-content">

          {/* 1. Header Section */}
          <div className="si-header-section">
            <div className="si-header-info">
              <h2>Inventory</h2>
              <p>Manage and update your product catalog for your SmartKhata.</p>
            </div>
            <div className="si-header-actions">
              <button className="si-btn-primary si-btn-primary--dark" onClick={() => setShowAddForm(true)}>
                <span>+</span> Add Product
              </button>
            </div>
          </div>

          {/* 2. Summary Metrics */}
          <div className="si-ledger-cards">
            <div className="si-ledger-card">
              <span className="si-ledger-card__label">Total Products</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num">{products.length.toLocaleString()}</span>
              </div>
            </div>
            <div className="si-ledger-card">
              <span className="si-ledger-card__label">In Stock</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num">{products.filter((p) => p.quantity > 4).length.toLocaleString()}</span>
              </div>
            </div>
            <div className="si-ledger-card">
              <span className="si-ledger-card__label">Low Stock</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num" style={{ color: '#f59e0b' }}>{lowStockCount}</span>
              </div>
            </div>
            <div className="si-ledger-card">
              <span className="si-ledger-card__label">Out of Stock</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num" style={{ color: '#ef4444' }}>{outOfStockCount}</span>
              </div>
            </div>
          </div>

          {/* 3. Filter Row */}
          <div className="si-filter-row">
            <div className="si-filters-left">
              <div className="si-search-input-wrap">
                <input
                  type="text"
                  placeholder="Search product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="si-ledger-select"
                  style={{ width: '280px', paddingLeft: '36px' }}
                />
              </div>
              <select
                className="si-ledger-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {CATEGORY_LIST.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="si-filters-right">
               <span style={{ fontSize: '12px', fontWeight: 600 }}>{filteredProducts.length} Results</span>
            </div>
          </div>

          {/* 4. The Ledger Table */}
          <div className="si-ledger-table-wrap">
            <table className="si-ledger-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Product</th>
                  <th>Category</th>
                  <th>Price (NPR)</th>
                  <th>Inventory</th>
                  <th>Status</th>
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
                              <img src={`${API_BASE}/${p.image}`} alt={p.name} className="si-ledger-img" />
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
                          <div className="si-status-wrap">
                            <span className={`si-dot ${isOutOfStock ? 'si-dot--red' : isLowStock ? 'si-dot--orange' : 'si-dot--green'}`}></span>
                            <span className="si-status-text">
                              {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock"}
                            </span>
                          </div>
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
                    <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
                  <label>Price (NPR) *</label>
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
                    src={`${API_BASE}/${products.find((p) => p._id === editingProduct)?.image}`}
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
                  <label>Price (NPR) *</label>
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

      {/* ========== TOAST ========== */}
      {toast.visible && (
        <div className={`sd-toast sd-toast--${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default StaffInventory;
