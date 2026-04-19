import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import { Link } from "react-router-dom";
import CustomerSidebar from "../components/CustomerSidebar";
import nepalLocations from "../data/nepalLocations.json";
import "../styles/customerLayout.css";
import "../styles/customerProfile.css";

const API_BASE = "http://localhost:8000";
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken")}` });

// ─── Toast hook ───────────────────────────────────────────────
const useToast = () => {
  const [toast, setToast] = useState({ message: "", visible: false });
  const show = (message) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3500);
  };
  return { toast, show };
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

const STATUS_COLOR = {
  Pending: "status-pending",
  Processing: "status-processing",
  Delivered: "status-delivered",
  Cancelled: "status-cancelled",
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
          <div className="modern-form-grid">
            <div className="cp-form-group">
              <label>Province *</label>
              <select className="modern-select" value={form.province} onChange={(e) => set("province", e.target.value)} required>
                <option value="">Select Province</option>
                {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="cp-form-group">
              <label>District *</label>
              <select className="modern-select" value={form.district} onChange={(e) => set("district", e.target.value)} required disabled={!form.province}>
                <option value="">Select District</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="modern-form-grid">
            <div className="cp-form-group">
              <label>Municipality *</label>
              <select className="modern-select" value={form.municipality} onChange={(e) => set("municipality", e.target.value)} required disabled={!form.district}>
                <option value="">Select Municipality</option>
                {municipalities.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="cp-form-group">
              <label>Ward *</label>
              <select className="modern-select" value={form.ward} onChange={(e) => set("ward", e.target.value)} required disabled={!form.municipality}>
                <option value="">Select Ward</option>
                {wards.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div className="cp-form-group">
            <label>Street / House No.</label>
            <div className="cp-input-row" style={{ display: 'flex', gap: '8px' }}>
              <input className="modern-input" style={{ flex: 1 }} type="text" placeholder="e.g. Thamel, Near Bank" value={form.streetAddress} onChange={(e) => setForm((f) => ({ ...f, streetAddress: e.target.value }))} />
              <button type="button" className="geo-modern-btn" style={{ width: 'auto', padding: '0 16px' }} onClick={handleGeo} title="Use Current Location">📍</button>
            </div>
          </div>
          <div className="cp-modal-actions">
            <button type="button" className="show-all-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="premium-btn" style={{ padding: '10px 24px' }} disabled={!form.province || !form.district || !form.municipality || !form.ward}>
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
  { id: "profile",   label: "Profile"},
  { id: "addresses", label: "Addresses"},
  { id: "orders",    label: "Orders"},
  { id: "password",  label: "Security"},
];

const CustomerProfile = () => {
  const { toast, show: showToast } = useToast();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        showToast("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Profile handlers ─────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!editName.trim()) { showToast("Name cannot be empty"); return; }
    try {
      setSavingProfile(true);
      const res = await axios.put(`${API_BASE}/api/customer/profile`, { name: editName.trim(), phone: editPhone.trim() }, { headers: getAuthHeaders() });
      setCustomer((c) => ({ ...c, name: res.data.customer.name, phone: res.data.customer.phone }));
      setIsEditing(false);
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed");
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
    if (!imageFile) { showToast("Please select an image"); return; }
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
      showToast("Profile image updated!");
    } catch (err) {
      showToast(err.response?.data?.message || "Image upload failed");
    } finally { setUploadingImage(false); }
  };

  // ── Address handlers ─────────────────────────────────────────
  const handleSaveAddress = async (form) => {
    try {
      if (addressModal?._id) {
        const res = await axios.put(`${API_BASE}/api/customer/address/${addressModal._id}`, form, { headers: getAuthHeaders() });
        setAddresses((prev) => prev.map((a) => (a._id === addressModal._id ? res.data.address : a)));
        showToast("Address updated!");
      } else {
        const res = await axios.post(`${API_BASE}/api/customer/address`, form, { headers: getAuthHeaders() });
        setAddresses((prev) => [...prev, res.data.address]);
        showToast("Address added!");
      }
      setAddressModal(null);
    } catch (err) { showToast(err.response?.data?.message || "Address save failed"); }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await axios.delete(`${API_BASE}/api/customer/address/${id}`, { headers: getAuthHeaders() });
      setAddresses((prev) => prev.filter((a) => a._id !== id));
      showToast("Address deleted");
    } catch (err) { showToast("Delete failed"); }
  };

  const handleSetDefault = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/customer/address/set-default/${id}`, {}, { headers: getAuthHeaders() });
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a._id === id })));
      showToast("Default address updated!");
    } catch (err) { showToast("Failed to set default"); }
  };

  // ── Order handlers ───────────────────────────────────────────
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      setCancellingId(orderId);
      const res = await axios.put(`${API_BASE}/api/customer/cancel-order/${orderId}`, { cancelReason: "Cancelled by customer" }, { headers: getAuthHeaders() });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: "Cancelled", cancelReason: res.data.order.cancelReason } : o)));
      showToast("Order cancelled");
    } catch (err) { showToast(err.response?.data?.message || "Cancel failed"); }
    finally { setCancellingId(null); }
  };

  // ── Password handler ─────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = pwForm;
    if (!currentPassword || !newPassword || !confirmPassword) { showToast("All fields are required"); return; }
    if (newPassword.length < 6) { showToast("New password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { showToast("Passwords do not match"); return; }
    try {
      setSavingPw(true);
      await axios.put(`${API_BASE}/api/customer/change-password`, { currentPassword, newPassword }, { headers: getAuthHeaders() });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password changed successfully!");
    } catch (err) { showToast(err.response?.data?.message || "Password change failed"); }
    finally { setSavingPw(false); }
  };

  if (loading) {
    return (
      <div className="sd-layout od-modern-layout">
        <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`sd-main od-main-content ${sidebarOpen ? "sd-main--shifted" : ""}`}>
          <main className="sd-content od-content">
            <div className="cp-loading-container">
              <div className="spinner" />
              <p>Syncing Profile...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const avatarSrc = customer?.profileImage ? imgUrl(customer.profileImage) : null;
  const displayAvatar = imagePreview || avatarSrc;

  return (
    <div className="sd-layout od-modern-layout">
      <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Toast */}
      {toast.visible && (
        <div className="toast">
          {toast.message}
        </div>
      )}

      {/* Address Modal */}
      {addressModal !== null && (
        <AddressModal initial={addressModal} onSave={handleSaveAddress} onClose={() => setAddressModal(null)} />
      )}

      <div className={`sd-main od-main-content ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        {/* TOP NAVBAR */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button 
              className="sd-navbar__hamburger" 
              onClick={() => setSidebarOpen((v) => !v)}
              onMouseEnter={() => {
                if (window.sidebarTimer) clearTimeout(window.sidebarTimer);
                setSidebarOpen(true);
              }}
              onMouseLeave={() => {
                window.sidebarTimer = setTimeout(() => setSidebarOpen(false), 300);
              }}
            >
              ☰
            </button>
            <div className="sd-navbar__title">
              <h1>My Profile</h1>
              <span className="sd-navbar__subtitle">Manage your account settings and preferences</span>
            </div>
          </div>
          
          <div className="sd-navbar__right">
            <button className="od-nav-icon-btn" style={{ marginRight: '16px' }}>🔔</button>
            <div className="sd-avatar">
              {displayAvatar ? (
                <img 
                  src={displayAvatar} 
                  alt="Profile" 
                  style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} 
                />
              ) : (
                <span>{customer?.name?.[0]?.toUpperCase() || "C"}</span>
              )}
            </div>
            <div className="sd-navbar__staff-info">
              <span className="sd-navbar__name">{customer?.name || "Customer"}</span>
              <span className="sd-navbar__role">Verified Account</span>
            </div>
          </div>
        </header>

        <main className="sd-content od-content">
          <div className="cp-modern-hero">
            <div className="cp-hero-card">
              <div className="cp-hero-avatar-section">
                <div className="cp-avatar-box">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="Avatar" />
                  ) : (
                    <div className="cp-avatar-placeholder">
                      {customer?.name?.[0]?.toUpperCase() || "C"}
                    </div>
                  )}
                  <label className="cp-camera-overlay" htmlFor="cp-file-input">
                    📷
                  </label>
                  <input id="cp-file-input" type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageSelect} />
                </div>
                {imageFile && (
                  <div className="cp-upload-actions">
                    <button className="premium-btn mini" onClick={handleImageUpload} disabled={uploadingImage}>
                      {uploadingImage ? "..." : "UPLOAD"}
                    </button>
                    <button className="show-all-btn mini" onClick={() => { setImageFile(null); setImagePreview(null); }}>✕</button>
                  </div>
                )}
              </div>

              <div className="cp-hero-text-section">
                <h1 className="cp-profile-name">{customer?.name || "Customer"}</h1>
                <p className="cp-profile-email">{customer?.email}</p>
                <div className="cp-hero-pills">
                  <span className="cp-pill">Joined {formatDate(customer?.createdAt)}</span>
                  <span className="cp-pill black">{orders.length} Orders</span>
                </div>
              </div>
            </div>

            <div className="cp-modern-tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`cp-modern-tab ${activeTab === t.id ? "active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                  {t.id === "addresses" && addresses.length > 0 && <span className="tab-count">{addresses.length}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="cp-tab-content-area">
            {activeTab === "profile" && (
              <div className="si-ledger-table-wrap" style={{ padding: '40px' }}>
                <div className="cp-section-header">
                  <h3>Personal Information</h3>
                  {!isEditing ? (
                    <button className="show-all-btn" onClick={() => setIsEditing(true)}>Edit Details</button>
                  ) : (
                    <div className="cp-edit-actions">
                      <button className="premium-btn" onClick={handleSaveProfile} disabled={savingProfile}>
                         {savingProfile ? "SAVING..." : "SAVE CHANGES"}
                      </button>
                      <button className="show-all-btn" onClick={() => setIsEditing(false)}>CANCEL</button>
                    </div>
                  )}
                </div>

                <div className="cp-info-grid">
                  <div className="cp-info-field">
                    <label>Full Name</label>
                    {isEditing ? (
                      <input className="modern-input" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    ) : (
                      <div className="field-value">{customer?.name || "—"}</div>
                    )}
                  </div>
                  <div className="cp-info-field">
                    <label>Email Address</label>
                    <div className="field-value readonly">{customer?.email || "—"}</div>
                  </div>
                  <div className="cp-info-field">
                    <label>Phone Number</label>
                    {isEditing ? (
                      <input className="modern-input" type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                    ) : (
                      <div className="field-value">{customer?.phone || "Not provided"}</div>
                    )}
                  </div>
                  <div className="cp-info-field">
                    <label>Registration Date</label>
                    <div className="field-value readonly">{formatDate(customer?.createdAt)}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="si-ledger-table-wrap" style={{ padding: '40px' }}>
                <div className="cp-section-header">
                  <h3>Delivery Addresses</h3>
                  <button className="premium-btn mini" onClick={() => setAddressModal({})}>+ ADD NEW</button>
                </div>

                {addresses.length === 0 ? (
                  <div className="cp-empty-placeholder">
                    <p>No addresses found. Add one to speed up checkout.</p>
                  </div>
                ) : (
                  <div className="cp-address-grid">
                    {addresses.map((addr) => (
                      <div key={addr._id} className={`cp-address-card ${addr.isDefault ? "is-default" : ""}`}>
                        {addr.isDefault && <span className="default-tag">PRIMARY</span>}
                        <div className="addr-main-text">
                          <h4>{addr.streetAddress || "Unnamed Location"}</h4>
                          <p>{addr.municipality}, {addr.district}</p>
                          <p>{addr.province}, Ward {addr.ward}</p>
                        </div>
                        <div className="addr-card-actions">
                          {!addr.isDefault && (
                            <button className="card-action-btn" onClick={() => handleSetDefault(addr._id)}>SET PRIMARY</button>
                          )}
                          <button className="card-action-btn" onClick={() => setAddressModal(addr)}>EDIT</button>
                          <button className="card-action-btn delete" onClick={() => handleDeleteAddress(addr._id)}>DELETE</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "orders" && (
              <div className="si-ledger-table-wrap" style={{ padding: '40px' }}>
                <div className="cp-section-header">
                  <h3>Recent Purchases</h3>
                  <Link to="/order-history" className="show-all-btn">Go to Orders</Link>
                </div>

                {orders.length === 0 ? (
                  <div className="cp-empty-placeholder">
                    <p>Your purchase history is empty.</p>
                  </div>
                ) : (
                  <div className="cp-mini-orders-list">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order._id} className="cp-mini-order-row">
                        <div className="order-id-group">
                          <span className="order-ref">#{order._id.slice(-8).toUpperCase()}</span>
                          <span className="order-date">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="order-price-group">
                          <span className="order-price">NPR {order.totalAmount?.toLocaleString()}</span>
                          <span className={`status-badge ${STATUS_COLOR[order.status] || ""}`}>{order.status}</span>
                        </div>
                        <Link to="/order-history" className="view-order-link">VIEW DETAILS</Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "password" && (
              <div className="si-ledger-table-wrap" style={{ padding: '40px', maxWidth: '600px' }}>
                <h3 style={{ marginBottom: '24px' }}>Security Settings</h3>
                <form className="cp-password-form" onSubmit={handleChangePassword}>
                  <div className="cp-form-group">
                    <label>Current Password</label>
                    <input
                      className="modern-input"
                      type={showPw.current ? "text" : "password"}
                      value={pwForm.currentPassword}
                      onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="cp-form-group">
                    <label>New Password</label>
                    <input
                      className="modern-input"
                      type={showPw.new ? "text" : "password"}
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="cp-form-group">
                    <label>Confirm New Password</label>
                    <input
                      className="modern-input"
                      type={showPw.confirm ? "text" : "password"}
                      value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <button type="submit" className="premium-btn" disabled={savingPw} style={{ marginTop: '12px' }}>
                    {savingPw ? "UPDATING..." : "UPDATE PASSWORD"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerProfile;
