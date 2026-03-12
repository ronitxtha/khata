import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/staffDashboard.css";
import "../styles/staffProfile.css";

const API_BASE = "http://localhost:8000";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

// ─── Format Helpers ──────────────────────────────────────────
const formatTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const StaffProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // ── State ──
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });

  // Profile edit
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Image upload
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Password change
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // Attendance
  const [attendance, setAttendance] = useState(null);
  const [weekData, setWeekData] = useState([]);

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  };

  // ── Fetch on mount ──
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [profileRes, attendanceRes] = await Promise.all([
          axios.get(`${API_BASE}/api/staff/profile`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE}/api/staff/today-attendance`, { headers: getAuthHeaders() }),
        ]);

        const s = profileRes.data.staff;
        setStaff(s);
        setEditUsername(s.username || "");
        setEditPhone(s.phone || "");

        setAttendance(attendanceRes.data.today);
        setWeekData(attendanceRes.data.week || []);
      } catch (err) {
        console.error(err);
        showToast("Failed to load profile data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Profile Edit ──
  const handleEditClick = () => {
    setEditUsername(staff.username || "");
    setEditPhone(staff.phone || "");
    setImagePreview(null);
    setImageFile(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setImagePreview(null);
    setImageFile(null);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const uploadSelectedImage = async () => {
    if (!imageFile) return true; // nothing to upload
    try {
      const formData = new FormData();
      formData.append("profileImage", imageFile);
      const res = await axios.post(`${API_BASE}/api/staff/upload-profile-image`, formData, {
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
      });
      setStaff((prev) => ({ ...prev, profileImage: res.data.profileImage }));
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || "Image upload failed", "error");
      return false;
    }
  };

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }
    try {
      setSavingProfile(true);
      const res = await axios.put(
        `${API_BASE}/api/staff/profile`,
        { username: editUsername.trim(), phone: editPhone.trim() },
        { headers: getAuthHeaders() }
      );
      setStaff((prev) => ({ ...prev, username: res.data.staff.username, phone: res.data.staff.phone }));
      
      const imgUploadSuccess = await uploadSelectedImage();

      if (imgUploadSuccess) {
        setIsEditing(false);
        setImagePreview(null);
        setImageFile(null);
        showToast("Profile updated successfully!");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Password Change ──
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = pwForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("All password fields are required", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    try {
      setSavingPassword(true);
      await axios.put(
        `${API_BASE}/api/staff/change-password`,
        { currentPassword, newPassword },
        { headers: getAuthHeaders() }
      );
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password changed successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Password change failed", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Logout ──
  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/api/staff/logout-click`, {}, { headers: getAuthHeaders() });
    } catch (err) { console.error(err); }
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  const navLinks = [
    { label: "Dashboard", icon: "🏠", path: "/staff-dashboard" },
    { label: "Product Management", icon: "📦", path: "/staff-inventory" },
    { label: "Orders", icon: "🛒", path: "/order-management" },
    { label: "Attendance", icon: "📅", path: "/staff-attendance" },
    { label: "Profile", icon: "👤", path: "/staff-profile" },
  ];

  const currentAvatarSrc = imagePreview || (staff?.profileImage ? `${API_BASE}/${staff.profileImage}` : null);

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
        {/* ---- NAVBAR ---- */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div className="sd-navbar__title">
              <h1>My Profile</h1>
              <span className="sd-navbar__subtitle">Manage your personal information</span>
            </div>
          </div>
          <div className="sd-navbar__right">
            <div className="sd-avatar">
              {currentAvatarSrc ? (
                <img src={currentAvatarSrc} alt="avatar" />
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
          {loading ? (
            <div className="sp-loading">
              <div className="sp-spinner"></div>
              <p>Loading profile...</p>
            </div>
          ) : (
            <div className="sp-grid">
              
              {/* ==== LEFT COLUMN ==== */}
              <div className="sp-col">
                
                {/* 1. PROFILE INFO CARD */}
                <div className="sd-panel sp-card">
                  <div className="sd-panel__header">
                    <h3>👤 Profile Information</h3>
                    {!isEditing && (
                      <button className="sp-link-btn" onClick={handleEditClick}>
                        ✏️ Edit
                      </button>
                    )}
                  </div>
                  <div className="sp-profile-overview">
                    <div className="sp-avatar-wrapper">
                      {currentAvatarSrc ? (
                        <img src={currentAvatarSrc} alt="Profile" className="sp-avatar-large" />
                      ) : (
                        <div className="sp-avatar-placeholder-large">
                          {(staff?.username || "S")[0].toUpperCase()}
                        </div>
                      )}

                      {/* Edit overlay with camera icon */}
                      {isEditing && (
                        <div
                          className="sp-avatar-overlay"
                          onClick={() => fileInputRef.current?.click()}
                          title="Change Profile Picture"
                        >
                          📷
                        </div>
                      )}
                      
                      <input
                        id="sp-file-input"
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        hidden
                      />
                    </div>

                    <div className="sp-info-list">
                      <div className="sp-info-row">
                        <label>Full Name</label>
                        {isEditing ? (
                          <input type="text" className="sp-input" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
                        ) : (
                          <span>{staff?.username || "—"}</span>
                        )}
                      </div>
                      <div className="sp-info-row">
                        <label>Phone</label>
                        {isEditing ? (
                          <input type="tel" className="sp-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                        ) : (
                          <span>{staff?.phone || <em className="sp-empty">Not set</em>}</span>
                        )}
                      </div>
                      <div className="sp-info-row">
                        <label>Email</label>
                        <span className="sp-readonly">{staff?.email || "—"}</span>
                      </div>
                      <div className="sp-info-row">
                        <label>Role</label>
                        <span className="sd-badge badge-processing">Staff</span>
                      </div>
                      <div className="sp-info-row">
                        <label>Member Since</label>
                        <span className="sp-readonly">{formatDate(staff?.createdAt)}</span>
                      </div>

                      {isEditing && (
                        <div className="sp-edit-actions">
                          <button className="sp-btn-cancel" onClick={handleCancelEdit}>Cancel</button>
                          <button className="sp-btn-save" onClick={handleSaveProfile} disabled={savingProfile}>
                            {savingProfile ? "Saving..." : "💾 Save Changes"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. SECURITY CARD */}
                <div className="sd-panel sp-card">
                  <div className="sd-panel__header">
                    <h3>🔒 Change Password</h3>
                  </div>
                  <form className="sp-form" onSubmit={handlePasswordChange}>
                    <div className="sp-form-group">
                      <label>Current Password</label>
                      <div className="sp-input-eye">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          className="sp-input"
                          value={pwForm.currentPassword}
                          onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                        />
                        <button type="button" onClick={() => setShowPasswords((s) => ({ ...s, current: !s.current }))}>
                          {showPasswords.current ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>
                    <div className="sp-form-group">
                      <label>New Password</label>
                      <div className="sp-input-eye">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          className="sp-input"
                          value={pwForm.newPassword}
                          onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                        />
                        <button type="button" onClick={() => setShowPasswords((s) => ({ ...s, new: !s.new }))}>
                          {showPasswords.new ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>
                    <div className="sp-form-group">
                      <label>Confirm Password</label>
                      <div className="sp-input-eye">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          className="sp-input"
                          value={pwForm.confirmPassword}
                          onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                        />
                        <button type="button" onClick={() => setShowPasswords((s) => ({ ...s, confirm: !s.confirm }))}>
                          {showPasswords.confirm ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="sp-btn-save sp-pw-btn" disabled={savingPassword}>
                      {savingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </form>
                </div>

              </div>

              {/* ==== RIGHT COLUMN ==== */}
              <div className="sp-col">
                
                {/* 3. ATTENDANCE SUMMARY */}
                <div className="sd-panel sp-card sp-attendance-card">
                  <div className="sd-panel__header">
                    <h3>📅 Today's Attendance</h3>
                  </div>
                  {attendance ? (
                    <div className="sp-att-stats">
                      <div className="sp-att-stat">
                        <div className="sp-att-icon">🟢</div>
                        <div>
                          <p className="sp-att-label">Login</p>
                          <p className="sp-att-val">{formatTime(attendance.checkInTime)}</p>
                        </div>
                      </div>
                      <div className="sp-att-stat">
                        <div className="sp-att-icon">🔴</div>
                        <div>
                          <p className="sp-att-label">Logout</p>
                          <p className="sp-att-val">
                            {attendance.isStillWorking ? "Still working..." : formatTime(attendance.checkOutTime)}
                          </p>
                        </div>
                      </div>
                      <div className="sp-att-stat">
                        <div className="sp-att-icon">⏱️</div>
                        <div>
                          <p className="sp-att-label">Hours</p>
                          <p className="sp-att-val">{attendance.totalHours}h</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="sd-empty sp-att-empty">
                      <span>📋</span>
                      <p>No attendance record for today.</p>
                    </div>
                  )}

                  {weekData.length > 0 && (
                    <div className="sp-week-table-wrap">
                      <h4 className="sp-week-title">Last 7 Days</h4>
                      <table className="sp-week-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Login</th>
                            <th>Logout</th>
                            <th>Hrs</th>
                            <th>Stat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {weekData.slice(0, 5).map((rec, idx) => (
                            <tr key={idx}>
                              <td>{formatDate(rec.date)}</td>
                              <td>{formatTime(rec.checkIn)}</td>
                              <td>{rec.checkOut ? formatTime(rec.checkOut) : "—"}</td>
                              <td>{rec.totalHours}</td>
                              <td>
                                <span className={rec.status === "Present" ? "sp-status-green" : "sp-status-red"}>
                                  {rec.status === "Present" ? "P" : "A"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========== TOAST ========== */}
      {toast.visible && (
        <div className={`sd-toast sd-toast--${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default StaffProfile;
