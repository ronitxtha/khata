import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import "../styles/ownerDashboard.css";
import "../styles/supplierManagement.css";

const API_BASE = "http://localhost:8000";

const SupplierManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [owner, setOwner] = useState({});

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
    sellingPrice: "",
    description: "",
    category: "Others",
    purchaseDate: new Date().toISOString().split("T")[0],
  });
  const [purchaseImage, setPurchaseImage] = useState(null);
  const [purchaseImagePreview, setPurchaseImagePreview] = useState(null);

  // Product search state
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductResults, setShowProductResults] = useState(false);

  // Supplier search state
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [showSupplierResults, setShowSupplierResults] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    supplierId: "",
    amountPaid: "",
    paymentMethod: "Cash",
    paymentDate: new Date().toISOString().split("T")[0],
    note: "",
  });

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
      const token = localStorage.getItem("accessToken");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setOwner(user);

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
      const formData = new FormData();
      Object.keys(purchaseForm).forEach((key) => {
        formData.append(key, purchaseForm[key]);
      });
      if (purchaseImage) {
        formData.append("image", purchaseImage);
      }

      await axios.post(`${API_BASE}/api/suppliers/purchase`, formData, {
        headers: {
          ...authHeaders().headers,
          "Content-Type": "multipart/form-data",
        },
      });

      showToast("Purchase recorded & inventory updated!");
      setShowRecordPurchase(false);
      setPurchaseForm({
        supplierId: "",
        productId: "",
        productName: "",
        quantity: "",
        costPrice: "",
        sellingPrice: "",
        description: "",
        category: "Others",
        purchaseDate: new Date().toISOString().split("T")[0],
      });
      setPurchaseImage(null);
      setPurchaseImagePreview(null);
      setProductSearchTerm("");
      setShowProductResults(false);
      setSupplierSearchTerm("");
      setShowSupplierResults(false);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to record purchase", "error");
    }
  };

  // ─── Record Payment ──────────────────────────────────────────────
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const { supplierId, amountPaid } = paymentForm;
    const selected = suppliers.find((s) => s._id === supplierId);
    
    if (selected && Number(amountPaid) > selected.totalDue) {
      showToast(`Amount cannot exceed outstanding due (${selected.totalDue})`, "error");
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/suppliers/payment`, paymentForm, authHeaders());
      showToast("Payment recorded successfully!");
      setShowRecordPayment(false);
      setPaymentForm({ supplierId: "", amountPaid: "", paymentMethod: "Cash", paymentDate: new Date().toISOString().split("T")[0], note: "" });
      setSupplierSearchTerm("");
      setShowSupplierResults(false);
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
      sellingPrice: product ? product.price : "",
      description: product ? product.description : "",
      category: product ? product.category : "Others",
    }));
    setShowProductResults(false);
    setProductSearchTerm(product ? product.name : "");
  };

  const filteredPurchaseProducts = products.filter((p) => {
    if (!productSearchTerm) return false;
    const q = productSearchTerm.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q)
    );
  });

  // ─── Supplier selection logic ────────────────────────────────────
  const handleSupplierSelect = (supplierId, formType) => {
    const supplier = suppliers.find((s) => s._id === supplierId);
    if (formType === "purchase") {
      setPurchaseForm((f) => ({ ...f, supplierId }));
    } else if (formType === "payment") {
      setPaymentForm((f) => ({ ...f, supplierId }));
    }
    setShowSupplierResults(false);
    setSupplierSearchTerm(supplier ? `${supplier.supplierName} (${supplier.companyName})` : "");
  };

  const filteredSearchSuppliers = suppliers.filter((s) => {
    if (!supplierSearchTerm) return false;
    const q = supplierSearchTerm.toLowerCase();
    return (
      (s.supplierName || "").toLowerCase().includes(q) ||
      (s.companyName || "").toLowerCase().includes(q)
    );
  });

  // ─── Filtered suppliers ──────────────────────────────────────────
  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.supplierName || "").toLowerCase().includes(q) ||
      (s.companyName || "").toLowerCase().includes(q) ||
      (s.phone || "").toLowerCase().includes(q) ||
      (s.productsSupplied || "").toLowerCase().includes(q)
    );
  });

  const outstandingSuppliers = suppliers.filter((s) => s.totalDue > 0);

  const fmt = (n) =>
    `NPR ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const sideLinks = [
    { label: "Dashboard", path: "/owner-dashboard", d: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10" },
    { label: "Orders", path: "/order-management", d: "M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M8 12h8" },
    { label: "Products", path: "/products", d: "M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
    { label: "Staff", path: "/add-staff", d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" },
    { label: "Suppliers", path: "/supplier-management", d: "M3 3h18v4H3zM3 11h18v4H3zM3 19h18v4H3z" },
    { label: "Attendance", path: "/attendance", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { label: "Messages", path: "/owner-messages", d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
    { label: "Reviews", path: "/owner-reviews", d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
    { label: "Profile", path: "/owner-profile", d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
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
          <div className="od-sidebar__user" onClick={() => navigate("/owner-profile")}>
            <div className="od-sidebar__avatar">
              {owner?.profileImage ? <img src={imgUrl(owner.profileImage)} alt="avatar"/> : <span>{(owner?.username||"U")[0].toUpperCase()}</span>}
            </div>
            <div>
              <div className="od-sidebar__user-name">{owner?.username||"Owner"}</div>
              <div className="od-sidebar__user-role" style={{textTransform:"capitalize"}}>Owner</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="od-main">
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">Supplier Management</h1>
            <div className="od-topbar__date">{suppliers.length} partners</div>
          </div>
          <div className="od-topbar__right">
            <div className="od-topbar__profile" onClick={() => navigate("/owner-profile")}>
              <div className="od-topbar__avatar">
                {owner?.profileImage ? <img src={imgUrl(owner.profileImage)} alt="avatar"/> : <span>{(owner?.username||"U")[0].toUpperCase()}</span>}
              </div>
            </div>
            <button className="od-topbar__logout" onClick={handleLogout} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          </div>
        </header>

        <main className="od-content" style={{ display: 'block', overflowY: 'auto' }}>
          
          {/* Page Head */}
          <div className="sm-page-head">
            <div>
              <h2 className="sm-page-head__title">Partners & Logistics</h2>
              <p className="sm-page-head__sub">Manage supplier relationships, track purchases, and monitor outstanding dues.</p>
            </div>
            <div className="sm-page-head__actions">
              <button className="sm-btn-ghost" onClick={() => setShowRecordPayment(true)}>
                 Record Payment
              </button>
              <button className="sm-btn-primary" onClick={() => setShowAddSupplier(true)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                Add Supplier
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="om-stat-row">
            {[
              { label:"Total Suppliers",  val: stats.totalSuppliers || 0, color:"#6366f1", icon:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" },
              { label:"Total Purchases",val: fmt(stats.totalPurchases),     color:"#10b981", icon:"M3 3h18v4H3zM3 11h18v4H3zM3 19h18v4H3z" },
              { label:"Amount Paid", val: fmt(stats.totalAmountPaid),      color:"#8b5cf6", icon:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label:"Outstanding Due",   val: fmt(stats.totalOutstandingDue),   color:"#ef4444", icon:"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
            ].map(c=>(
              <div key={c.label} className="om-stat-card" style={{"--card-color":c.color}}>
                <div className="om-stat-card__icon" style={{background:c.color+"18",color:c.color}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon}/></svg>
                </div>
                <div>
                  <div className="om-stat-card__label">{c.label}</div>
                  <div className="om-stat-card__value" style={{color: c.label === "Outstanding Due" ? "#ef4444" : ""}}>{c.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 3. Outstanding Alert Card */}
          {outstandingSuppliers.length > 0 && (
            <div className="sm-alert-card">
              <div className="sm-alert-card__header">
                <h3>Payment Action Required ({outstandingSuppliers.length} Pending)</h3>
              </div>
              <div className="sm-alert-items">
                {outstandingSuppliers.map((s) => (
                  <div key={s._id} className="sm-alert-item">
                    <div>
                      <span className="sm-alert-item__name">{s.supplierName}</span>
                      <span className="sm-alert-item__company">{s.companyName}</span>
                    </div>
                    <span className="sm-alert-item__due">{fmt(s.totalDue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Filter & Tabs Row */}
          <div className="sm-tabs">
            {["suppliers", "purchases", "payments"].map((tab) => (
              <button
                key={tab}
                className={`sm-tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "suppliers" && "Suppliers"}
                {tab === "purchases" && "Purchases"}
                {tab === "payments" && "Payments"}
              </button>
            ))}
          </div>

          {/* 5. Main Panels */}
          {activeTab === "suppliers" && (
            <div className="si-ledger-table-wrap">
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Supplier Directory</h3>
                <div className="sm-search-wrap">
                  <input
                    className="sm-search"
                    placeholder="Search by name, company, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                </div>
              </div>
              <table className="si-ledger-table">
                <thead>
                  <tr>
                    <th>Supplier / Company</th>
                    <th>Contact</th>
                    <th>Products</th>
                    <th>Financials</th>
                    <th>Due Status</th>
                    <th className="action">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No suppliers found.</td></tr>
                  ) : (
                    filteredSuppliers.map((s) => (
                      <tr key={s._id}>
                        <td>
                          <div className="si-ledger-product-info">
                            <span className="si-ledger-name">{s.supplierName}</span>
                            <span className="si-ledger-desc">{s.companyName}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '13px' }}>
                            <div style={{ fontWeight: 600 }}>{s.phone}</div>
                            <div style={{ color: '#64748b' }}>{s.email || "No email"}</div>
                          </div>
                        </td>
                        <td>
                          <span className="si-ledger-tag">{s.productsSupplied || "Others"}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px' }}>
                            <div style={{ color: '#64748b' }}>Purchases: {fmt(s.totalPurchases)}</div>
                            <div style={{ color: '#10b981', fontWeight: 600 }}>Paid: {fmt(s.totalPaid)}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`sm-due-badge ${s.totalDue > 0 ? "sm-due-badge--danger" : "sm-due-badge--ok"}`}>
                            {fmt(s.totalDue)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="sm-actions" style={{ justifyContent: 'flex-end' }}>
                            <button className="sm-action-btn" onClick={() => { setSelectedSupplier(s); setShowViewSupplier(true); }} title="View Details">Details</button>
                            <button className="sm-action-btn" onClick={() => openEditSupplier(s)} title="Edit">Edit</button>
                            <button className="sm-action-btn sm-action-btn--delete" onClick={() => handleDeleteSupplier(s._id)} title="Delete">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "purchases" && (
            <div className="si-ledger-table-wrap">
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Purchases</h3>
                <button className="si-btn-primary si-btn-primary--dark" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={() => setShowRecordPurchase(true)}>
                  + Record Purchase
                </button>
              </div>
              <table className="si-ledger-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Supplier</th>
                    <th>Quantity</th>
                    <th>Price Details</th>
                    <th>Purchase Date</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No purchases recorded.</td></tr>
                  ) : (
                    purchases.map((p) => (
                      <tr key={p._id}>
                        <td className="sm-table__name">{p.productName}</td>
                        <td style={{ color: '#64748b' }}>{p.supplierName}</td>
                        <td style={{ fontWeight: 600 }}>{p.quantity} units</td>
                        <td>
                          <div style={{ fontSize: '12px' }}>
                            <div>CP: {fmt(p.costPrice)}</div>
                            <div className="sm-table__total">Total: {fmt(p.totalCost)}</div>
                          </div>
                        </td>
                        <td>{new Date(p.purchaseDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="si-ledger-table-wrap">
               <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Payment History</h3>
                <button className="si-btn-primary si-btn-primary--dark" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={() => setShowRecordPayment(true)}>
                  + Record Payment
                </button>
              </div>
              <table className="si-ledger-table">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Amount Paid</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No payments recorded.</td></tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p._id}>
                        <td className="sm-table__name">{p.supplierName}</td>
                        <td className="sm-table__paid">{fmt(p.amountPaid)}</td>
                        <td>
                          <span className="sm-method-badge">{p.paymentMethod}</span>
                        </td>
                        <td>{new Date(p.paymentDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td>
                        <td style={{ color: '#94a3b8', fontSize: '12px' }}>{p.note || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* ─────────────── MODALS ─────────────── */}

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="si-modal-overlay" onClick={() => setShowAddSupplier(false)}>
          <div className="si-modal" onClick={(e) => e.stopPropagation()}>
            <div className="si-modal__header">
              <h2>➕ Add New Supplier</h2>
              <button className="si-modal__close" onClick={() => setShowAddSupplier(false)}>✕</button>
            </div>
            <form className="si-form" onSubmit={handleAddSupplier}>
              <div className="si-form__grid">
                <div className="si-form__group">
                  <label>Supplier Name *</label>
                  <input required value={supplierForm.supplierName} onChange={(e) => setSupplierForm({ ...supplierForm, supplierName: e.target.value })} placeholder="Full name" />
                </div>
                <div className="si-form__group">
                  <label>Company Name *</label>
                  <input required value={supplierForm.companyName} onChange={(e) => setSupplierForm({ ...supplierForm, companyName: e.target.value })} placeholder="Company name" />
                </div>
                <div className="si-form__group">
                  <label>Phone Number *</label>
                  <input required value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} placeholder="+977-XXXXXXXXXX" />
                </div>
                <div className="si-form__group">
                  <label>Email</label>
                  <input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} placeholder="supplier@email.com" />
                </div>
              </div>
              <div className="si-form__group" style={{ marginTop: '16px' }}>
                <label>Address</label>
                <input value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} placeholder="Full address" />
              </div>
              <div className="si-form__group" style={{ marginTop: '16px' }}>
                <label>Products Supplied</label>
                <input value={supplierForm.productsSupplied} onChange={(e) => setSupplierForm({ ...supplierForm, productsSupplied: e.target.value })} placeholder="e.g. Electronics, Clothing" />
              </div>
              <div className="si-form__actions">
                <button type="button" className="si-btn-cancel" onClick={() => setShowAddSupplier(false)}>Cancel</button>
                <button type="submit" className="si-btn-submit">Add Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditSupplier && (
        <div className="si-modal-overlay" onClick={() => setShowEditSupplier(false)}>
          <div className="si-modal" onClick={(e) => e.stopPropagation()}>
            <div className="si-modal__header">
              <h2>✏️ Edit Supplier</h2>
              <button className="si-modal__close" onClick={() => setShowEditSupplier(false)}>✕</button>
            </div>
            <form className="si-form" onSubmit={handleEditSupplier}>
              <div className="si-form__grid">
                <div className="si-form__group">
                  <label>Supplier Name *</label>
                  <input required value={supplierForm.supplierName} onChange={(e) => setSupplierForm({ ...supplierForm, supplierName: e.target.value })} />
                </div>
                <div className="si-form__group">
                  <label>Company Name *</label>
                  <input required value={supplierForm.companyName} onChange={(e) => setSupplierForm({ ...supplierForm, companyName: e.target.value })} />
                </div>
                <div className="si-form__group">
                  <label>Phone Number *</label>
                  <input required value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
                </div>
                <div className="si-form__group">
                  <label>Email</label>
                  <input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} />
                </div>
              </div>
              <div className="si-form__group" style={{ marginTop: '16px' }}>
                <label>Address</label>
                <input value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
              </div>
              <div className="si-form__group" style={{ marginTop: '16px' }}>
                <label>Products Supplied</label>
                <input value={supplierForm.productsSupplied} onChange={(e) => setSupplierForm({ ...supplierForm, productsSupplied: e.target.value })} />
              </div>
              <div className="si-form__actions">
                <button type="button" className="si-btn-cancel" onClick={() => setShowEditSupplier(false)}>Cancel</button>
                <button type="submit" className="si-btn-submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Supplier Modal */}
      {showViewSupplier && selectedSupplier && (
        <div className="si-modal-overlay" onClick={() => setShowViewSupplier(false)}>
          <div className="si-modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="si-modal__header">
              <h2>🏢 Supplier Profile</h2>
              <button className="si-modal__close" onClick={() => setShowViewSupplier(false)}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
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
                <div className="sm-view-item" style={{ gridColumn: 'span 2' }}>
                  <label>Address</label>
                  <p>{selectedSupplier.address || "—"}</p>
                </div>
                <div className="sm-view-item">
                  <label>Total Purchases</label>
                  <p>{fmt(selectedSupplier.totalPurchases)}</p>
                </div>
                <div className="sm-view-item">
                  <label>Outstanding Due</label>
                  <p className={selectedSupplier.totalDue > 0 ? "sm-view-item__value--red" : "sm-view-item__value--green"} style={{ fontWeight: 800 }}>
                    {fmt(selectedSupplier.totalDue)}
                  </p>
                </div>
              </div>
              <div className="si-form__actions" style={{ marginTop: '24px' }}>
                <button className="si-btn-cancel" style={{ width: '100%' }} onClick={() => setShowViewSupplier(false)}>Close</button>
                <button className="si-btn-submit" style={{ width: '100%' }} onClick={() => { setShowViewSupplier(false); openEditSupplier(selectedSupplier); }}>Edit Details</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Purchase Modal */}
      {showRecordPurchase && (
        <div className="si-modal-overlay" onClick={() => setShowRecordPurchase(false)}>
          <div className="si-modal" onClick={(e) => e.stopPropagation()}>
            <div className="si-modal__header">
              <h2>📦 Record Purchase</h2>
              <button className="si-modal__close" onClick={() => setShowRecordPurchase(false)}>✕</button>
            </div>
            <form className="si-form" onSubmit={handleRecordPurchase}>
              <div className="sm-product-search-container" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Search Supplier *</label>
                  <div className="sm-product-search-input-group">
                    <input 
                      type="text" 
                      placeholder="Type supplier name or company..." 
                      value={supplierSearchTerm}
                      onChange={(e) => {
                        setSupplierSearchTerm(e.target.value);
                        setShowSupplierResults(true);
                      }}
                      onFocus={() => setShowSupplierResults(true)}
                      className="si-ledger-select"
                      style={{ flex: 1, width: '100%' }}
                      required={!purchaseForm.supplierId}
                    />
                  </div>
                  
                  {showSupplierResults && (
                    <div className="sm-product-results">
                      {filteredSearchSuppliers.length > 0 ? (
                        filteredSearchSuppliers.map((s) => (
                          <div 
                            key={s._id} 
                            className="sm-product-result-item"
                            onClick={() => handleSupplierSelect(s._id, "purchase")}
                          >
                            <div>
                                <span className="sm-product-result-name">{s.supplierName}</span>
                                <span className="sm-product-result-cat">{s.companyName}</span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '11px', color: s.totalDue > 0 ? '#ef4444' : '#10b981' }}>Due: {fmt(s.totalDue)}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No suppliers found</div>
                      )}
                    </div>
                  )}
                  {purchaseForm.supplierId && (
                    <div className="sm-selected-product">
                      <span>Landed from: <strong>{suppliers.find(s => s._id === purchaseForm.supplierId)?.supplierName}</strong></span>
                      <span className="sm-clear-link" onClick={() => {
                        setPurchaseForm({...purchaseForm, supplierId: ""});
                        setSupplierSearchTerm("");
                      }}>Clear</span>
                    </div>
                  )}
                </div>

                <div className="sm-product-search-container" style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Link to Product (Optional)</label>
                  <div className="sm-product-search-input-group">
                    <input 
                      type="text" 
                      placeholder="Search existing inventory..." 
                      value={productSearchTerm}
                      onChange={(e) => {
                        setProductSearchTerm(e.target.value);
                        setShowProductResults(true);
                      }}
                      onFocus={() => setShowProductResults(true)}
                      className="si-ledger-select"
                      style={{ flex: 1, width: '100%' }}
                    />
                  </div>
                  
                  {showProductResults && (
                    <div className="sm-product-results">
                      {filteredPurchaseProducts.length > 0 ? (
                        filteredPurchaseProducts.map((p) => (
                          <div 
                            key={p._id} 
                            className="sm-product-result-item"
                            onClick={() => handleProductSelect(p._id)}
                          >
                            <div>
                                <span className="sm-product-result-name">{p.name}</span>
                                <span className="sm-product-result-cat">{p.category}</span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#3b82f6' }}>In Stock: {p.quantity}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No products found</div>
                      )}
                    </div>
                  )}
                  {purchaseForm.productId && (
                    <div className="sm-selected-product">
                      <span>Linking to: <strong>{products.find(p => p._id === purchaseForm.productId)?.name}</strong></span>
                      <span className="sm-clear-link" onClick={() => {
                        setPurchaseForm({...purchaseForm, productId: ""});
                        setProductSearchTerm("");
                      }}>Clear</span>
                    </div>
                  )}
                </div>

              <div className="si-form__grid">
                <div className="si-form__group" style={{ gridColumn: 'span 2' }}>
                  <label>Product Name *</label>
                  <input required value={purchaseForm.productName} onChange={(e) => setPurchaseForm({ ...purchaseForm, productName: e.target.value })} placeholder="Enter item name" />
                </div>
                <div className="si-form__group">
                  <label>Quantity *</label>
                  <input required type="number" min="1" value={purchaseForm.quantity} onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} placeholder="0" />
                </div>
                <div className="si-form__group">
                  <label>Cost Price (unit) *</label>
                  <input required type="number" min="0" step="0.01" value={purchaseForm.costPrice} onChange={(e) => setPurchaseForm({ ...purchaseForm, costPrice: e.target.value })} placeholder="0.00" />
                </div>
                <div className="si-form__group">
                    <label>Selling Price (unit) *</label>
                    <input required type="number" min="0" step="0.01" value={purchaseForm.sellingPrice} onChange={(e) => setPurchaseForm({ ...purchaseForm, sellingPrice: e.target.value })} placeholder="0.00" />
                </div>
                <div className="si-form__group">
                    <label>Category *</label>
                    <select required value={purchaseForm.category} onChange={(e) => setPurchaseForm({ ...purchaseForm, category: e.target.value })}>
                        <option value="Others">Others</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                        <option value="Home & Kitchen">Home & Kitchen</option>
                        <option value="Books & Stationery">Books & Stationery</option>
                        <option value="Toys & Games">Toys & Games</option>
                        <option value="Sports & Fitness">Sports & Fitness</option>
                        <option value="Automotive">Automotive</option>
                    </select>
                </div>
              </div>
              <div className="si-form__group" style={{ marginTop: '16px' }}>
                <label>Description *</label>
                <textarea required value={purchaseForm.description} onChange={(e) => setPurchaseForm({ ...purchaseForm, description: e.target.value })} placeholder="Brief description of the purchase" rows="2"></textarea>
              </div>
              
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                 <span style={{ fontWeight: 600, color: '#64748b' }}>Total Invoice Amount:</span>
                 <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '18px' }}>{fmt(Number(purchaseForm.quantity || 0) * Number(purchaseForm.costPrice || 0))}</span>
              </div>

              <div className="si-form__actions">
                <button type="button" className="si-btn-cancel" onClick={() => setShowRecordPurchase(false)}>Cancel</button>
                <button type="submit" className="si-btn-submit">Finalize Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordPayment && (
        <div className="si-modal-overlay" onClick={() => setShowRecordPayment(false)}>
          <div className="si-modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="si-modal__header">
              <h2>Record Payment</h2>
              <button className="si-modal__close" onClick={() => setShowRecordPayment(false)}>✕</button>
            </div>
            <form className="si-form" onSubmit={handleRecordPayment}>
                <div className="sm-product-search-container" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Select Recipient *</label>
                  <div className="sm-product-search-input-group">
                    <input 
                      type="text" 
                      placeholder="Search supplier..." 
                      value={supplierSearchTerm}
                      onChange={(e) => {
                        setSupplierSearchTerm(e.target.value);
                        setShowSupplierResults(true);
                      }}
                      onFocus={() => setShowSupplierResults(true)}
                      className="si-ledger-select"
                      style={{ flex: 1, width: '100%' }}
                      required={!paymentForm.supplierId}
                    />
                  </div>
                  
                  {showSupplierResults && (
                    <div className="sm-product-results">
                      {filteredSearchSuppliers.length > 0 ? (
                        filteredSearchSuppliers.map((s) => (
                          <div 
                            key={s._id} 
                            className="sm-product-result-item"
                            onClick={() => handleSupplierSelect(s._id, "payment")}
                          >
                            <div>
                                <span className="sm-product-result-name">{s.supplierName}</span>
                                <span className="sm-product-result-cat">{s.companyName}</span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '11px', color: s.totalDue > 0 ? '#ef4444' : '#10b981' }}>Due: {fmt(s.totalDue)}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No suppliers found</div>
                      )}
                    </div>
                  )}
                  {paymentForm.supplierId && (
                    <div className="sm-selected-product">
                      <span>Paying: <strong>{suppliers.find(s => s._id === paymentForm.supplierId)?.supplierName}</strong></span>
                      <span className="sm-clear-link" onClick={() => {
                        setPaymentForm({...paymentForm, supplierId: ""});
                        setSupplierSearchTerm("");
                      }}>Clear</span>
                    </div>
                  )}
                </div>

                <div className="si-form__grid">
                    <div className="si-form__group">
                        <label>Amount (NPR) *</label>
                        <input required type="number" min="0.01" step="0.01" value={paymentForm.amountPaid} onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })} placeholder="0.00" />
                    </div>
                    <div className="si-form__group">
                        <label>Date</label>
                        <input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
                    </div>
                    <div className="si-form__group" style={{ gridColumn: 'span 2' }}>
                        <label>Payment Method</label>
                        <select value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
                            <option>Cash</option>
                            <option>Bank Transfer</option>
                            <option>Cheque</option>
                            <option>Online</option>
                            <option>Other</option>
                        </select>
                    </div>
                </div>
                <div className="si-form__group" style={{ marginTop: '16px' }}>
                    <label>Transaction Note</label>
                    <input value={paymentForm.note} onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })} placeholder="Optional reference or note" />
                </div>

                <div className="si-form__actions">
                    <button type="button" className="si-btn-cancel" onClick={() => setShowRecordPayment(false)}>Cancel</button>
                    <button type="submit" className="si-btn-submit">Submit Payment</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {toast.visible && <div className={`od-toast od-toast--${toast.type}`}>{toast.message}</div>}
    </div>
  );
};

export default SupplierManagement;
