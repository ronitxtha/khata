import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/staffProfile.css";
import StaffSidebar from "../components/StaffSidebar";

const API_BASE = "http://localhost:8000";
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken")}` });

const formatTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const StaffProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // ── State ────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });

  // Profile Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Image Upload
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Password Change
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  // Performance/Attendance
  const [attendance, setAttendance] = useState(null);
  const [weekData, setWeekData] = useState([]);

  const showToast = (message, type = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  };

  // ── Fetch on mount ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
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
        showToast("Failed to load profile data", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Profile handlers ─────────────────────────────────────────
  const handleEditClick = () => {
    setEditUsername(staff.username || "");
    setEditPhone(staff.phone || "");
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
    if (!imageFile) return true;
    try {
      const fd = new FormData();
      fd.append("profileImage", imageFile);
      const res = await axios.post(`${API_BASE}/api/staff/upload-profile-image`, fd, {
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
    if (!editUsername.trim()) { showToast("Name cannot be empty", "error"); return; }
    try {
      setSavingProfile(true);
      const res = await axios.put(`${API_BASE}/api/staff/profile`, { username: editUsername.trim(), phone: editPhone.trim() }, { headers: getAuthHeaders() });
      setStaff((prev) => ({ ...prev, username: res.data.staff.username, phone: res.data.staff.phone }));
      
      const imgUploadSuccess = await uploadSelectedImage();

      if (imgUploadSuccess) {
        setIsEditing(false);
        setImagePreview(null);
        setImageFile(null);
        showToast("Profile updated successfully!");
      }
    } catch (err) { showToast(err.response?.data?.message || "Update failed", "error"); }
    finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = pwForm;
    if (!currentPassword || !newPassword || !confirmPassword) { showToast("All fields required", "error"); return; }
    if (newPassword.length < 6) { showToast("Min 6 characters required", "error"); return; }
    if (newPassword !== confirmPassword) { showToast("Passwords do not match", "error"); return; }

    try {
      setSavingPassword(true);
      await axios.put(`${API_BASE}/api/staff/change-password`, { currentPassword, newPassword }, { headers: getAuthHeaders() });
      showToast("Security key updated!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) { showToast(err.response?.data?.message || "Update failed", "error"); }
    finally { setSavingPassword(false); }
  };

  const handleLogout = async () => {
    try { await axios.post(`${API_BASE}/api/staff/logout-click`, {}, { headers: getAuthHeaders() }); } 
    catch (err) { console.error(err); }
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="sd-layout od-modern-layout">
        <StaffSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} staff={staff} handleLogout={handleLogout} />
        <div className={`sd-main od-main-content ${sidebarOpen ? "sd-main--shifted" : ""}`}>
          <main className="sd-content od-content">
            <div className="si-ledger-table-wrap" style={{ padding: '80px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 24px' }} />
              <p style={{ fontWeight: 600, color: '#64748b' }}>Syncing profile workspace...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const avatarDisplay = imagePreview || (staff?.profileImage ? `${API_BASE}/${staff.profileImage}` : null);

  return (
    <div className="sd-layout od-modern-layout">
      <StaffSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} staff={staff} handleLogout={handleLogout} />

      <div className={`sd-main od-main-content ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        {/* ---- NAVBAR ---- */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button 
              className="sd-navbar__hamburger" 
              onClick={() => setSidebarOpen((v) => !v)}
              onMouseEnter={() => { if (window.sidebarTimer) clearTimeout(window.sidebarTimer); setSidebarOpen(true); }}
              onMouseLeave={() => { window.sidebarTimer = setTimeout(() => setSidebarOpen(false), 300); }}
            >
              ☰
            </button>
            <div className="sd-navbar__title">
              <h1>Personal Profile</h1>
              <span className="sd-navbar__subtitle">Manage your employee credentials</span>
            </div>
          </div>
          <div className="sd-navbar__right">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="sd-avatar">
                {staff?.profileImage ? (
                  <img src={`${API_BASE}/${staff.profileImage}`} alt="avatar" />
                ) : (
                  <span>{(staff?.username || "S")[0].toUpperCase()}</span>
                )}
              </div>
              <div className="sd-navbar__staff-info">
                <span className="sd-navbar__name">{staff?.username || "Staff"}</span>
                <span className="sd-navbar__role">Active Session</span>
              </div>
            </div>
          </div>
        </header>

        <main className="sd-content od-content">
          <div className="si-header-section">
            <div className="si-header-info">
              <h2>Account Workspace</h2>
              <p>Keep your performance logs and security credentials up to date.</p>
            </div>
          </div>

          <div className="sp-profile-canvas">
            <div className="sp-main-column">
              {/* 1. IDENTITY CARD */}
              <div className="si-ledger-table-wrap sp-card">
                <div className="sp-card-header">
                  <h3>👤 Identity Details</h3>
                  {!isEditing && (
                    <button className="buy-btn mini" onClick={handleEditClick}>Edit Identity</button>
                  )}
                </div>
                
                <div className="sp-card-body">
                  <div className="sp-avatar-hero">
                    <div className="sp-avatar-wrapper">
                      {avatarDisplay ? (
                        <img src={avatarDisplay} alt="Profile" className="sp-avatar-img" />
                      ) : (
                        <div className="sp-avatar-placeholder">{(staff?.username || "S")[0].toUpperCase()}</div>
                      )}
                      {isEditing && (
                        <button className="sp-avatar-upload-btn" onClick={() => fileInputRef.current?.click()} title="Update Photo">📷</button>
                      )}
                      <input type="file" ref={fileInputRef} onChange={handleImageSelect} hidden accept="image/*" />
                    </div>
                    <div className="sp-hero-info">
                      <span className="sp-role-tag">{staff?.role || "STAFF"}</span>
                      <h2 className="sp-hero-name">{staff?.username}</h2>
                      <p className="sp-hero-email">{staff?.email}</p>
                    </div>
                  </div>

                  {!isEditing ? (
                    <div className="sp-info-grid">
                      <div className="sp-grid-field">
                        <label>LEGAL NAME</label>
                        <span>{staff?.username || "—"}</span>
                      </div>
                      <div className="sp-grid-field">
                        <label>CONTACT MOBILE</label>
                        <span>{staff?.phone || "Not provided"}</span>
                      </div>
                      <div className="sp-grid-field">
                        <label>JOINED ON</label>
                        <span>{formatDate(staff?.createdAt)}</span>
                      </div>
                      <div className="sp-grid-field">
                        <label>EMPLOYEE ID</label>
                        <span>#{staff?._id?.slice(-6).toUpperCase()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="sp-edit-form">
                      <div className="si-form__group">
                        <label>Display Name</label>
                        <input className="modern-input" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="Full name" />
                      </div>
                      <div className="si-form__group">
                        <label>Primary Phone</label>
                        <input className="modern-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+977-XXXXXXXXXX" />
                      </div>
                      <div className="cp-edit-actions" style={{ marginTop: '24px' }}>
                        <button className="buy-btn" onClick={handleSaveProfile} disabled={savingProfile}>
                          {savingProfile ? "SAVING..." : "SAVE CHANGES"}
                        </button>
                        <button className="show-all-btn" onClick={handleCancelEdit}>CANCEL</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* WEEKLY ACTIVITY */}
              {weekData.length > 0 && (
                <div className="si-ledger-table-wrap sp-card">
                  <div className="sp-card-header">
                    <h3>📈 Performance History</h3>
                  </div>
                  <table className="si-ledger-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Clock In</th>
                        <th>Clock Out</th>
                        <th>Duration</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekData.slice(0, 5).map((rec, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700 }}>{formatDate(rec.date)}</td>
                          <td>{formatTime(rec.checkIn)}</td>
                          <td>{rec.checkOut ? formatTime(rec.checkOut) : "—"}</td>
                          <td>{rec.totalHours} hrs</td>
                          <td>
                            <span className={`ledger-status-tag ${rec.status === "Present" ? "present" : "absent"}`}>
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="sp-table-footer">
                    <button className="show-all-btn mini" onClick={() => navigate("/staff-attendance")}>View Full Attendance Ledger →</button>
                  </div>
                </div>
              )}
            </div>

            <div className="sp-side-column">
              {/* SECURITY KEY */}
              <div className="si-ledger-table-wrap sp-card">
                <div className="sp-card-header">
                  <h3>🔐 Security Key</h3>
                </div>
                <form className="sp-security-form" onSubmit={handlePasswordChange}>
                  <div className="si-form__group">
                    <label>Current Key</label>
                    <input className="modern-input" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({...pwForm, currentPassword: e.target.value})} placeholder="••••••••" />
                  </div>
                  <div className="si-form__group">
                    <label>New Secret Key</label>
                    <input className="modern-input" type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({...pwForm, newPassword: e.target.value})} placeholder="Min 6 chars" />
                  </div>
                  <div className="si-form__group">
                    <label>Confirm Key</label>
                    <input className="modern-input" type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({...pwForm, confirmPassword: e.target.value})} placeholder="Re-enter key" />
                  </div>
                  <button type="submit" className="buy-btn" style={{ width: '100%', marginTop: '12px' }} disabled={savingPassword}>
                    {savingPassword ? "UPDATING..." : "UPDATE NEW KEY"}
                  </button>
                </form>
              </div>

              {/* TODAY'S SESSION */}
              <div className="si-ledger-table-wrap sp-card">
                <div className="sp-card-header">
                  <h3>📅 Today's Session</h3>
                </div>
                <div className="sp-session-body">
                  {attendance ? (
                    <div className="sp-session-grid">
                      <div className="sp-session-pill">
                        <label>START</label>
                        <span>{formatTime(attendance.checkInTime)}</span>
                      </div>
                      <div className="sp-session-pill">
                        <label>END</label>
                        <span className={attendance.isStillWorking ? "active" : ""}>
                          {attendance.isStillWorking ? "Active Now" : formatTime(attendance.checkOutTime)}
                        </span>
                      </div>
                      <div className="sp-session-total">
                        <label>TOTAL HOURS LOGGED</label>
                        <span className="hours">{attendance.totalHours}<small>h</small></span>
                      </div>
                    </div>
                  ) : (
                    <div className="sp-empty-state">
                      <p>No active session found for today.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {toast.visible && <div className={`sd-toast sd-toast--${toast.type}`}>{toast.message}</div>}
    </div>
  );
};

export default StaffProfile;
