import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/staffDashboard.css";
import "../styles/staffProfile.css";
import "../styles/ownerDashboard.css";
import StaffSidebar from "../components/StaffSidebar";

const API_BASE = "http://localhost:8000";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

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
    if (!imageFile) return true;
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
      showToast("Password changed successfully!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showToast(err.response?.data?.message || "Password change failed", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/api/staff/logout-click`, {}, { headers: getAuthHeaders() });
    } catch (err) { console.error(err); }
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  return (
    <div className="sd-layout">
      {/* Shared Staff Sidebar */}
      <StaffSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        staff={staff} 
        handleLogout={handleLogout} 
      />

      {/* ========== MAIN ========== */}
      <div className={`sd-main od-main-content ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        {/* ---- NAVBAR ---- */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div className="sd-navbar__title">
              <h1>Personal Profile</h1>
              <span className="sd-navbar__subtitle">Manage your credentials and view performance</span>
            </div>
          </div>
          <div className="sd-navbar__right">
            <div className="sd-avatar">
              {staff?.profileImage ? (
                <img src={`${API_BASE}/${staff.profileImage}`} alt="avatar" />
              ) : (
                <span>{(staff?.username || "S")[0].toUpperCase()}</span>
              )}
            </div>
            <div className="sd-navbar__staff-info">
              <span className="sd-navbar__name">{staff?.username || "Staff"}</span>
              <span className="sd-navbar__role">Active Staff</span>
            </div>
          </div>
        </header>

        {/* ---- CONTENT ---- */}
        <main className="sd-content">
          
          {/* Header Section */}
          <div className="si-header-section">
            <div className="si-header-info">
              <h2>Profile Information</h2>
              <p>Keep your contact info and security credentials up to date.</p>
            </div>
          </div>

          {!loading ? (
            <div className="si-profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                
                {/* 1. IDENTITY CARD */}
                <div className="si-ledger-table-wrap">
                  <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800 }}>👤 Identity Details</h3>
                    {!isEditing && (
                      <button className="si-btn-primary si-btn-primary--dark" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={handleEditClick}>Edit Identity</button>
                    )}
                  </div>
                  
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                       <div style={{ position: 'relative' }}>
                          {imagePreview || (staff?.profileImage ? `${API_BASE}/${staff.profileImage}` : null) ? (
                            <img src={imagePreview || `${API_BASE}/${staff.profileImage}`} alt="Profile" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid #f8fafc' }} />
                          ) : (
                            <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 800, color: '#94a3b8' }}>
                              {(staff?.username || "S")[0].toUpperCase()}
                            </div>
                          )}
                          {isEditing && (
                            <button 
                              onClick={() => fileInputRef.current?.click()} 
                              style={{ position: 'absolute', bottom: '0', right: '0', width: '32px', height: '32px', borderRadius: '50%', background: '#0f172a', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Update Photo"
                            >
                              📷
                            </button>
                          )}
                          <input type="file" ref={fileInputRef} onChange={handleImageSelect} hidden accept="image/*" />
                       </div>
                       <div style={{ flex: 1 }}>
                         <p style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Employee Role</p>
                         <span className="si-ledger-tag" style={{ width: 'fit-content', background: '#f8fafc', fontWeight: 700 }}>{staff?.role?.toUpperCase() || "STAFF"}</span>
                       </div>
                    </div>

                    {!isEditing ? (
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div className="si-profile-field">
                             <span className="si-profile-label">LEGAL NAME</span>
                             <span className="si-profile-value">{staff?.username || "—"}</span>
                          </div>
                          <div className="si-profile-field">
                             <span className="si-profile-label">ASSIGNED EMAIL</span>
                             <span className="si-profile-value">{staff?.email || "—"}</span>
                          </div>
                          <div className="si-profile-field">
                             <span className="si-profile-label">CONTACT MOBILE</span>
                             <span className="si-profile-value">{staff?.phone || "Not provided"}</span>
                          </div>
                          <div className="si-profile-field">
                             <span className="si-profile-label">JOINED ON</span>
                             <span className="si-profile-value">{formatDate(staff?.createdAt)}</span>
                          </div>
                       </div>
                    ) : (
                       <div className="si-form">
                          <div className="si-form__group">
                             <label>Display Name</label>
                             <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="Full name" />
                          </div>
                          <div className="si-form__group">
                             <label>Primary Phone</label>
                             <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+977-XXXXXXXXXX" />
                          </div>
                          <div className="si-form__actions" style={{ marginTop: '20px' }}>
                             <button className="si-btn-cancel" onClick={handleCancelEdit}>Cancel</button>
                             <button className="si-btn-submit" onClick={handleSaveProfile} disabled={savingProfile}>
                               {savingProfile ? "Processing..." : "Commit Changes"}
                             </button>
                          </div>
                       </div>
                    )}
                  </div>
                </div>

                {/* 2. SECURITY & ATTENDANCE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Security Card */}
                    <div className="si-ledger-table-wrap">
                      <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 800 }}>🔐 Security Key</h3>
                      </div>
                      <form className="si-form" style={{ padding: '24px' }} onSubmit={handlePasswordChange}>
                         <div className="si-form__group">
                            <label>Current Key</label>
                            <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({...pwForm, currentPassword: e.target.value})} placeholder="••••••••" />
                         </div>
                         <div className="si-form__group">
                            <label>New Secret Key</label>
                            <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({...pwForm, newPassword: e.target.value})} placeholder="Min 6 chars" />
                         </div>
                         <div className="si-form__group">
                            <label>Confirm Secret Key</label>
                            <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({...pwForm, confirmPassword: e.target.value})} placeholder="Re-enter key" />
                         </div>
                         <button type="submit" className="si-btn-submit" style={{ width: '100%', marginTop: '12px' }} disabled={savingPassword}>
                            {savingPassword ? "Updating..." : "Update Security Key"}
                         </button>
                      </form>
                    </div>

                    {/* Today's Insights Card */}
                    <div className="si-ledger-table-wrap">
                      <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 800 }}>📅 Today's Session</h3>
                      </div>
                      <div style={{ padding: '24px' }}>
                        {attendance ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                             <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <p style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>SESSION START</p>
                                <p style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{formatTime(attendance.checkInTime)}</p>
                             </div>
                             <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <p style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>SESSION END</p>
                                <p style={{ fontSize: '16px', fontWeight: 800, color: attendance.isStillWorking ? '#3b82f6' : '#0f172a' }}>
                                  {attendance.isStillWorking ? "Active Now" : formatTime(attendance.checkOutTime)}
                                </p>
                             </div>
                             <div style={{ gridColumn: 'span 2', background: '#ecfdf5', padding: '16px', borderRadius: '12px', border: '1px solid #10b98120', textAlign: 'center' }}>
                                <p style={{ fontSize: '11px', fontWeight: 800, color: '#059669', marginBottom: '4px' }}>TOTAL HOURS LOGGED TODAY</p>
                                <p style={{ fontSize: '24px', fontWeight: 800, color: '#065f46' }}>{attendance.totalHours} <span style={{ fontSize: '14px', fontWeight: 500 }}>hours</span></p>
                             </div>
                          </div>
                        ) : (
                          <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                             <span style={{ display: 'block', fontSize: '24px', marginBottom: '8px' }}>📋</span>
                             <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>No attendance recorded yet for today.</p>
                          </div>
                        )}
                      </div>
                    </div>

                </div>
            </div>
          ) : (
            <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>
              ⏳ Loading profile workspace...
            </div>
          )}

          {/* WEEKLY ACTIVITY TABLE */}
          {!loading && weekData.length > 0 && (
             <div className="si-ledger-table-wrap" style={{ marginTop: '32px' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800 }}>📉 Weekly Performance History</h3>
                </div>
                <table className="si-ledger-table">
                    <thead>
                        <tr>
                            <th>Activity Date</th>
                            <th>Clocked In</th>
                            <th>Clocked Out</th>
                            <th>Total Duration</th>
                            <th>Status Badge</th>
                        </tr>
                    </thead>
                    <tbody>
                        {weekData.slice(0, 7).map((rec, idx) => (
                           <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{formatDate(rec.date)}</td>
                              <td>{formatTime(rec.checkIn)}</td>
                              <td>{rec.checkOut ? formatTime(rec.checkOut) : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                              <td style={{ fontWeight: 700, color: '#0f172a' }}>{rec.totalHours} hrs</td>
                              <td>
                                 <div className="si-status-wrap">
                                    <span className={`si-dot ${rec.status === "Present" ? "si-dot--green" : "si-dot--red"}`}></span>
                                    <span className="si-status-text" style={{ fontWeight: 600, color: rec.status === "Present" ? '#059669' : '#dc2626' }}>
                                      {rec.status === "Present" ? "Present" : "Absent"}
                                    </span>
                                 </div>
                              </td>
                           </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ padding: '16px', textAlign: 'center', background: '#f8fafc' }}>
                   <button className="si-btn-cancel" style={{ fontSize: '12px' }} onClick={() => navigate("/staff-attendance")}>View Full Attendance Ledger →</button>
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
