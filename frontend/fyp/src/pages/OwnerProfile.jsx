import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/staffDashboard.css";
import "../styles/staffInventory.css";

const API_BASE = "http://localhost:8000";

const nepalData = {
  provinces: ["Bagmati", "Dhawalagiri", "gandaki", "Karnali", "Lumbini", "Madhesh", "Mechi", "Sagarmatha"],
  districts: {
    Bagmati: ["Kathmandu", "Bhaktapur", "Lalitpur", "Kavre", "Sindhuli"],
    Dhawalagiri: ["Baglung", "Myagdi", "Parbat"],
    gandaki: ["Gorkha", "Lamjung", "Manang", "Kaski", "Syangja"],
    Karnali: ["Dailekh", "Jumla", "Dolpa"],
    Lumbini: ["Gulmi", "Palpa", "Nawalparasi", "Rupandehi"],
    Madhesh: ["Parsa", "Bara", "Rautahat", "Saptari"],
    Mechi: ["Ilam", "Jhapa"],
    Sagarmatha: ["Dolakha", "Khotang", "Solukhumbu"],
  },
  municipalities: {
    Kathmandu: ["Kathmandu", "Budhanilkantha", "Naksal"],
    Lalitpur: ["Lalitpur", "Mahalaxmi"],
    Bhaktapur: ["Bhaktapur", "Suryabinayak"],
    Gulmi: ["Gulmi", "Resunga"],
    Ilam: ["Ilam", "Mai"],
  },
};

const OwnerProfile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({ totalProducts: 0, totalOrders: 0, lowStockProducts: 0, lowStockDetails: [] });

  // Profile edit
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({ username: "", phone: "" });

  // Shop edit
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [shopFormData, setShopFormData] = useState({
    shopName: "", shopEmail: "", shopPhone: "", shopAddress: "",
    province: "", district: "", municipality: "", ward: "",
  });

  // Password
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  // Image upload
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [shopLogoPreview, setShopLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  };

  useEffect(() => {
    fetchProfile();
    fetchStatistics();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/owner/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const d = res.data.data;
      setProfile(d);
      setEditFormData({ username: d.username || "", phone: d.phone || "" });
      setShopFormData({
        shopName: d.shopName || "", shopEmail: d.shopEmail || "", shopPhone: d.shopPhone || "",
        shopAddress: d.shopAddress || "", province: d.province || "", district: d.district || "",
        municipality: d.municipality || "", ward: d.ward || "",
      });
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/owner/statistics`, {
        headers: { Authorization: `Bearer ${token}` }, withCredentials: true,
      });
      setStatistics(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      await axios.put(`${API_BASE}/api/owner/profile`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }, withCredentials: true,
      });
      showToast("Profile updated successfully");
      setIsEditingProfile(false);
      fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    } finally { setLoading(false); }
  };

  const handleProfileCancel = () => {
    setIsEditingProfile(false);
    setEditFormData({ username: profile?.username || "", phone: profile?.phone || "" });
  };

  const handleShopSave = async () => {
    try {
      setLoading(true);
      await axios.put(`${API_BASE}/api/owner/profile`, shopFormData, {
        headers: { Authorization: `Bearer ${token}` }, withCredentials: true,
      });
      showToast("Shop info updated successfully");
      setIsEditingShop(false);
      fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    } finally { setLoading(false); }
  };

  const handleShopCancel = () => {
    setIsEditingShop(false);
    setShopFormData({
      shopName: profile?.shopName || "", shopEmail: profile?.shopEmail || "",
      shopPhone: profile?.shopPhone || "", shopAddress: profile?.shopAddress || "",
      province: profile?.province || "", district: profile?.district || "",
      municipality: profile?.municipality || "", ward: profile?.ward || "",
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword) { showToast("Current password required", "error"); return; }
    if (passwordData.newPassword.length < 6) { showToast("New password must be ≥ 6 characters", "error"); return; }
    if (passwordData.newPassword !== passwordData.confirmPassword) { showToast("Passwords do not match", "error"); return; }
    try {
      setLoading(true);
      await axios.put(`${API_BASE}/api/owner/change-password`, passwordData, {
        headers: { Authorization: `Bearer ${token}` }, withCredentials: true,
      });
      showToast("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change password", "error");
    } finally { setLoading(false); }
  };

  const uploadProfileImage = async () => {
    const fileInput = document.getElementById("profileImageInput");
    const file = fileInput?.files[0];
    if (!file) { showToast("Please select an image", "error"); return; }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("profileImage", file);
      await axios.post(`${API_BASE}/api/owner/upload-profile-image`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }, withCredentials: true,
      });
      showToast("Profile image uploaded");
      setProfileImagePreview(null);
      fileInput.value = "";
      fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.message || "Upload failed", "error");
    } finally { setUploading(false); }
  };

  const uploadShopLogo = async () => {
    const fileInput = document.getElementById("shopLogoInput");
    const file = fileInput?.files[0];
    if (!file) { showToast("Please select a logo", "error"); return; }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("shopLogo", file);
      await axios.post(`${API_BASE}/api/owner/upload-shop-logo`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }, withCredentials: true,
      });
      showToast("Shop logo uploaded");
      setShopLogoPreview(null);
      fileInput.value = "";
      fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.message || "Upload failed", "error");
    } finally { setUploading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navLinks = [
    { label: "Dashboard", icon: "🏠", path: "/owner-dashboard" },
    { label: "Product Management", icon: "📦", path: "/products" },
    { label: "Orders", icon: "🛒", path: "/order-management" },
    { label: "Staff Management", icon: "👥", path: "/add-staff" },
    { label: "Supplier Management", icon: "🏭", path: "/supplier-management" },
    { label: "Attendance", icon: "📅", path: "/attendance" },
    { label: "Profile", icon: "👤", path: "/owner-profile" },
  ];

  /* ── Shared input/select styles ── */
  const inputStyle = {
    width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, color: "#1e293b", background: "#f8fafc",
    fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 };
  const groupStyle = { display: "flex", flexDirection: "column", gap: 5 };
  const infoRowStyle = { display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" };
  const infoLabelStyle = { fontSize: 13, fontWeight: 600, color: "#64748b", minWidth: 130 };
  const infoValueStyle = { fontSize: 14, color: "#1e293b", fontWeight: 500 };

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

      {/* ========== MAIN ========== */}
      <div className={`sd-main ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div className="sd-navbar__title">
              <h1>Owner Profile</h1>
              <span className="sd-navbar__subtitle">Manage your account and shop settings</span>
            </div>
          </div>
          <div className="sd-navbar__right">
            <div className="sd-avatar">
              {profile?.profileImage
                ? <img src={`${API_BASE}/${profile.profileImage}`} alt="avatar" />
                : <span>{(profile?.username || "O")[0].toUpperCase()}</span>}
            </div>
            <div className="sd-navbar__staff-info">
              <span className="sd-navbar__name">{profile?.username || "Owner"}</span>
              <span className="sd-navbar__role">Owner</span>
            </div>
          </div>
        </header>

        <main className="sd-content">
          {/* Banner */}
          <div className="sd-welcome si-banner">
            <div>
              <h2>👤 Your Account</h2>
              <p>Update your personal info, shop details, password, and images.</p>
            </div>
          </div>

          {/* Stats mini-cards */}
          <div className="si-mini-cards">
            <div className="si-mini-card si-mini-card--blue">
              <span className="si-mini-card__icon">📦</span>
              <div>
                <div className="si-mini-card__num">{statistics.totalProducts}</div>
                <div className="si-mini-card__label">Total Products</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--green">
              <span className="si-mini-card__icon">📋</span>
              <div>
                <div className="si-mini-card__num">{statistics.totalOrders}</div>
                <div className="si-mini-card__label">Total Orders</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--orange">
              <span className="si-mini-card__icon">🚨</span>
              <div>
                <div className="si-mini-card__num">{statistics.lowStockProducts}</div>
                <div className="si-mini-card__label">Low Stock</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--red">
              <span className="si-mini-card__icon">🏪</span>
              <div>
                <div className="si-mini-card__num">{profile?.shopName ? 1 : 0}</div>
                <div className="si-mini-card__label">Shop Configured</div>
              </div>
            </div>
          </div>

          {/* Two-column layout for profile + shop */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

            {/* ── Profile Overview ── */}
            <div className="sd-panel">
              <div className="sd-panel__header" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>👤 Profile Details</h3>
                {!isEditingProfile && (
                  <button className="si-btn-submit" style={{ padding: "6px 16px", fontSize: 13 }} onClick={() => setIsEditingProfile(true)}>
                    ✏️ Edit
                  </button>
                )}
              </div>

              {/* Profile image */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
                {profile?.profileImage ? (
                  <img src={`${API_BASE}/${profile.profileImage}`} alt="Profile" style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "3px solid #e2e8f0" }} />
                ) : (
                  <div className="sd-avatar" style={{ width: 88, height: 88, fontSize: 34 }}>
                    <span>{(profile?.username || "O")[0].toUpperCase()}</span>
                  </div>
                )}
                <div style={{ marginTop: 10, textAlign: "center" }}>
                  <input type="file" id="profileImageInput" accept="image/*" style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onloadend = () => setProfileImagePreview(r.result); r.readAsDataURL(f); } }} />
                  <button className="si-btn-cancel" style={{ fontSize: 12, padding: "5px 14px" }}
                    onClick={() => document.getElementById("profileImageInput").click()}>
                    📷 Change Photo
                  </button>
                  {profileImagePreview && (
                    <div style={{ marginTop: 8 }}>
                      <img src={profileImagePreview} alt="preview" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid #3b82f6" }} />
                      <br />
                      <button className="si-btn-submit" style={{ fontSize: 12, padding: "5px 14px", marginTop: 6 }}
                        onClick={uploadProfileImage} disabled={uploading}>
                        {uploading ? "Uploading..." : "📤 Upload"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!isEditingProfile ? (
                <div>
                  <div style={infoRowStyle}><span style={infoLabelStyle}>Name</span><span style={infoValueStyle}>{profile?.username || "—"}</span></div>
                  <div style={infoRowStyle}><span style={infoLabelStyle}>Email</span><span style={infoValueStyle}>{profile?.email || "—"}</span></div>
                  <div style={infoRowStyle}><span style={infoLabelStyle}>Phone</span><span style={infoValueStyle}>{profile?.phone || "Not provided"}</span></div>
                  <div style={infoRowStyle}><span style={infoLabelStyle}>Role</span><span className="sd-badge badge-delivered">{profile?.role}</span></div>
                  <div style={{ ...infoRowStyle, borderBottom: "none" }}><span style={infoLabelStyle}>Member Since</span><span style={infoValueStyle}>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}</span></div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={groupStyle}>
                    <label style={labelStyle}>Name</label>
                    <input style={inputStyle} type="text" value={editFormData.username}
                      onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })} placeholder="Your name" />
                  </div>
                  <div style={groupStyle}>
                    <label style={labelStyle}>Email (read-only)</label>
                    <input style={{ ...inputStyle, background: "#f1f5f9", color: "#94a3b8" }} type="email" value={profile?.email} readOnly />
                  </div>
                  <div style={groupStyle}>
                    <label style={labelStyle}>Phone</label>
                    <input style={inputStyle} type="tel" value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} placeholder="Phone number" />
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button className="si-btn-cancel" onClick={handleProfileCancel}>Cancel</button>
                    <button className="si-btn-submit" onClick={handleProfileSave} disabled={loading}>✓ Save</button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Change Password ── */}
            <div className="sd-panel">
              <div className="sd-panel__header" style={{ marginBottom: 16 }}>
                <h3>🔐 Change Password</h3>
              </div>
              <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={groupStyle}>
                  <label style={labelStyle}>Current Password</label>
                  <input style={inputStyle} type="password" value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password" />
                </div>
                <div style={groupStyle}>
                  <label style={labelStyle}>New Password</label>
                  <input style={inputStyle} type="password" value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Min 6 characters" />
                </div>
                <div style={groupStyle}>
                  <label style={labelStyle}>Confirm Password</label>
                  <input style={inputStyle} type="password" value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password" />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" className="si-btn-submit" disabled={loading}>🔐 Change Password</button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Shop Information ── */}
          <div className="sd-panel">
            <div className="sd-panel__header" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>🏪 Shop Information</h3>
              {!isEditingShop && (
                <button className="si-btn-submit" style={{ padding: "6px 16px", fontSize: 13 }} onClick={() => setIsEditingShop(true)}>
                  ✏️ Edit Shop
                </button>
              )}
            </div>

            {/* Shop Logo */}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
              {profile?.shopLogo ? (
                <img src={`${API_BASE}/${profile.shopLogo}`} alt="Shop Logo" style={{ width: 70, height: 70, borderRadius: 12, objectFit: "cover", border: "2px solid #e2e8f0" }} />
              ) : (
                <div style={{ width: 70, height: 70, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🏪</div>
              )}
              <div>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>Upload or update your shop logo</p>
                <input type="file" id="shopLogoInput" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onloadend = () => setShopLogoPreview(r.result); r.readAsDataURL(f); } }} />
                <button className="si-btn-cancel" style={{ fontSize: 12, padding: "5px 14px" }}
                  onClick={() => document.getElementById("shopLogoInput").click()}>
                  📷 Choose Logo
                </button>
                {shopLogoPreview && (
                  <span style={{ marginLeft: 8 }}>
                    <button className="si-btn-submit" style={{ fontSize: 12, padding: "5px 14px" }}
                      onClick={uploadShopLogo} disabled={uploading}>
                      {uploading ? "Uploading..." : "📤 Upload"}
                    </button>
                  </span>
                )}
              </div>
            </div>

            {!isEditingShop ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                {[
                  ["Shop Name", profile?.shopName],
                  ["Shop Email", profile?.shopEmail],
                  ["Shop Phone", profile?.shopPhone],
                  ["Address", profile?.shopAddress],
                  ["Province", profile?.province],
                  ["District", profile?.district],
                  ["Municipality", profile?.municipality],
                  ["Ward", profile?.ward],
                ].map(([label, value]) => (
                  <div key={label} style={{ ...infoRowStyle, gridColumn: "auto" }}>
                    <span style={infoLabelStyle}>{label}</span>
                    <span style={infoValueStyle}>{value || "Not provided"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="si-form__grid" style={{ marginBottom: 16 }}>
                  {[
                    ["Shop Name", "text", "shopName", "Enter shop name"],
                    ["Shop Email", "email", "shopEmail", "shop@email.com"],
                    ["Shop Phone", "tel", "shopPhone", "Phone number"],
                    ["Shop Address", "text", "shopAddress", "Street address"],
                  ].map(([label, type, key, placeholder]) => (
                    <div key={key} style={groupStyle}>
                      <label style={labelStyle}>{label}</label>
                      <input style={inputStyle} type={type} value={shopFormData[key]}
                        onChange={(e) => setShopFormData({ ...shopFormData, [key]: e.target.value })}
                        placeholder={placeholder} />
                    </div>
                  ))}
                  <div style={groupStyle}>
                    <label style={labelStyle}>Province</label>
                    <select style={inputStyle} value={shopFormData.province}
                      onChange={(e) => setShopFormData({ ...shopFormData, province: e.target.value, district: "", municipality: "", ward: "" })}>
                      <option value="">Select Province</option>
                      {nepalData.provinces.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={groupStyle}>
                    <label style={labelStyle}>District</label>
                    <select style={inputStyle} value={shopFormData.district} disabled={!shopFormData.province}
                      onChange={(e) => setShopFormData({ ...shopFormData, district: e.target.value, municipality: "", ward: "" })}>
                      <option value="">Select District</option>
                      {(nepalData.districts[shopFormData.province] || []).map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div style={groupStyle}>
                    <label style={labelStyle}>Municipality</label>
                    <select style={inputStyle} value={shopFormData.municipality} disabled={!shopFormData.district}
                      onChange={(e) => setShopFormData({ ...shopFormData, municipality: e.target.value, ward: "" })}>
                      <option value="">Select Municipality</option>
                      {(nepalData.municipalities[shopFormData.district] || []).map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div style={groupStyle}>
                    <label style={labelStyle}>Ward</label>
                    <input style={inputStyle} type="number" min="1" max="32" value={shopFormData.ward}
                      onChange={(e) => setShopFormData({ ...shopFormData, ward: e.target.value })} placeholder="Ward number" />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button className="si-btn-cancel" onClick={handleShopCancel}>Cancel</button>
                  <button className="si-btn-submit" onClick={handleShopSave} disabled={loading}>✓ Save Shop Info</button>
                </div>
              </div>
            )}
          </div>

          {/* Low stock alert */}
          {statistics.lowStockDetails.length > 0 && (
            <div className="sd-panel si-table-panel">
              <div className="sd-panel__header" style={{ marginBottom: 12 }}>
                <h3>🚨 Low Stock Products</h3>
              </div>
              <div className="si-table-wrap">
                <table className="si-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.lowStockDetails.map((p) => (
                      <tr key={p._id}>
                        <td className="si-product-name">{p.name}</td>
                        <td><span className="si-qty low">{p.quantity}</span></td>
                        <td className="si-price-cell">NPR {(p.price ?? 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* TOAST */}
      {toast.visible && (
        <div className={`sd-toast sd-toast--${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default OwnerProfile;
