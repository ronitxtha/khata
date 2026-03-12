import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/supplierManagement.css";

const API_BASE = "http://localhost:8000";

const SupplierManagement = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    totalPurchases: 0,
    totalAmountPaid: 0,
    totalOutstandingDue: 0,
  });
  const [products, setProducts] = useState([]);

  // UI states
  const [activeTab, setActiveTab] = useState("suppliers"); // suppliers | purchases | payments
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showEditSupplier, setShowEditSupplier] = useState(false);
  const [showViewSupplier, setShowViewSupplier] = useState(false);
  const [showRecordPurchase, setShowRecordPurchase] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Form states
  const [supplierForm, setSupplierForm] = useState({
    supplierName: "",
    companyName: "",
    phone: "",
    email: "",
    address: "",
    productsSupplied: "",
  });

  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: "",
    productId: "",
    productName: "",
    quantity: "",
    costPrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  const [paymentForm, setPaymentForm] = useState({
    supplierId: "",
    amountPaid: "",
    paymentMethod: "Cash",
    paymentDate: new Date().toISOString().split("T")[0],
    note: "",
  });

  const navLinks = [
    { label: "Dashboard", icon: "🏠", path: "/owner-dashboard" },
    { label: "Product Management", icon: "📦", path: "/products" },
    { label: "Orders", icon: "🛒", path: "/order-management" },
    { label: "Staff Management", icon: "👥", path: "/add-staff" },
    { label: "Supplier Management", icon: "🏭", path: "/supplier-management" },
    { label: "Attendance", icon: "📅", path: "/attendance" },
    { label: "Profile", icon: "👤", path: "/owner-profile" },
  ];

  // ─── Auth header ────────────────────────────────────────────────
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });

  // ─── Toast ───────────────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  };

  // ─── Fetch all data ──────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, purRes, payRes, statsRes, prodRes] = await Promise.all([
        axios.get(`${API_BASE}/api/suppliers`, authHeaders()),
        axios.get(`${API_BASE}/api/suppliers/purchases`, authHeaders()),
        axios.get(`${API_BASE}/api/suppliers/payments`, authHeaders()),
        axios.get(`${API_BASE}/api/suppliers/stats`, authHeaders()),
        axios.get(`${API_BASE}/api/owner/products`, authHeaders()),
      ]);
      setSuppliers(sRes.data.suppliers || []);
      setPurchases(purRes.data.purchases || []);
      setPayments(payRes.data.payments || []);
      setStats(statsRes.data.stats || {});
      setProducts(prodRes.data.products || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ─── Logout ──────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ─── Add Supplier ────────────────────────────────────────────────
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/suppliers/add`, supplierForm, authHeaders());
      showToast("Supplier added successfully!");
      setShowAddSupplier(false);
      setSupplierForm({ supplierName: "", companyName: "", phone: "", email: "", address: "", productsSupplied: "" });
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add supplier", "error");
    }
  };

  // ─── Edit Supplier ───────────────────────────────────────────────
  const openEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierForm({
      supplierName: supplier.supplierName,
      companyName: supplier.companyName,
      phone: supplier.phone,
      email: supplier.email || "",
      address: supplier.address || "",
      productsSupplied: supplier.productsSupplied || "",
    });
    setShowEditSupplier(true);
  };

  const handleEditSupplier = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE}/api/suppliers/${selectedSupplier._id}`, supplierForm, authHeaders());
      showToast("Supplier updated successfully!");
      setShowEditSupplier(false);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update supplier", "error");
    }
  };

  // ─── Delete Supplier ─────────────────────────────────────────────
  const handleDeleteSupplier = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await axios.delete(`${API_BASE}/api/suppliers/${id}`, authHeaders());
      showToast("Supplier deleted.");
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete supplier", "error");
    }
  };

  // ─── Record Purchase ─────────────────────────────────────────────
  const handleRecordPurchase = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/suppliers/purchase`, purchaseForm, authHeaders());
      showToast("Purchase recorded & inventory updated!");
      setShowRecordPurchase(false);
      setPurchaseForm({ supplierId: "", productId: "", productName: "", quantity: "", costPrice: "", purchaseDate: new Date().toISOString().split("T")[0] });
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to record purchase", "error");
    }
  };

  // ─── Record Payment ──────────────────────────────────────────────
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/suppliers/payment`, paymentForm, authHeaders());
      showToast("Payment recorded successfully!");
      setShowRecordPayment(false);
      setPaymentForm({ supplierId: "", amountPaid: "", paymentMethod: "Cash", paymentDate: new Date().toISOString().split("T")[0], note: "" });
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to record payment", "error");
    }
  };

  // ─── When product is selected for purchase, auto-fill name ───────
  const handleProductSelect = (productId) => {
    const product = products.find((p) => p._id === productId);
    setPurchaseForm((f) => ({
      ...f,
      productId,
      productName: product ? product.name : f.productName,
    }));
  };

  // ─── Filtered suppliers ──────────────────────────────────────────
  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.supplierName?.toLowerCase().includes(q) ||
      s.companyName?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.productsSupplied?.toLowerCase().includes(q)
    );
  });

  const outstandingSuppliers = suppliers.filter((s) => s.totalDue > 0);

  const fmt = (n) =>
    `NPR ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="sd-layout">
      {/* ───────── SIDEBAR ───────── */}
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

      {/* ───────── MAIN ───────── */}
      <div className={`sd-main ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        {/* Navbar */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div className="sd-navbar__title">
              <h1>Supplier Management</h1>
              <span className="sd-navbar__subtitle">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>
          <div className="sd-navbar__right">
            <button className="sm-btn sm-btn--primary" onClick={() => setShowAddSupplier(true)}>
              + Add Supplier
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="sd-content">
          {/* ── SUMMARY CARDS ── */}
          <div className="sd-cards">
            <div className="sd-card sd-card--blue">
              <div className="sd-card__icon">🏭</div>
              <div className="sd-card__body">
                <span className="sd-card__num">{stats.totalSuppliers || 0}</span>
                <span className="sd-card__label">Total Suppliers</span>
              </div>
            </div>
            <div className="sd-card sd-card--green">
              <div className="sd-card__icon">🛒</div>
              <div className="sd-card__body">
                <span className="sd-card__num sm-card-amount">{fmt(stats.totalPurchases)}</span>
                <span className="sd-card__label">Total Purchases</span>
              </div>
            </div>
            <div className="sd-card sd-card--purple">
              <div className="sd-card__icon">💰</div>
              <div className="sd-card__body">
                <span className="sd-card__num sm-card-amount">{fmt(stats.totalAmountPaid)}</span>
                <span className="sd-card__label">Total Amount Paid</span>
              </div>
            </div>
            <div className="sd-card sd-card--orange">
              <div className="sd-card__icon">⚠️</div>
              <div className="sd-card__body">
                <span className="sd-card__num sm-card-amount">{fmt(stats.totalOutstandingDue)}</span>
                <span className="sd-card__label">Outstanding Due</span>
              </div>
            </div>
          </div>

          {/* ── OUTSTANDING ALERT ── */}
          {outstandingSuppliers.length > 0 && (
            <div className="sm-alert-card">
              <div className="sm-alert-card__header">
                <span className="sm-alert-card__icon">⚠️</span>
                <h3>Outstanding Balances ({outstandingSuppliers.length} supplier{outstandingSuppliers.length > 1 ? "s" : ""})</h3>
              </div>
              <div className="sm-alert-items">
                {outstandingSuppliers.map((s) => (
                  <div key={s._id} className="sm-alert-item">
                    <div>
                      <p className="sm-alert-item__name">{s.supplierName}</p>
                      <p className="sm-alert-item__company">{s.companyName}</p>
                    </div>
                    <span className="sm-alert-item__due">{fmt(s.totalDue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TABS ── */}
          <div className="sm-tabs">
            {["suppliers", "purchases", "payments"].map((tab) => (
              <button
                key={tab}
                className={`sm-tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "suppliers" && "🏭 Suppliers"}
                {tab === "purchases" && "📋 Purchase Records"}
                {tab === "payments" && "💳 Payment History"}
              </button>
            ))}
          </div>

          {/* ───────── TAB: SUPPLIERS ───────── */}
          {activeTab === "suppliers" && (
            <div className="sd-panel">
              <div className="sd-panel__header">
                <h3>Supplier List</h3>
                <div className="sm-search-wrap">
                  <input
                    className="sm-search"
                    placeholder="🔍 Search suppliers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              {loading ? (
                <div className="sm-loading">Loading...</div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="sm-empty-state">
                  <span>🏭</span>
                  <p>No suppliers found. Add your first supplier!</p>
                </div>
              ) : (
                <div className="sm-table-wrap">
                  <table className="sm-table">
                    <thead>
                      <tr>
                        <th>Supplier Name</th>
                        <th>Company</th>
                        <th>Phone</th>
                        <th>Products Supplied</th>
                        <th>Total Purchases</th>
                        <th>Amount Paid</th>
                        <th>Amount Due</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSuppliers.map((s) => (
                        <tr key={s._id}>
                          <td className="sm-table__name">{s.supplierName}</td>
                          <td>{s.companyName}</td>
                          <td>{s.phone}</td>
                          <td className="sm-table__products">{s.productsSupplied || "—"}</td>
                          <td>{fmt(s.totalPurchases)}</td>
                          <td className="sm-table__paid">{fmt(s.totalPaid)}</td>
                          <td>
                            <span className={`sm-due-badge ${s.totalDue > 0 ? "sm-due-badge--danger" : "sm-due-badge--ok"}`}>
                              {fmt(s.totalDue)}
                            </span>
                          </td>
                          <td>
                            <div className="sm-actions">
                              <button
                                className="sm-action-btn sm-action-btn--view"
                                onClick={() => { setSelectedSupplier(s); setShowViewSupplier(true); }}
                                title="View"
                              >👁</button>
                              <button
                                className="sm-action-btn sm-action-btn--edit"
                                onClick={() => openEditSupplier(s)}
                                title="Edit"
                              >✏️</button>
                              <button
                                className="sm-action-btn sm-action-btn--delete"
                                onClick={() => handleDeleteSupplier(s._id)}
                                title="Delete"
                              >🗑</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ───────── TAB: PURCHASES ───────── */}
          {activeTab === "purchases" && (
            <div className="sd-panel">
              <div className="sd-panel__header">
                <h3>Purchase Records</h3>
                <button className="sm-btn sm-btn--primary" onClick={() => setShowRecordPurchase(true)}>
                  + Record Purchase
                </button>
              </div>
              {purchases.length === 0 ? (
                <div className="sm-empty-state">
                  <span>📋</span>
                  <p>No purchases recorded yet.</p>
                </div>
              ) : (
                <div className="sm-table-wrap">
                  <table className="sm-table">
                    <thead>
                      <tr>
                        <th>Supplier Name</th>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Cost Price</th>
                        <th>Total Cost</th>
                        <th>Purchase Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((p) => (
                        <tr key={p._id}>
                          <td className="sm-table__name">{p.supplierName}</td>
                          <td>{p.productName}</td>
                          <td>{p.quantity}</td>
                          <td>{fmt(p.costPrice)}</td>
                          <td className="sm-table__total">{fmt(p.totalCost)}</td>
                          <td>{new Date(p.purchaseDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ───────── TAB: PAYMENTS ───────── */}
          {activeTab === "payments" && (
            <div className="sd-panel">
              <div className="sd-panel__header">
                <h3>Payment History</h3>
                <button className="sm-btn sm-btn--primary" onClick={() => setShowRecordPayment(true)}>
                  + Record Payment
                </button>
              </div>
              {payments.length === 0 ? (
                <div className="sm-empty-state">
                  <span>💳</span>
                  <p>No payments recorded yet.</p>
                </div>
              ) : (
                <div className="sm-table-wrap">
                  <table className="sm-table">
                    <thead>
                      <tr>
                        <th>Supplier Name</th>
                        <th>Amount Paid</th>
                        <th>Payment Method</th>
                        <th>Payment Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p._id}>
                          <td className="sm-table__name">{p.supplierName}</td>
                          <td className="sm-table__paid">{fmt(p.amountPaid)}</td>
                          <td>
                            <span className="sm-method-badge">{p.paymentMethod}</span>
                          </td>
                          <td>{new Date(p.paymentDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ─────────────── MODALS ─────────────── */}

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="sm-modal-overlay" onClick={() => setShowAddSupplier(false)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal__header">
              <h2>Add New Supplier</h2>
              <button className="sm-modal__close" onClick={() => setShowAddSupplier(false)}>✕</button>
            </div>
            <form className="sm-form" onSubmit={handleAddSupplier}>
              <div className="sm-form__grid">
                <div className="sm-form__group">
                  <label>Supplier Name *</label>
                  <input required value={supplierForm.supplierName} onChange={(e) => setSupplierForm({ ...supplierForm, supplierName: e.target.value })} placeholder="Full name" />
                </div>
                <div className="sm-form__group">
                  <label>Company Name *</label>
                  <input required value={supplierForm.companyName} onChange={(e) => setSupplierForm({ ...supplierForm, companyName: e.target.value })} placeholder="Company name" />
                </div>
                <div className="sm-form__group">
                  <label>Phone Number *</label>
                  <input required value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} placeholder="+977-XXXXXXXXXX" />
                </div>
                <div className="sm-form__group">
                  <label>Email</label>
                  <input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} placeholder="supplier@email.com" />
                </div>
                <div className="sm-form__group sm-form__group--full">
                  <label>Address</label>
                  <input value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} placeholder="Full address" />
                </div>
                <div className="sm-form__group">
                  <label>Products Supplied</label>
                  <input value={supplierForm.productsSupplied} onChange={(e) => setSupplierForm({ ...supplierForm, productsSupplied: e.target.value })} placeholder="e.g. Electronics, Clothing" />
                </div>
              </div>
              <div className="sm-form__actions">
                <button type="button" className="sm-btn sm-btn--ghost" onClick={() => setShowAddSupplier(false)}>Cancel</button>
                <button type="submit" className="sm-btn sm-btn--primary">Add Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditSupplier && (
        <div className="sm-modal-overlay" onClick={() => setShowEditSupplier(false)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal__header">
              <h2>Edit Supplier</h2>
              <button className="sm-modal__close" onClick={() => setShowEditSupplier(false)}>✕</button>
            </div>
            <form className="sm-form" onSubmit={handleEditSupplier}>
              <div className="sm-form__grid">
                <div className="sm-form__group">
                  <label>Supplier Name *</label>
                  <input required value={supplierForm.supplierName} onChange={(e) => setSupplierForm({ ...supplierForm, supplierName: e.target.value })} />
                </div>
                <div className="sm-form__group">
                  <label>Company Name *</label>
                  <input required value={supplierForm.companyName} onChange={(e) => setSupplierForm({ ...supplierForm, companyName: e.target.value })} />
                </div>
                <div className="sm-form__group">
                  <label>Phone Number *</label>
                  <input required value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
                </div>
                <div className="sm-form__group">
                  <label>Email</label>
                  <input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} />
                </div>
                <div className="sm-form__group sm-form__group--full">
                  <label>Address</label>
                  <input value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
                </div>
                <div className="sm-form__group">
                  <label>Products Supplied</label>
                  <input value={supplierForm.productsSupplied} onChange={(e) => setSupplierForm({ ...supplierForm, productsSupplied: e.target.value })} />
                </div>
              </div>
              <div className="sm-form__actions">
                <button type="button" className="sm-btn sm-btn--ghost" onClick={() => setShowEditSupplier(false)}>Cancel</button>
                <button type="submit" className="sm-btn sm-btn--primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Supplier Modal */}
      {showViewSupplier && selectedSupplier && (
        <div className="sm-modal-overlay" onClick={() => setShowViewSupplier(false)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal__header">
              <h2>Supplier Details</h2>
              <button className="sm-modal__close" onClick={() => setShowViewSupplier(false)}>✕</button>
            </div>
            <div className="sm-view-grid">
              <div className="sm-view-item">
                <label>Supplier Name</label>
                <p>{selectedSupplier.supplierName}</p>
              </div>
              <div className="sm-view-item">
                <label>Company</label>
                <p>{selectedSupplier.companyName}</p>
              </div>
              <div className="sm-view-item">
                <label>Phone</label>
                <p>{selectedSupplier.phone}</p>
              </div>
              <div className="sm-view-item">
                <label>Email</label>
                <p>{selectedSupplier.email || "—"}</p>
              </div>
              <div className="sm-view-item sm-view-item--full">
                <label>Address</label>
                <p>{selectedSupplier.address || "—"}</p>
              </div>
              <div className="sm-view-item">
                <label>Products Supplied</label>
                <p>{selectedSupplier.productsSupplied || "—"}</p>
              </div>
              <div className="sm-view-item">
                <label>Total Purchases</label>
                <p className="sm-view-item__value">{fmt(selectedSupplier.totalPurchases)}</p>
              </div>
              <div className="sm-view-item">
                <label>Amount Paid</label>
                <p className="sm-view-item__value sm-view-item__value--green">{fmt(selectedSupplier.totalPaid)}</p>
              </div>
              <div className="sm-view-item">
                <label>Outstanding Due</label>
                <p className={`sm-view-item__value ${selectedSupplier.totalDue > 0 ? "sm-view-item__value--red" : "sm-view-item__value--green"}`}>
                  {fmt(selectedSupplier.totalDue)}
                </p>
              </div>
            </div>
            <div className="sm-form__actions">
              <button className="sm-btn sm-btn--ghost" onClick={() => setShowViewSupplier(false)}>Close</button>
              <button className="sm-btn sm-btn--primary" onClick={() => { setShowViewSupplier(false); openEditSupplier(selectedSupplier); }}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Purchase Modal */}
      {showRecordPurchase && (
        <div className="sm-modal-overlay" onClick={() => setShowRecordPurchase(false)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal__header">
              <h2>📋 Record Purchase</h2>
              <button className="sm-modal__close" onClick={() => setShowRecordPurchase(false)}>✕</button>
            </div>
            <form className="sm-form" onSubmit={handleRecordPurchase}>
              <div className="sm-form__grid">
                <div className="sm-form__group sm-form__group--full">
                  <label>Supplier *</label>
                  <select required value={purchaseForm.supplierId} onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}>
                    <option value="">Select supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>{s.supplierName} – {s.companyName}</option>
                    ))}
                  </select>
                </div>
                <div className="sm-form__group sm-form__group--full">
                  <label>Link to Inventory Product (Optional)</label>
                  <select value={purchaseForm.productId} onChange={(e) => handleProductSelect(e.target.value)}>
                    <option value="">Select product to update stock...</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>{p.name} (Qty: {p.quantity})</option>
                    ))}
                  </select>
                </div>
                <div className="sm-form__group sm-form__group--full">
                  <label>Product Name *</label>
                  <input required value={purchaseForm.productName} onChange={(e) => setPurchaseForm({ ...purchaseForm, productName: e.target.value })} placeholder="Product name" />
                </div>
                <div className="sm-form__group">
                  <label>Quantity *</label>
                  <input required type="number" min="1" value={purchaseForm.quantity} onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} placeholder="0" />
                </div>
                <div className="sm-form__group">
                  <label>Cost Price (per unit) *</label>
                  <input required type="number" min="0" step="0.01" value={purchaseForm.costPrice} onChange={(e) => setPurchaseForm({ ...purchaseForm, costPrice: e.target.value })} placeholder="0.00" />
                </div>
                {purchaseForm.quantity && purchaseForm.costPrice && (
                  <div className="sm-form__group sm-form__group--full sm-total-preview">
                    <span>Total Cost: </span>
                    <strong>{fmt(Number(purchaseForm.quantity) * Number(purchaseForm.costPrice))}</strong>
                  </div>
                )}
                <div className="sm-form__group">
                  <label>Purchase Date</label>
                  <input type="date" value={purchaseForm.purchaseDate} onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })} />
                </div>
              </div>
              <div className="sm-form__actions">
                <button type="button" className="sm-btn sm-btn--ghost" onClick={() => setShowRecordPurchase(false)}>Cancel</button>
                <button type="submit" className="sm-btn sm-btn--primary">Record Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordPayment && (
        <div className="sm-modal-overlay" onClick={() => setShowRecordPayment(false)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal__header">
              <h2>💳 Record Payment</h2>
              <button className="sm-modal__close" onClick={() => setShowRecordPayment(false)}>✕</button>
            </div>
            <form className="sm-form" onSubmit={handleRecordPayment}>
              <div className="sm-form__grid">
                <div className="sm-form__group sm-form__group--full">
                  <label>Supplier *</label>
                  <select required value={paymentForm.supplierId} onChange={(e) => setPaymentForm({ ...paymentForm, supplierId: e.target.value })}>
                    <option value="">Select supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>{s.supplierName} – Due: {fmt(s.totalDue)}</option>
                    ))}
                  </select>
                </div>
                <div className="sm-form__group">
                  <label>Amount Paid *</label>
                  <input required type="number" min="0.01" step="0.01" value={paymentForm.amountPaid} onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })} placeholder="0.00" />
                </div>
                <div className="sm-form__group">
                  <label>Payment Method</label>
                  <select value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                    <option>Online</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="sm-form__group">
                  <label>Payment Date</label>
                  <input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
                </div>
                <div className="sm-form__group sm-form__group--full">
                  <label>Note (Optional)</label>
                  <input value={paymentForm.note} onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })} placeholder="Add a note..." />
                </div>
              </div>
              <div className="sm-form__actions">
                <button type="button" className="sm-btn sm-btn--ghost" onClick={() => setShowRecordPayment(false)}>Cancel</button>
                <button type="submit" className="sm-btn sm-btn--primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.visible && (
        <div className={`sm-toast sm-toast--${toast.type}`}>
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
