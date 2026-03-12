import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/staffDashboard.css";
import "../styles/staffInventory.css";

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
    <div className="sd-layout">
      {/* ========== SIDEBAR ========== */}
      <aside
        className={`sd-sidebar ${sidebarOpen ? "sd-sidebar--open" : ""}`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <div className="sd-sidebar__brand">
          <span className="sd-sidebar__logo">🛍️</span>
          <span className="sd-sidebar__brand-name">Khata</span>
        </div>
        <nav className="sd-sidebar__nav">
          {navLinks.map((link) => (
            <button
              key={link.path}
              className={`sd-sidebar__link ${window.location.pathname === link.path ? "active" : ""}`}
              onClick={() => navigate(link.path)}
            >
              <span className="sd-sidebar__icon">{link.icon}</span>
              <span className="sd-sidebar__label">{link.label}</span>
            </button>
          ))}
        </nav>
        <div className="sd-sidebar__bottom">
          <button className="sd-sidebar__link sd-sidebar__logout" onClick={handleLogout}>
            <span className="sd-sidebar__icon">🚪</span>
            <span className="sd-sidebar__label">Logout</span>
          </button>
        </div>
      </aside>

      {/* ========== MAIN AREA ========== */}
      <div className={`sd-main ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        {/* ---- TOP NAVBAR ---- */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div className="sd-navbar__title">
              <h1>Product Management</h1>
              <span className="sd-navbar__subtitle">Manage your inventory</span>
            </div>
          </div>
          <div className="sd-navbar__right">
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
        </header>

        {/* ---- CONTENT ---- */}
        <main className="sd-content">

          {/* Page Header Banner */}
          <div className="sd-welcome si-banner">
            <div>
              <h2>📦 Inventory Overview</h2>
              <p>Browse, add, edit or remove products from your store.</p>
            </div>
            <button className="sd-btn-scan si-add-btn" onClick={() => setShowAddForm(true)}>
              ➕ Add New Product
            </button>
          </div>

          {/* Summary mini-cards */}
          <div className="si-mini-cards">
            <div className="si-mini-card si-mini-card--blue">
              <span className="si-mini-card__icon">📦</span>
              <div>
                <div className="si-mini-card__num">{products.length}</div>
                <div className="si-mini-card__label">Total Products</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--green">
              <span className="si-mini-card__icon">✅</span>
              <div>
                <div className="si-mini-card__num">{products.filter((p) => p.quantity > 4).length}</div>
                <div className="si-mini-card__label">In Stock</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--orange">
              <span className="si-mini-card__icon">⚠️</span>
              <div>
                <div className="si-mini-card__num">{lowStockCount}</div>
                <div className="si-mini-card__label">Low Stock</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--red">
              <span className="si-mini-card__icon">❌</span>
              <div>
                <div className="si-mini-card__num">{outOfStockCount}</div>
                <div className="si-mini-card__label">Out of Stock</div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="sd-panel si-search-panel">
            <div className="si-search-row">
              <div className="si-search-input-wrap">
                <svg className="si-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="si-search-input"
                />
                {searchTerm && (
                  <button className="si-search-clear" onClick={() => setSearchTerm("")}>✕</button>
                )}
              </div>
              <select
                className="sd-filter-select si-cat-filter"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {CATEGORY_LIST.map((c) => <option key={c}>{c}</option>)}
              </select>
              <span className="si-result-count">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Product Table Panel */}
          <div className="sd-panel si-table-panel">
            <div className="sd-panel__header">
              <h3>📋 Products</h3>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="si-table-wrap">
                <table className="si-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price (NPR)</th>
                      <th>Qty</th>
                      <th>Status</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p._id}>
                        <td className="si-product-cell">
                          {p.image ? (
                            <img
                              src={`${API_BASE}/${p.image}`}
                              alt={p.name}
                              className="si-product-thumb"
                            />
                          ) : (
                            <div className="si-product-thumb-placeholder">📷</div>
                          )}
                          <span className="si-product-name">{p.name || "Unnamed"}</span>
                        </td>
                        <td>
                          <span className="si-category-tag">{p.category || "Others"}</span>
                        </td>
                        <td className="si-price-cell">NPR {(p.price ?? 0).toLocaleString()}</td>
                        <td>
                          <span className={`si-qty ${p.quantity === 0 ? "zero" : p.quantity < 5 ? "low" : "ok"}`}>
                            {p.quantity ?? 0}
                          </span>
                        </td>
                        <td>
                          <span className={`sd-badge ${p.quantity > 0 ? "badge-delivered" : "badge-cancelled"}`}>
                            {p.quantity > 0 ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>
                        <td className="si-desc-cell">
                          {p.description?.substring(0, 55)}{p.description?.length > 55 ? "..." : ""}
                        </td>
                        <td>
                          <div className="si-actions">
                            <button
                              className="si-btn si-btn--edit"
                              onClick={() => handleEditClick(p)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="si-btn si-btn--delete"
                              onClick={() => handleDeleteProduct(p._id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="sd-empty">
                <span>📦</span>
                <p>{searchTerm || filterCategory !== "All" ? "No products match your search." : "No products yet."}</p>
              </div>
            )}
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
