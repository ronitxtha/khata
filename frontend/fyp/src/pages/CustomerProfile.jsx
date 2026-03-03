import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import CustomerSidebar from "../components/CustomerSidebar";
import nepalLocations from "../data/nepalLocations.json";
import "../styles/customerProfile.css";

const API_BASE = "http://localhost:8000";
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken")}` });

// ─── Toast hook ───────────────────────────────────────────────
const useToast = () => {
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const show = (message, type = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  };
  return { toast, show };
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

const STATUS_COLOR = {
  Pending: "cp-badge-pending",
  Processing: "cp-badge-processing",
  Delivered: "cp-badge-delivered",
  Cancelled: "cp-badge-cancelled",
};

// ─── Address Modal ────────────────────────────────────────────
const AddressModal = ({ initial, onSave, onClose }) => {
  const provinces = Object.keys(nepalLocations);
  const [form, setForm] = useState({
    province: initial?.province || "",
    district: initial?.district || "",
    municipality: initial?.municipality || "",
    ward: initial?.ward || "",
    streetAddress: initial?.streetAddress || "",
  });

  const districts = form.province ? Object.keys(nepalLocations[form.province] || {}) : [];
  const municipalities = form.province && form.district ? Object.keys(nepalLocations[form.province]?.[form.district] || {}) : [];
  const wards = form.province && form.district && form.municipality
    ? nepalLocations[form.province]?.[form.district]?.[form.municipality] || []
    : [];

  const set = (field, val) => {
    if (field === "province") setForm({ province: val, district: "", municipality: "", ward: "", streetAddress: form.streetAddress });
    else if (field === "district") setForm((f) => ({ ...f, district: val, municipality: "", ward: "" }));
    else if (field === "municipality") setForm((f) => ({ ...f, municipality: val, ward: "" }));
    else setForm((f) => ({ ...f, [field]: val }));
  };

  const handleGeo = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm((f) => ({ ...f, streetAddress: `Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}` })),
      () => alert("Unable to retrieve location.")
    );
  };

  return (
    <div className="cp-modal-overlay" onClick={onClose}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cp-modal-header">
          <h3>{initial?._id ? "✏️ Edit Address" : "📍 Add New Address"}</h3>
          <button className="cp-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="cp-modal-body" onSubmit={(e) => { e.preventDefault(); if (!form.province || !form.district || !form.municipality || !form.ward) return; onSave(form); }}>
          <div className="cp-form-group">
            <label>Province *</label>
            <select className="cp-select" value={form.province} onChange={(e) => set("province", e.target.value)} required>
              <option value="">Select Province</option>
              {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="cp-form-group">
            <label>District *</label>
            <select className="cp-select" value={form.district} onChange={(e) => set("district", e.target.value)} required disabled={!form.province}>
              <option value="">Select District</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="cp-form-group">
            <label>Municipality *</label>
            <select className="cp-select" value={form.municipality} onChange={(e) => set("municipality", e.target.value)} required disabled={!form.district}>
              <option value="">Select Municipality</option>
              {municipalities.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="cp-form-group">
            <label>Ward *</label>
            <select className="cp-select" value={form.ward} onChange={(e) => set("ward", e.target.value)} required disabled={!form.municipality}>
              <option value="">Select Ward</option>
              {wards.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="cp-form-group">
            <label>Street / House No.</label>
            <div className="cp-input-row">
              <input className="cp-input" type="text" placeholder="e.g. Thamel, Near Bank" value={form.streetAddress} onChange={(e) => setForm((f) => ({ ...f, streetAddress: e.target.value }))} />
              <button type="button" className="cp-geo-btn" onClick={handleGeo} title="Use Current Location">📍</button>
            </div>
          </div>
          <div className="cp-modal-actions">
            <button type="button" className="cp-btn cp-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="cp-btn cp-btn-primary" disabled={!form.province || !form.district || !form.municipality || !form.ward}>
              {initial?._id ? "Save Changes" : "Add Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────
const TABS = [
  { id: "profile",   label: "Profile",   icon: "👤" },
  { id: "addresses", label: "Addresses", icon: "📍" },
  { id: "orders",    label: "Orders",    icon: "📦" },
  { id: "password",  label: "Security",  icon: "🔒" },
];

const CustomerProfile = () => {
  const { toast, show: showToast } = useToast();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("profile");

  // ── State ────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);

  // Profile edit
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Image upload
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [addressModal, setAddressModal] = useState(null);

  // Orders
  const [orders, setOrders] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);

  // Password
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  // ── Fetch on mount ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [profileRes, addressRes, orderRes] = await Promise.all([
          axios.get(`${API_BASE}/api/customer/profile`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE}/api/customer/addresses`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE}/api/customer/orders`, { headers: getAuthHeaders() }),
        ]);
        const c = profileRes.data.customer;
        setCustomer(c);
        setEditName(c.name || "");
        setEditPhone(c.phone || "");
        setAddresses(addressRes.data.addresses || []);
        setOrders(orderRes.data.orders || []);
      } catch (err) {
        showToast("Failed to load profile data", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Profile handlers ─────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!editName.trim()) { showToast("Name cannot be empty", "error"); return; }
    try {
      setSavingProfile(true);
      const res = await axios.put(`${API_BASE}/api/customer/profile`, { name: editName.trim(), phone: editPhone.trim() }, { headers: getAuthHeaders() });
      setCustomer((c) => ({ ...c, name: res.data.customer.name, phone: res.data.customer.phone }));
      setIsEditing(false);
      showToast("Profile updated successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    } finally { setSavingProfile(false); }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!imageFile) { showToast("Please select an image", "error"); return; }
    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append("profileImage", imageFile);
      const res = await axios.post(`${API_BASE}/api/customer/upload-profile-image`, fd, {
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
      });
      setCustomer((c) => ({ ...c, profileImage: res.data.profileImage }));
      setImagePreview(null);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("Profile image updated!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Image upload failed", "error");
    } finally { setUploadingImage(false); }
  };

  // ── Address handlers ─────────────────────────────────────────
  const handleSaveAddress = async (form) => {
    try {
      if (addressModal?._id) {
        const res = await axios.put(`${API_BASE}/api/customer/address/${addressModal._id}`, form, { headers: getAuthHeaders() });
        setAddresses((prev) => prev.map((a) => (a._id === addressModal._id ? res.data.address : a)));
        showToast("Address updated!", "success");
      } else {
        const res = await axios.post(`${API_BASE}/api/customer/address`, form, { headers: getAuthHeaders() });
        setAddresses((prev) => [...prev, res.data.address]);
        showToast("Address added!", "success");
      }
      setAddressModal(null);
    } catch (err) { showToast(err.response?.data?.message || "Address save failed", "error"); }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await axios.delete(`${API_BASE}/api/customer/address/${id}`, { headers: getAuthHeaders() });
      setAddresses((prev) => prev.filter((a) => a._id !== id));
      showToast("Address deleted", "success");
    } catch (err) { showToast("Delete failed", "error"); }
  };

  const handleSetDefault = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/customer/address/set-default/${id}`, {}, { headers: getAuthHeaders() });
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a._id === id })));
      showToast("Default address updated!", "success");
    } catch (err) { showToast("Failed to set default", "error"); }
  };

  // ── Order handlers ───────────────────────────────────────────
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      setCancellingId(orderId);
      const res = await axios.put(`${API_BASE}/api/customer/cancel-order/${orderId}`, { cancelReason: "Cancelled by customer" }, { headers: getAuthHeaders() });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: "Cancelled", cancelReason: res.data.order.cancelReason } : o)));
      showToast("Order cancelled", "success");
    } catch (err) { showToast(err.response?.data?.message || "Cancel failed", "error"); }
    finally { setCancellingId(null); }
  };

  // ── Password handler ─────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = pwForm;
    if (!currentPassword || !newPassword || !confirmPassword) { showToast("All fields are required", "error"); return; }
    if (newPassword.length < 6) { showToast("New password must be at least 6 characters", "error"); return; }
    if (newPassword !== confirmPassword) { showToast("Passwords do not match", "error"); return; }
    try {
      setSavingPw(true);
      await axios.put(`${API_BASE}/api/customer/change-password`, { currentPassword, newPassword }, { headers: getAuthHeaders() });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password changed successfully!", "success");
    } catch (err) { showToast(err.response?.data?.message || "Password change failed", "error"); }
    finally { setSavingPw(false); }
  };

  // ── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="cp-layout">
        <CustomerSidebar />
        <div className="cp-content">
          <div className="cp-loading-screen">
            <div className="cp-spinner-wrap">
              <div className="cp-spinner" />
              <div className="cp-spinner-inner" />
            </div>
            <p className="cp-loading-text">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const avatarSrc = customer?.profileImage ? `${API_BASE}/${customer.profileImage}` : null;
  const displayAvatar = imagePreview || avatarSrc;

  return (
    <div className="cp-layout">
      <CustomerSidebar />

      {/* Toast */}
      {toast.visible && (
        <div className={`cp-toast cp-toast-${toast.type}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.message}
        </div>
      )}

      {/* Address Modal */}
      {addressModal !== null && (
        <AddressModal initial={addressModal} onSave={handleSaveAddress} onClose={() => setAddressModal(null)} />
      )}

      <div className="cp-content">
        {/* ── HERO BANNER ───────────────────────────────────── */}
        <div className="cp-hero">
          <div className="cp-hero-inner">
            {/* Avatar */}
            <div className="cp-hero-avatar-wrap">
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" className="cp-hero-avatar" />
              ) : (
                <div className="cp-hero-avatar-placeholder">
                  {customer?.name?.[0]?.toUpperCase() || "C"}
                </div>
              )}
              {imagePreview && <span className="cp-preview-badge">Preview</span>}
              <label className="cp-hero-camera-btn" htmlFor="cp-file-input" title="Change photo">📷</label>
              <input id="cp-file-input" type="file" accept="image/*" className="cp-file-hidden" ref={fileInputRef} onChange={handleImageSelect} />
            </div>

            {/* Info */}
            <div className="cp-hero-info">
              <h1 className="cp-hero-name">{customer?.name || "Customer"}</h1>
              <p className="cp-hero-email">{customer?.email}</p>
              <div className="cp-hero-badges">
                <span className="cp-hero-badge">👤 Customer</span>
                <span className="cp-hero-badge">📅 Joined {formatDate(customer?.createdAt)}</span>
                {addresses.find((a) => a.isDefault) && (
                  <span className="cp-hero-badge">📍 {addresses.find((a) => a.isDefault).district}</span>
                )}
              </div>
              {/* Image upload actions */}
              {imageFile && (
                <div className="cp-hero-upload-row">
                  <button className="cp-btn cp-btn-success" onClick={handleImageUpload} disabled={uploadingImage}>
                    {uploadingImage ? "Uploading..." : "⬆️ Upload Photo"}
                  </button>
                  <button className="cp-btn cp-btn-ghost" onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── BODY ──────────────────────────────────────────── */}
        <div className="cp-body">
          {/* Tabs */}
          <div className="cp-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`cp-tab ${activeTab === t.id ? "cp-tab-active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.icon} {t.label}
                {t.id === "addresses" && addresses.length > 0 && (
                  <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: "99px", padding: "1px 7px", fontSize: "11px" }}>
                    {addresses.length}
                  </span>
                )}
                {t.id === "orders" && orders.length > 0 && (
                  <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: "99px", padding: "1px 7px", fontSize: "11px" }}>
                    {orders.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ══ TAB: PROFILE ══════════════════════════════════ */}
          {activeTab === "profile" && (
            <div className="cp-card">
              <h2 className="cp-card-title">Account Information</h2>
              <div className="cp-info-grid">
                <div className="cp-info-cell">
                  <label>Full Name</label>
                  {isEditing ? (
                    <input className="cp-input" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Enter name" />
                  ) : (
                    <span>{customer?.name || "—"}</span>
                  )}
                </div>
                <div className="cp-info-cell">
                  <label>Email Address</label>
                  <span className="cp-readonly">{customer?.email || "—"}</span>
                </div>
                <div className="cp-info-cell">
                  <label>Phone Number</label>
                  {isEditing ? (
                    <input className="cp-input" type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Enter phone" />
                  ) : (
                    <span>{customer?.phone || <em className="cp-empty">Not set</em>}</span>
                  )}
                </div>
                <div className="cp-info-cell">
                  <label>Account Type</label>
                  <span className="cp-role-badge">Customer</span>
                </div>
                <div className="cp-info-cell">
                  <label>Member Since</label>
                  <span>{formatDate(customer?.createdAt)}</span>
                </div>
                <div className="cp-info-cell">
                  <label>Total Orders</label>
                  <span style={{ color: "#2563eb" }}>{orders.length}</span>
                </div>
              </div>
              <div className="cp-btn-group">
                {!isEditing ? (
                  <button className="cp-btn cp-btn-primary" onClick={() => { setEditName(customer?.name || ""); setEditPhone(customer?.phone || ""); setIsEditing(true); }}>
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <>
                    <button className="cp-btn cp-btn-success" onClick={handleSaveProfile} disabled={savingProfile}>
                      {savingProfile ? "Saving..." : "💾 Save Changes"}
                    </button>
                    <button className="cp-btn cp-btn-secondary" onClick={() => setIsEditing(false)} disabled={savingProfile}>
                      ✕ Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══ TAB: ADDRESSES ════════════════════════════════ */}
          {activeTab === "addresses" && (
            <div className="cp-card">
              <div className="cp-card-header-row">
                <h2 className="cp-card-title">Delivery Addresses</h2>
                <button className="cp-btn cp-btn-primary" onClick={() => setAddressModal({})}>
                  + Add Address
                </button>
              </div>
              {addresses.length === 0 ? (
                <div className="cp-empty-state">
                  <span>🏠</span>
                  <p>No addresses saved yet</p>
                  <p className="cp-empty-hint">Add an address for faster checkout.</p>
                </div>
              ) : (
                <div className="cp-address-grid">
                  {addresses.map((addr) => (
                    <div key={addr._id} className={`cp-address-card ${addr.isDefault ? "cp-address-default" : ""}`}>
                      {addr.isDefault && <span className="cp-default-badge">⭐ Default</span>}
                      <div className="cp-address-text">
                        <p><strong>{addr.province}</strong> &bull; {addr.district}</p>
                        <p>{addr.municipality}, Ward {addr.ward}</p>
                        {addr.streetAddress && <p className="cp-street">📌 {addr.streetAddress}</p>}
                      </div>
                      <div className="cp-address-actions">
                        {!addr.isDefault && (
                          <button className="cp-addr-btn cp-addr-default" onClick={() => handleSetDefault(addr._id)}>Set Default</button>
                        )}
                        <button className="cp-addr-btn cp-addr-edit" onClick={() => setAddressModal(addr)}>Edit</button>
                        <button className="cp-addr-btn cp-addr-delete" onClick={() => handleDeleteAddress(addr._id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: ORDERS ═══════════════════════════════════ */}
          {activeTab === "orders" && (
            <div className="cp-card">
              <h2 className="cp-card-title">Order History</h2>
              {orders.length === 0 ? (
                <div className="cp-empty-state">
                  <span>📦</span>
                  <p>No orders yet</p>
                  <p className="cp-empty-hint">Your orders will appear here after purchase.</p>
                </div>
              ) : (
                <div className="cp-orders-list">
                  {orders.map((order) => (
                    <div key={order._id} className="cp-order-card">
                      <div className="cp-order-top">
                        <div className="cp-order-id">
                          <span className="cp-order-label">Order ID</span>
                          <span className="cp-order-value">#{order._id.slice(-8).toUpperCase()}</span>
                        </div>
                        <span className={`cp-status-badge ${STATUS_COLOR[order.status] || ""}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="cp-order-meta">
                        <div className="cp-order-meta-item">
                          <span className="cp-order-label">Date</span>
                          <span className="cp-order-value">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="cp-order-meta-item">
                          <span className="cp-order-label">Total</span>
                          <span className="cp-order-value cp-order-total">NPR {order.totalAmount?.toLocaleString()}</span>
                        </div>
                        <div className="cp-order-meta-item">
                          <span className="cp-order-label">Payment</span>
                          <span className="cp-order-value">{order.paymentMethod || "Cash on Delivery"}</span>
                        </div>
                        <div className="cp-order-meta-item">
                          <span className="cp-order-label">Items</span>
                          <span className="cp-order-value">{order.items?.length || 0}</span>
                        </div>
                      </div>
                      <div className="cp-order-items">
                        {order.items?.slice(0, 3).map((item, i) => (
                          <div key={i} className="cp-order-item">
                            {item.image && (
                              <img src={`${API_BASE}/${item.image}`} alt={item.name} className="cp-item-img" onError={(e) => { e.target.style.display = "none"; }} />
                            )}
                            <span>{item.name} × {item.quantity}</span>
                          </div>
                        ))}
                        {order.items?.length > 3 && (
                          <span className="cp-order-more">+{order.items.length - 3} more</span>
                        )}
                      </div>
                      <div className="cp-order-actions">
                        {order.status === "Pending" && (
                          <button className="cp-btn cp-btn-danger" onClick={() => handleCancelOrder(order._id)} disabled={cancellingId === order._id}>
                            {cancellingId === order._id ? "Cancelling..." : "✕ Cancel Order"}
                          </button>
                        )}
                        {order.status === "Processing" && (
                          <button className="cp-btn cp-btn-info">🚚 Track Order</button>
                        )}
                        {order.status === "Delivered" && (
                          <button className="cp-btn cp-btn-success">⭐ Leave Review</button>
                        )}
                        {order.status === "Cancelled" && order.cancelReason && (
                          <p className="cp-cancel-reason">Reason: {order.cancelReason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: PASSWORD ═════════════════════════════════ */}
          {activeTab === "password" && (
            <div className="cp-card">
              <h2 className="cp-card-title">Change Password</h2>
              <form className="cp-pw-form" onSubmit={handleChangePassword} noValidate>
                {[
                  { key: "currentPassword", label: "Current Password", placeholder: "Enter current password" },
                  { key: "newPassword",     label: "New Password",     placeholder: "Enter new password",     hint: "(min 6 characters)" },
                  { key: "confirmPassword", label: "Confirm Password", placeholder: "Re-enter new password" },
                ].map(({ key, label, placeholder, hint }) => (
                  <div className="cp-form-group" key={key}>
                    <label>{label}{hint && <span className="cp-hint">{hint}</span>}</label>
                    <div className="cp-input-eye">
                      <input
                        className="cp-input"
                        type={showPw[key.replace("Password", "").replace("current", "current").replace("new", "new").replace("confirm", "confirm")] || (showPw[key === "currentPassword" ? "current" : key === "newPassword" ? "new" : "confirm"] ? "text" : "password")}
                        placeholder={placeholder}
                        value={pwForm[key]}
                        onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                      />
                      <button type="button" className="cp-eye-btn" tabIndex={-1}
                        onClick={() => {
                          const k = key === "currentPassword" ? "current" : key === "newPassword" ? "new" : "confirm";
                          setShowPw((s) => ({ ...s, [k]: !s[k] }));
                        }}>
                        {showPw[key === "currentPassword" ? "current" : key === "newPassword" ? "new" : "confirm"] ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {key === "newPassword" && pwForm.newPassword && pwForm.newPassword.length < 6 && (
                      <p className="cp-field-error">⚠ Must be at least 6 characters</p>
                    )}
                    {key === "confirmPassword" && pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                      <p className="cp-field-error">⚠ Passwords do not match</p>
                    )}
                  </div>
                ))}
                <div className="cp-btn-group">
                  <button type="submit" className="cp-btn cp-btn-primary" disabled={savingPw}>
                    {savingPw ? "Updating..." : "🔑 Update Password"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
