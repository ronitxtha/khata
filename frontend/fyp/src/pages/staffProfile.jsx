import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import "../styles/ownerProfile.css";
import "../styles/ownerDashboard.css";
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
      <div className="od-shell">
        <StaffSidebar staff={staff} />
        <div className="od-main">
          <main className="od-content">
            <div className="si-ledger-table-wrap" style={{ padding: '80px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 24px' }} />
              <p style={{ fontWeight: 600, color: '#64748b' }}>Syncing profile workspace...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const avatarDisplay = imagePreview || (staff?.profileImage ? imgUrl(staff.profileImage) : null);

  return (
    <div className="od-shell">
      <StaffSidebar staff={staff} />

      <div className="od-main">
        {/* ---- NAVBAR ---- */}
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">Personal Profile</h1>
            <div className="od-topbar__date">Manage your employee credentials</div>
          </div>
          <div className="od-topbar__right">
            <div className="od-topbar__profile">
              <div className="od-topbar__avatar">
                {staff?.profileImage ? (
                  <img src={imgUrl(staff.profileImage)} alt="avatar" />
                ) : (
                  <span>{(staff?.username || "S")[0].toUpperCase()}</span>
                )}
              </div>
            </div>
            <button className="od-topbar__logout" onClick={handleLogout} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </header>

        <main className="od-content">
          <div className="op-container">
            <header className="op-page-header">
              <div className="op-header-text">
                <span className="op-breadcrumb">Settings / Account</span>
                <h2 className="op-title">Account Workspace</h2>
                <p className="op-subtitle">Keep your performance logs and security credentials up to date.</p>
              </div>

              <div className="op-profile-floating-card">
                <div className="op-avatar-wrapper" onClick={() => fileInputRef.current?.click()} title="Change Profile Image">
                  {avatarDisplay ? (
                    <img src={avatarDisplay} alt="profile" className="op-avatar-img" />
                  ) : (
                    <div className="op-avatar-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: '#94a3b8' }}>
                      {(staff?.username || "S")[0].toUpperCase()}
                    </div>
                  )}
                  {isEditing && <div className="op-avatar-edit-icon">✏️</div>}
                  <input type="file" ref={fileInputRef} hidden onChange={handleImageSelect} accept="image/*" />
                </div>
                
                <div className="op-profile-info">
                  <h3>{staff?.username || "Staff"}</h3>
                  <p style={{textTransform: 'uppercase'}}>{staff?.role || "STAFF"} • {staff?.email}</p>
                </div>
              </div>
            </header>

            <div className="op-main-grid">
              <div className="op-col-left">
                {/* IDENTITY CARD */}
                <section style={{ marginBottom: '40px' }}>
                  <div className="op-section-header">
                    <h2 className="op-section-title">Identity Details</h2>
                    {!isEditing && (
                      <button className="op-edit-link" onClick={handleEditClick}>Edit Identity</button>
                    )}
                  </div>
                  <div className="op-details-card">
                    {/* removed redundant avatar block */}

                    {!isEditing ? (
                      <>
                        <div className="op-info-grid">
                          <div className="op-info-field">
                            <span className="op-info-label">Legal Name</span>
                            <span className="op-info-value">{staff?.username || "—"}</span>
                          </div>
                          <div className="op-info-field">
                            <span className="op-info-label">Contact Mobile</span>
                            <span className="op-info-value">{staff?.phone || "Not provided"}</span>
                          </div>
                          <div className="op-info-field">
                            <span className="op-info-label">Joined On</span>
                            <span className="op-info-value">{formatDate(staff?.createdAt)}</span>
                          </div>
                          <div className="op-info-field">
                            <span className="op-info-label">Employee ID</span>
                            <span className="op-info-badge">#{staff?._id?.slice(-6).toUpperCase()}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="op-form-grid">
                        <div className="op-form-row">
                          <div className="op-input-group">
                            <label className="op-input-label">Display Name</label>
                            <input className="op-input" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="Full name" />
                          </div>
                          <div className="op-input-group">
                            <label className="op-input-label">Primary Phone</label>
                            <input className="op-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+977-XXXXXXXXXX" />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                          <button className="op-submit-btn" onClick={handleSaveProfile} disabled={savingProfile}>
                            {savingProfile ? "Saving..." : "Save Changes"}
                          </button>
                          <button className="op-submit-btn" style={{ background: '#f1f5f9', color: '#64748b' }} onClick={handleCancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* WEEKLY ACTIVITY */}
                {weekData.length > 0 && (
                  <section>
                    <div className="op-section-header">
                      <h2 className="op-section-title">Performance History</h2>
                      <button className="op-edit-link" onClick={() => navigate("/staff-attendance")}>View Full Ledger</button>
                    </div>
                    <div className="od-panel od-panel--table">
                      <div style={{ overflowX: "auto" }}>
                        <table className="od-table">
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
                                <td className="od-table__date">{formatDate(rec.date)}</td>
                                <td>{formatTime(rec.checkIn)}</td>
                                <td>{rec.checkOut ? formatTime(rec.checkOut) : "—"}</td>
                                <td style={{ fontWeight: 600, color: '#0f172a' }}>{rec.totalHours} hrs</td>
                                <td>
                                  <span className={`od-badge od-badge--${rec.status === "Present" ? "green" : "red"}`}>
                                    {rec.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              <div className="op-col-right">
                {/* TODAY'S SESSION */}
                <h2 className="op-section-title" style={{ marginBottom: '24px' }}>Today's Session</h2>
                <div className="op-shop-card" style={{ marginBottom: '40px' }}>
                  {attendance ? (
                    <>
                      <div className="op-address-grid" style={{ marginBottom: '24px' }}>
                        <div className="op-address-tile">
                          <span className="op-address-label">Start Time</span>
                          <span className="op-address-value" style={{ fontSize: '14px' }}>{formatTime(attendance.checkInTime)}</span>
                        </div>
                        <div className="op-address-tile">
                          <span className="op-address-label">End Time</span>
                          <span className="op-address-value" style={{ fontSize: '14px', color: attendance.isStillWorking ? '#3b82f6' : '#334155' }}>
                            {attendance.isStillWorking ? "Active Now" : formatTime(attendance.checkOutTime)}
                          </span>
                        </div>
                      </div>
                      <div className="op-address-tile" style={{ background: '#0f172a', color: 'white', textAlign: 'center', padding: '24px', border: 'none' }}>
                        <span className="op-address-label" style={{ color: '#94a3b8', opacity: 0.8 }}>TOTAL HOURS LOGGED</span>
                        <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '8px' }}>
                          {attendance.totalHours}<small style={{ fontSize: '16px', fontWeight: 500, marginLeft: '4px' }}>h</small>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontWeight: 600, background: '#f1f5f9', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                      No active session found for today.
                    </div>
                  )}
                </div>

                {/* SECURITY KEY */}
                <h2 className="op-section-title" style={{ marginBottom: '24px' }}>Security Key</h2>
                <div className="op-security-card">
                  <form className="op-form-grid" onSubmit={handlePasswordChange}>
                    <div className="op-input-group">
                      <label className="op-input-label">Current Key</label>
                      <input className="op-input" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({...pwForm, currentPassword: e.target.value})} placeholder="••••••••" />
                    </div>
                    <div className="op-input-group">
                      <label className="op-input-label">New Secret Key</label>
                      <input className="op-input" type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({...pwForm, newPassword: e.target.value})} placeholder="Min 6 chars" />
                    </div>
                    <div className="op-input-group">
                      <label className="op-input-label">Confirm Key</label>
                      <input className="op-input" type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({...pwForm, confirmPassword: e.target.value})} placeholder="Re-enter key" />
                    </div>
                    <button type="submit" className="op-submit-btn" style={{ width: '100%' }} disabled={savingPassword}>
                      {savingPassword ? "Updating..." : "Update New Key"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {toast.visible && <div className={`od-toast od-toast--${toast.type}`}>{toast.message}</div>}
    </div>
  );
};

export default StaffProfile;
