import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/ownerProfile.css";
import OwnerSidebar from "../components/OwnerSidebar";

const API_BASE = "http://localhost:8000";

const OwnerProfile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({ 
    totalProducts: 0, 
    totalOrders: 0, 
    lowStockProducts: 0, 
    outOfStockProducts: 0,
    lowStockDetails: [] 
  });

  // Notifications (Mockup state)
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

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

  const uploadProfileImage = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("profileImage", file);
      await axios.post(`${API_BASE}/api/owner/upload-profile-image`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }, withCredentials: true,
      });
      showToast("Profile image updated");
      setProfileImagePreview(null);
      fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.message || "Upload failed", "error");
    } finally { setUploading(false); }
  };

  const uploadShopLogo = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("shopLogo", file);
      await axios.post(`${API_BASE}/api/owner/upload-shop-logo`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }, withCredentials: true,
      });
      showToast("Shop logo updated");
      setShopLogoPreview(null);
      fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.message || "Logo upload failed", "error");
    } finally { setUploading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const memberSinceDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "January 12, 2023";
  const memberDuration = " (14 months)";

  return (
    <div className="sd-layout od-modern-layout">
      {/* Shared Owner Sidebar */}
      <OwnerSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        owner={profile} 
        handleLogout={handleLogout} 
      />

      {/* ========== MAIN ========== */}
      <div className={`sd-main od-main-content ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        
        {/* Global Navbar */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)} onMouseEnter={() => { if (window.sidebarTimer) clearTimeout(window.sidebarTimer); setSidebarOpen(true); }} onMouseLeave={() => { window.sidebarTimer = setTimeout(() => setSidebarOpen(false), 300); }}>☰</button>
            <div className="sd-navbar__title">
              <h1>Owner Profile</h1>
              <span className="sd-navbar__subtitle">Manage your personal and shop credentials</span>
            </div>
          </div>
          
          <div className="sd-navbar__right">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="sd-avatar">
                {profile?.profileImage ? (
                  <img src={`${API_BASE}/${profile.profileImage}`} alt="avatar" />
                ) : (
                  <span>{(profile?.username || "O")[0].toUpperCase()}</span>
                )}
              </div>
              <div className="sd-navbar__staff-info">
                <span className="sd-navbar__name">{profile?.username || "Owner"}</span>
                <span className="sd-navbar__role">Owner</span>
              </div>
            </div>
          </div>
        </header>
        

        <div className="op-container">
          
          {/* Consolidated Header with Profile Card */}
          <header className="op-page-header">
            <div className="op-header-text">
              <span className="op-breadcrumb">Settings / Account</span>
              <h2 className="op-title">Account Overview</h2>
              <p className="op-subtitle">Manage your personal information and shop credentials</p>
            </div>

            <div className="op-profile-floating-card">
              <div className="op-avatar-wrapper" onClick={() => document.getElementById("profileImageInput").click()} title="Change Profile Image">
                {profile?.profileImage || profileImagePreview ? (
                  <img src={profileImagePreview || `${API_BASE}/${profile.profileImage}`} alt="profile" className="op-avatar-img" />
                ) : (
                  <div className="op-avatar-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: '#94a3b8' }}>
                    {(profile?.username || "O")[0].toUpperCase()}
                  </div>
                )}
                <div className="op-avatar-edit-icon">✏️</div>
                <input type="file" id="profileImageInput" hidden onChange={(e) => { const f = e.target.files[0]; if (f) uploadProfileImage(f); }} />
              </div>
              
              <div className="op-profile-info">
                <h3>{profile?.username || "Ronit Shrestha"}</h3>
                <p>Main Administrator • {profile?.shopName || "Trending Store"}</p>
              </div>
            </div>
          </header>

          {/* Stats Bar */}
          <div className="op-stats-grid">
            <div className="op-stat-card">
              <span className="op-stat-label">Total Products</span>
              <div className="op-stat-value-group">
                <span className="op-stat-num">{statistics.totalProducts?.toLocaleString() || "0"}</span>
              </div>
            </div>
            <div className="op-stat-card">
              <span className="op-stat-label">Total Orders</span>
              <div className="op-stat-value-group">
                <span className="op-stat-num">{statistics.totalOrders?.toLocaleString() || "0"}</span>
              </div>
            </div>
            <div className="op-stat-card op-stat-card--danger">
              <span className="op-stat-label">Low Stock</span>
              <div className="op-stat-value-group" style={{ justifyContent: 'space-between', width: '100%' }}>
                <span className="op-stat-num">{statistics.lowStockProducts || "0"}</span>
              </div>
            </div>
            <div className="op-stat-card op-stat-card--dark">
              <span className="op-stat-label">Out of Stock</span>
              <div className="op-stat-value-group">
                <span className="op-stat-num">{Number(statistics.outOfStockProducts || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="op-main-grid">
            
            {/* Left Column */}
            <div className="op-col-left">
              <section style={{ marginBottom: '40px' }}>
                <div className="op-section-header">
                  <h2 className="op-section-title">Profile Details</h2>
                  {!isEditingProfile && (
                    <button className="op-edit-link" onClick={() => setIsEditingProfile(true)}>Edit Details</button>
                  )}
                </div>
                <div className="op-details-card">
                  {isEditingProfile ? (
                    <div className="op-form-grid">
                       <div className="op-form-row">
                          <div className="op-input-group">
                             <label className="op-input-label">Full Name</label>
                             <input className="op-input" value={editFormData.username} onChange={(e) => setEditFormData({...editFormData, username: e.target.value})} />
                          </div>
                          <div className="op-input-group">
                             <label className="op-input-label">Phone Number</label>
                             <input className="op-input" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} />
                          </div>
                       </div>
                       <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                          <button className="op-submit-btn" onClick={handleProfileSave}>Save Changes</button>
                          <button className="op-submit-btn" style={{ background: '#f1f5f9', color: '#64748b' }} onClick={handleProfileCancel}>Cancel</button>
                       </div>
                    </div>
                  ) : (
                    <>
                      <div className="op-info-grid">
                        <div className="op-info-field">
                          <span className="op-info-label">Full Name</span>
                          <span className="op-info-value">{profile?.username || "Arjun Sharma"}</span>
                        </div>
                        <div className="op-info-field">
                          <span className="op-info-label">Email Address</span>
                          <span className="op-info-value">{profile?.email || "arjun.sharma@khata.com"}</span>
                        </div>
                        <div className="op-info-field">
                          <span className="op-info-label">Phone Number</span>
                          <span className="op-info-value">{profile?.phone || "+977 14423000"}</span>
                        </div>
                        <div className="op-info-field">
                          <span className="op-info-label">Account Role</span>
                          <span className="op-info-badge">{profile?.role?.toUpperCase() || "OWNER"}</span>
                        </div>
                      </div>
                      <div className="op-member-since">
                         <span className="op-info-label">Member Since</span>
                         <p style={{ margin: '8px 0 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                           {memberSinceDate} {memberDuration}
                         </p>
                      </div>
                    </>
                  )}
                </div>
              </section>

              <section>
                <h2 className="op-section-title" style={{ marginBottom: '24px' }}>Security</h2>
                <div className="op-security-card">
                  <form className="op-form-grid" onSubmit={handlePasswordChange}>
                    <div className="op-input-group">
                       <label className="op-input-label">Current Password</label>
                       <input className="op-input" type="password" placeholder="••••••••••••" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} />
                    </div>
                    <div className="op-form-row">
                       <div className="op-input-group">
                          <label className="op-input-label">New Password</label>
                          <input className="op-input" type="password" placeholder="••••••••••••" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} />
                       </div>
                       <div className="op-input-group">
                          <label className="op-input-label">Confirm Password</label>
                          <input className="op-input" type="password" placeholder="••••••••••••" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
                       </div>
                    </div>
                    <button type="submit" className="op-submit-btn">Update Password</button>
                  </form>
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="op-col-right">
              <h2 className="op-section-title" style={{ marginBottom: '24px' }}>Shop Information</h2>
              <div className="op-shop-card">
                <div className="op-logo-box" onClick={() => document.getElementById("shopLogoInput").click()}>
                   {profile?.shopLogo ? (
                     <img src={`${API_BASE}/${profile.shopLogo}`} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                   ) : (
                     <>
                        <div className="op-logo-icon">🏪</div>
                        <span className="op-logo-text">SHOP LOGO<br/>PNG or SVG up to 2MB</span>
                     </>
                   )}
                   <input type="file" id="shopLogoInput" hidden onChange={(e) => { const f = e.target.files[0]; if (f) uploadShopLogo(f); }} />
                </div>

                {!isEditingShop ? (
                  <>
                    <h3 className="op-shop-name">{profile?.shopName || "Khata Retail Solutions"}</h3>
                    <div className="op-shop-contact">
                       <span className="op-info-label">Business Contact</span>
                       <p>{profile?.shopEmail || "contact@khata-retail.com.np"}</p>
                       <p>{profile?.shopPhone || "+977 1 4423000"}</p>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <span className="op-info-label">Address Details</span>
                    </div>
                    <div className="op-address-grid">
                       <div className="op-address-tile">
                          <span className="op-address-label">Province</span>
                          <span className="op-address-value">{profile?.province || "Bagmati"}</span>
                       </div>
                       <div className="op-address-tile">
                          <span className="op-address-label">District</span>
                          <span className="op-address-value">{profile?.district || "Kathmandu"}</span>
                       </div>
                       <div className="op-address-tile">
                          <span className="op-address-label">Municipality</span>
                          <span className="op-address-value">{profile?.municipality || "Kathmandu Metro"}</span>
                       </div>
                       <div className="op-address-tile">
                          <span className="op-address-label">Ward</span>
                          <span className="op-address-value">Ward No. {profile?.ward || "10"}</span>
                       </div>
                    </div>
                    <button className="op-configure-btn" onClick={() => setIsEditingShop(true)}>Configure Shop Metadata</button>
                  </>
                ) : (
                   <div className="op-form-grid">
                      <div className="op-input-group">
                         <label className="op-input-label">Shop Name</label>
                         <input className="op-input" value={shopFormData.shopName} onChange={(e) => setShopFormData({...shopFormData, shopName: e.target.value})} />
                      </div>
                      <div className="op-input-group">
                         <label className="op-input-label">Shop Email</label>
                         <input className="op-input" value={shopFormData.shopEmail} onChange={(e) => setShopFormData({...shopFormData, shopEmail: e.target.value})} />
                      </div>

                      {/* Updated Image Upload in Settings */}
                      <div className="op-input-group">
                         <label className="op-input-label">Update Shop Photo</label>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                            <div className="op-logo-preview-mini" style={{ width: '48px', height: '48px', borderRadius: '4px', overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => document.getElementById("shopLogoInputSettings").click()}>
                               {profile?.shopLogo ? (
                                 <img src={`${API_BASE}/${profile.shopLogo}`} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                               ) : (
                                 <span style={{ fontSize: '18px' }}>🏪</span>
                               )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                               <button type="button" className="op-edit-link" style={{ padding: 0 }} onClick={() => document.getElementById("shopLogoInputSettings").click()}>Click to upload new photo</button>
                               <span style={{ fontSize: '10px', color: '#94a3b8' }}>PNG, JPG or SVG (Max. 2MB)</span>
                            </div>
                            <input type="file" id="shopLogoInputSettings" hidden onChange={(e) => { const f = e.target.files[0]; if (f) uploadShopLogo(f); }} />
                         </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <button className="op-submit-btn" onClick={handleShopSave}>Save</button>
                        <button className="op-submit-btn" style={{ background: '#fff', color: '#64748b', border: '1px solid #e2e8f0' }} onClick={handleShopCancel}>Cancel</button>
                      </div>
                   </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast.visible && (
        <div className={`sd-toast sd-toast--${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default OwnerProfile;
