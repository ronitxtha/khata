import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import { Link, useNavigate } from "react-router-dom";
import CustomerSidebar from "../components/CustomerSidebar";
import nepalLocations from "../data/nepalLocations.json";
import "../styles/ownerProfile.css";
import "../styles/ownerDashboard.css";

const API_BASE = "http://localhost:8000";
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken")}` });

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

const STATUS_COLOR = {
  Pending: "status-pending",
  Processing: "status-processing",
  Delivered: "status-delivered",
  Cancelled: "status-cancelled",
};

// ─── Toast hook ───────────────────────────────────────────────
const useToast = () => {
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const show = (message, type = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ message: "", type: "success", visible: false }), 3500);
  };
  return { toast, show };
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
    <div className="cp-modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{initial?._id ? "Edit Address" : "Add Address"}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (!form.province || !form.district || !form.municipality || !form.ward) return; onSave(form); }}>
          <div className="op-form-grid">
            <div className="op-input-group">
              <label className="op-input-label">Province</label>
              <select className="op-input" value={form.province} onChange={(e) => set("province", e.target.value)} required>
                <option value="">Select</option>
                {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="op-input-group">
              <label className="op-input-label">District</label>
              <select className="op-input" value={form.district} onChange={(e) => set("district", e.target.value)} required disabled={!form.province}>
                <option value="">Select</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="op-form-grid" style={{ marginTop: '16px' }}>
            <div className="op-input-group">
              <label className="op-input-label">Municipality</label>
              <select className="op-input" value={form.municipality} onChange={(e) => set("municipality", e.target.value)} required disabled={!form.district}>
                <option value="">Select</option>
                {municipalities.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="op-input-group">
              <label className="op-input-label">Ward</label>
              <select className="op-input" value={form.ward} onChange={(e) => set("ward", e.target.value)} required disabled={!form.municipality}>
                <option value="">Select</option>
                {wards.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div className="op-input-group" style={{ marginTop: '16px' }}>
            <label className="op-input-label">Street Address</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="op-input" style={{ flex: 1 }} type="text" placeholder="e.g. Thamel, Near Bank" value={form.streetAddress} onChange={(e) => setForm((f) => ({ ...f, streetAddress: e.target.value }))} />
              <button type="button" onClick={handleGeo} style={{ padding: '0 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }} title="Use Current Location">📍</button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button type="button" onClick={onClose} className="op-cancel-btn" style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#f1f5f9', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="op-submit-btn" style={{ padding: '10px 24px', borderRadius: '8px' }} disabled={!form.province || !form.district || !form.municipality || !form.ward}>
              {initial?._id ? "Save Changes" : "Add Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────
const CustomerProfile = () => {
  const navigate = useNavigate();
  const { toast, show: showToast } = useToast();
  const fileInputRef = useRef(null);

  // ── State ────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);

  // Profile Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Edit
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPw, setSavingPw] = useState(false);

  // Addresses & Orders
  const [addresses, setAddresses] = useState([]);
  const [addressModal, setAddressModal] = useState(null);
  const [orders, setOrders] = useState([]);

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

  const handleSaveProfile = async () => {
    if (!editName.trim()) { showToast("Name cannot be empty", "error"); return; }
    try {
      setSavingProfile(true);
      const res = await axios.put(`${API_BASE}/api/customer/profile`, { name: editName.trim(), phone: editPhone.trim() }, { headers: getAuthHeaders() });
      setCustomer((c) => ({ ...c, name: res.data.customer.name, phone: res.data.customer.phone }));
      setIsEditing(false);
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    } finally { setSavingProfile(false); }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      showToast("Uploading image...", "success");
      const fd = new FormData();
      fd.append("profileImage", file);
      const res = await axios.post(`${API_BASE}/api/customer/upload-profile-image`, fd, {
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
      });
      setCustomer((c) => ({ ...c, profileImage: res.data.profileImage }));
      showToast("Profile image updated!");
    } catch (err) {
      showToast(err.response?.data?.message || "Image upload failed", "error");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = pwForm;
    if (!currentPassword || !newPassword || !confirmPassword) { showToast("All fields required", "error"); return; }
    if (newPassword.length < 6) { showToast("New password must be at least 6 characters", "error"); return; }
    if (newPassword !== confirmPassword) { showToast("Passwords do not match", "error"); return; }
    try {
      setSavingPw(true);
      await axios.put(`${API_BASE}/api/customer/change-password`, { currentPassword, newPassword }, { headers: getAuthHeaders() });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password changed successfully!");
    } catch (err) { showToast(err.response?.data?.message || "Password change failed", "error"); }
    finally { setSavingPw(false); }
  };

  // Addresses
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
    } catch (err) { showToast(err.response?.data?.message || "Address save failed", "error"); }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await axios.delete(`${API_BASE}/api/customer/address/${id}`, { headers: getAuthHeaders() });
      setAddresses((prev) => prev.filter((a) => a._id !== id));
      showToast("Address deleted");
    } catch (err) { showToast("Delete failed", "error"); }
  };

  const handleSetDefault = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/customer/address/set-default/${id}`, {}, { headers: getAuthHeaders() });
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a._id === id })));
      showToast("Default address updated!");
    } catch (err) { showToast("Failed to set default", "error"); }
  };

  if (loading) {
    return (
      <div className="od-shell">
        <CustomerSidebar customer={customer || JSON.parse(localStorage.getItem("user") || "{}")} />
        <div className="od-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Syncing Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="od-shell">
      <CustomerSidebar customer={customer} />

      {addressModal !== null && (
        <AddressModal initial={addressModal} onSave={handleSaveAddress} onClose={() => setAddressModal(null)} />
      )}

      {toast.visible && (
        <div style={{ position: 'fixed', bottom: '40px', right: '40px', background: toast.type === 'error' ? '#ef4444' : '#10b981', color: 'white', padding: '16px 24px', borderRadius: '12px', fontWeight: 700, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 9999 }}>
          {toast.message}
        </div>
      )}

      <div className="od-main">
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">Customer Profile</h1>
            <div className="od-topbar__date">Manage your personal info and shipping addresses</div>
          </div>
          <div className="od-topbar__right">
            <div className="od-topbar__profile">
              <div className="od-topbar__avatar">
                {customer?.profileImage ? <img src={imgUrl(customer.profileImage)} alt="avatar" /> : <span>{(customer?.name || "C")[0].toUpperCase()}</span>}
              </div>
            </div>
            <button className="od-topbar__logout" onClick={() => { localStorage.clear(); navigate('/login'); }} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          </div>
        </header>

        <main className="od-content">
          <div className="op-container" style={{ padding: '0', background: 'transparent', minHeight: 'auto' }}>
            <header className="op-page-header" style={{ flexWrap: 'wrap' }}>
              <div className="op-header-text">
                <span className="op-breadcrumb">Settings / Account</span>
                <h2 className="op-title">Account Workspace</h2>
                <p className="op-subtitle">Manage your personal info and shipping addresses.</p>
              </div>

              <div className="op-profile-floating-card">
                <div className="op-avatar-wrapper" onClick={() => fileInputRef.current?.click()} title="Change Profile Image">
                  {customer?.profileImage ? (
                    <img src={imgUrl(customer.profileImage)} alt="profile" className="op-avatar-img" />
                  ) : (
                    <div className="op-avatar-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: '#94a3b8' }}>
                      {(customer?.name || "C")[0].toUpperCase()}
                    </div>
                  )}
                  {isEditing && <div className="op-avatar-edit-icon">✏️</div>}
                  <input type="file" ref={fileInputRef} hidden onChange={(e) => handleImageUpload(e.target.files[0])} accept="image/*" />
                </div>
                
                <div className="op-profile-info">
                  <h3>{customer?.name || "Customer"}</h3>
                  <p style={{textTransform: 'uppercase'}}>CUSTOMER • {customer?.email}</p>
                </div>
              </div>
            </header>

            <div className="op-main-grid">
              {/* LEFT COLUMN */}
              <div className="op-col-left">
                <section style={{ marginBottom: '40px' }}>
                  <div className="op-section-header">
                    <h2 className="op-section-title">Identity Details</h2>
                    {!isEditing && (
                      <button className="op-edit-link" onClick={() => setIsEditing(true)}>Edit Identity</button>
                    )}
                  </div>
                  <div className="op-details-card">
                    {!isEditing ? (
                      <div className="op-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                        <div className="op-info-field">
                          <span className="op-info-label">Full Name</span>
                          <span className="op-info-value">{customer?.name || "—"}</span>
                        </div>
                        <div className="op-info-field">
                          <span className="op-info-label">Email Address</span>
                          <span className="op-info-value" style={{ wordBreak: 'break-all' }}>{customer?.email || "—"}</span>
                        </div>
                        <div className="op-info-field">
                          <span className="op-info-label">Phone Number</span>
                          <span className="op-info-value">{customer?.phone || "Not provided"}</span>
                        </div>
                        <div className="op-info-field">
                          <span className="op-info-label">Member Since</span>
                          <span className="op-info-value">{formatDate(customer?.createdAt)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="op-form-grid">
                        <div className="op-form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                          <div className="op-input-group">
                            <label className="op-input-label">Full Name</label>
                            <input className="op-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                          </div>
                          <div className="op-input-group">
                            <label className="op-input-label">Phone Number</label>
                            <input className="op-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                          <button className="op-submit-btn" onClick={handleSaveProfile} disabled={savingProfile}>
                            {savingProfile ? "Saving..." : "Save Changes"}
                          </button>
                          <button className="op-submit-btn" style={{ background: '#f1f5f9', color: '#64748b' }} onClick={() => setIsEditing(false)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

              <section>
                <h2 className="op-section-title" style={{ marginBottom: '24px' }}>Security Key</h2>
                <div className="op-security-card">
                  <form className="op-form-grid" onSubmit={handleChangePassword}>
                    <div className="op-input-group">
                       <label className="op-input-label">Current Key</label>
                       <input className="op-input" type="password" placeholder="••••••••••••" value={pwForm.currentPassword} onChange={(e) => setPwForm({...pwForm, currentPassword: e.target.value})} />
                    </div>
                    <div className="op-form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                       <div className="op-input-group">
                          <label className="op-input-label">New Secret Key</label>
                          <input className="op-input" type="password" placeholder="••••••••••••" value={pwForm.newPassword} onChange={(e) => setPwForm({...pwForm, newPassword: e.target.value})} />
                       </div>
                       <div className="op-input-group">
                          <label className="op-input-label">Confirm Key</label>
                          <input className="op-input" type="password" placeholder="••••••••••••" value={pwForm.confirmPassword} onChange={(e) => setPwForm({...pwForm, confirmPassword: e.target.value})} />
                       </div>
                    </div>
                    <button type="submit" className="op-submit-btn" style={{ width: '100%', marginTop: '8px' }}>Update New Key</button>
                  </form>
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <div className="op-col-right">
              <section style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 className="op-section-title" style={{ margin: 0 }}>Delivery Addresses</h2>
                  <button onClick={() => setAddressModal({})} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>+ Add New</button>
                </div>
                
                {addresses.length === 0 ? (
                  <div className="op-shop-card" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                    <p style={{ margin: 0 }}>No addresses found. Add one to speed up checkout.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {addresses.map((addr) => (
                      <div key={addr._id} className="op-shop-card" style={{ padding: '24px', position: 'relative', border: addr.isDefault ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.8)' }}>
                        {addr.isDefault && <span style={{ position: 'absolute', top: '24px', right: '24px', background: '#6366f1', color: 'white', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px' }}>PRIMARY</span>}
                        <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{addr.streetAddress || "Unnamed Location"}</h3>
                        <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#64748b' }}>{addr.municipality}, {addr.district}</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{addr.province}, Ward {addr.ward}</p>
                        
                        <div style={{ display: 'flex', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                          {!addr.isDefault && (
                            <button onClick={() => handleSetDefault(addr._id)} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 800, fontSize: '13px', cursor: 'pointer', padding: 0 }}>Set Primary</button>
                          )}
                          <button onClick={() => setAddressModal(addr)} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 800, fontSize: '13px', cursor: 'pointer', padding: 0 }}>Edit</button>
                          <button onClick={() => handleDeleteAddress(addr._id)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontWeight: 800, fontSize: '13px', cursor: 'pointer', padding: 0 }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 className="op-section-title" style={{ margin: 0 }}>Recent Orders</h2>
                  <Link to="/order-history" className="op-edit-link">View All</Link>
                </div>
                
                {orders.length === 0 ? (
                  <div className="op-shop-card" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>Your purchase history is empty.</p>
                  </div>
                ) : (
                  <div className="od-panel od-panel--table">
                    <div style={{ overflowX: "auto" }}>
                      <table className="od-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 5).map((order) => (
                            <tr key={order._id}>
                              <td style={{ fontWeight: 600, color: '#0f172a' }}>#{order._id.slice(-8).toUpperCase()}</td>
                              <td className="od-table__date">{formatDate(order.createdAt)}</td>
                              <td style={{ fontWeight: 600, color: '#6366f1' }}>NPR {order.totalAmount?.toLocaleString()}</td>
                              <td>
                                <span className={`od-badge ${STATUS_COLOR[order.status] || "od-badge--blue"}`}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>

            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
  );
};

export default CustomerProfile;
