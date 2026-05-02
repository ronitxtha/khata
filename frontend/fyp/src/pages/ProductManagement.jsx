import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import QRScanner from "./QRScanner";
import { imgUrl } from "../utils/imageUrl";
import "../styles/ownerDashboard.css";
import "../styles/staffDashboard.css";
import "../styles/productManagement.css";

const API_BASE = "http://localhost:8000";

const CATEGORY_LIST = [
  "Electronics", "Fashion", "Beauty & Personal Care", "Home & Kitchen",
  "Books & Stationery", "Toys & Games", "Sports & Fitness", "Automotive", "Others",
];

const ProductManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [owner, setOwner] = useState({});
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewQr, setViewQr] = useState(null);

  // Add product form
  const [showAddForm, setShowAddForm] = useState(false);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");     // Selling Price
  const [productCostPrice, setProductCostPrice] = useState(""); // Cost Price
  const [productQuantity, setProductQuantity] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImage, setProductImage] = useState(null);

  // Edit product form
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");     // Selling Price
  const [editCostPrice, setEditCostPrice] = useState(""); // Cost Price
  const [editQuantity, setEditQuantity] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState(null);

  // QR / Scanner
  const [qrVisible, setQrVisible] = useState({});
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

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setOwner(user);

        const res = await axios.get(`${API_BASE}/api/owner/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(res.data.products || []);
      } catch (err) {
        console.error(err);
        showToast("Failed to load products", "error");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (scannedProduct?._id) {
      setReAddQuantity(1);
      setClosedScannedProduct(false);
    }
  }, [scannedProduct?._id]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
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
      formData.append("price", productPrice); // Selling Price
      formData.append("costPrice", productCostPrice); // Cost Price
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

  // QR download
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

  // Scanner
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
      
      // Close the card upon success
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
    
    const isOutOfStock = (p.quantity || 0) === 0;
    const isLowStock = (p.quantity || 0) > 0 && (p.quantity || 0) < 5;
    const currentStatus = isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock";
    const matchStatus = filterStatus === "All" || currentStatus === filterStatus;

    return matchSearch && matchCategory && matchStatus;
  });

  const lowStockCount = products.filter((p) => p.quantity > 0 && p.quantity < 5).length;
  const outOfStockCount = products.filter((p) => p.quantity === 0).length;

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const isOwner = owner?.role === "owner";
  const profilePath = isOwner ? "/owner-profile" : "/staff-profile";
  const sideLinks = isOwner ? [
    { label: "Dashboard", path: "/owner-dashboard", d: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10" },
    { label: "Orders", path: "/order-management", d: "M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M8 12h8" },
    { label: "Products", path: "/products", d: "M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
    { label: "Staff", path: "/add-staff", d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" },
    { label: "Suppliers", path: "/supplier-management", d: "M3 3h18v4H3zM3 11h18v4H3zM3 19h18v4H3z" },
    { label: "Attendance", path: "/attendance", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { label: "Messages", path: "/owner-messages", d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
    { label: "Reviews", path: "/owner-reviews", d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
    { label: "Profile", path: profilePath, d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
  ] : [
    { label: "Dashboard", path: "/staff-dashboard", d: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10" },
    { label: "Orders", path: "/order-management", d: "M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M8 12h8" },
    { label: "Products", path: "/products", d: "M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
    { label: "Profile", path: profilePath, d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
  ];

  return (
    <div className="od-shell">
      <aside className="od-sidebar">
        <div className="od-sidebar__brand">
          <div className="od-sidebar__logo">
            <span className="od-sidebar__logo-icon">K</span>
            <span className="od-sidebar__logo-text">SmartKhata</span>
          </div>
        </div>
        <nav className="od-sidebar__nav">
          {sideLinks.map(link => (
            <button key={link.path}
              className={`od-sidebar__link ${location.pathname === link.path ? "od-sidebar__link--active" : ""}`}
              onClick={() => navigate(link.path)}>
              <span className="od-sidebar__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={link.d}/></svg>
              </span>
              <span className="od-sidebar__label">{link.label}</span>
            </button>
          ))}
        </nav>
        <div className="od-sidebar__footer">
          <div className="od-sidebar__user" onClick={() => navigate(profilePath)}>
            <div className="od-sidebar__avatar">
              {owner?.profileImage ? <img src={imgUrl(owner.profileImage)} alt="avatar"/> : <span>{(owner?.username||"U")[0].toUpperCase()}</span>}
            </div>
            <div>
              <div className="od-sidebar__user-name">{owner?.username||"User"}</div>
              <div className="od-sidebar__user-role" style={{textTransform:"capitalize"}}>{owner?.role||"staff"}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="od-main">
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">Products</h1>
            <div className="od-topbar__date">{products.length} items</div>
          </div>
          <div className="od-topbar__right">
            <div className="od-topbar__profile" onClick={() => navigate(profilePath)}>
              <div className="od-topbar__avatar">
                {owner?.profileImage ? <img src={imgUrl(owner.profileImage)} alt="avatar"/> : <span>{(owner?.username||"U")[0].toUpperCase()}</span>}
              </div>
            </div>
            <button className="od-topbar__logout" onClick={handleLogout} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          </div>
        </header>

        {/* ---- CONTENT ---- */}
        <main className="od-content">
          
          {/* Page Head */}
          <div className="pm-page-head">
            <div>
              <h2 className="pm-page-head__title">Inventory</h2>
              <p className="pm-page-head__sub">Manage and update your product catalog</p>
            </div>
            <div className="pm-page-head__actions">
              <button className="pm-btn-ghost" onClick={() => setScannerOpen(true)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4M21 9V5a2 2 0 00-2-2h-4M21 15v4a2 2 0 01-2 2h-4M9 12h6"/></svg>
                Scan QR
              </button>
              <button className="pm-btn-primary" onClick={() => setShowAddForm(true)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                Add Product
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="om-stat-row">
            {[
              { label:"Total",       val: products.length,                                              color:"#6366f1", icon:"M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
              { label:"In Stock",    val: products.filter(p=>!p.deleted&&p.quantity>5).length,          color:"#10b981", icon:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label:"Low Stock",   val: lowStockCount,                                                color:"#f59e0b", icon:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label:"Out of Stock",val: outOfStockCount,                                              color:"#ef4444", icon:"M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
            ].map(c=>(
              <div key={c.label} className="om-stat-card" style={{"--card-color":c.color}}>
                <div className="om-stat-card__icon" style={{background:c.color+"18",color:c.color}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon}/></svg>
                </div>
                <div>
                  <div className="om-stat-card__label">{c.label}</div>
                  <div className="om-stat-card__value">{c.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 3. Ledger Filter Row */}
          <div className="si-filter-row">
            <div className="si-filters-left">
              <div className="si-search-input-wrap">
                <input
                  type="text"
                  placeholder="Search products..."
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
                {CATEGORY_LIST.map(c => <option key={c}>{c}</option>)}
              </select>
              <select 
                className="si-ledger-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">Status: All</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
            <div className="si-filters-right">
               <span style={{ fontSize: '12px', fontWeight: 600 }}>{filteredProducts.length} Results</span>
            </div>
          </div>

          {/* 4. The Ledger Table */}
          <div className="si-ledger-table-wrap">
            <div style={{ overflowX: "auto" }}>
              <table className="si-ledger-table">
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
                {currentItems.length > 0 ? (
                  currentItems.map((p) => {
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
                          <div className="si-status-wrap">
                            <span className={`si-dot ${isOutOfStock ? 'si-dot--red' : isLowStock ? 'si-dot--orange' : 'si-dot--green'}`}></span>
                            <span className="si-status-text">
                              {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock"}
                            </span>
                          </div>
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
                            <button className="si-btn si-btn--edit" onClick={() => handleEditClick(p)} style={{ width: '60px', background: '#026bf4', color: '#ffffffff' }}>Edit</button>
                            <button className="si-btn si-btn--delete" onClick={() => handleDeleteProduct(p._id)} style={{ width: '60px', background: '#e90a19', color: '#ffffffff' }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          </div>

          {/* 5. Pagination */}
          {totalPages > 1 && (
            <div className="si-pagination">
              <button 
                className="si-page-btn" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i + 1} 
                  className={`si-page-btn ${currentPage === i + 1 ? "active" : ""}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                className="si-page-btn" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          )}

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
                  <label>Selling Price *</label>
                  <input type="number" placeholder="Selling Price" value={productPrice}
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
                  <label>Selling Price *</label>
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

      {toast.visible && <div className={`od-toast od-toast--${toast.type}`}>{toast.message}</div>}
    </div>
  );
};

export default ProductManagement;
