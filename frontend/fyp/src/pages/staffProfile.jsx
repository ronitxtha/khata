import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import StaffSidebar from "../components/StaffSidebar";
import "../styles/staffProfile.css";

const API_BASE = "http://localhost:8000";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

// ─── Toast Helper ────────────────────────────────────────────
const useToast = () => {
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const show = (message, type = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  };
  return { toast, show };
};

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
    month: "long",
    day: "numeric",
  });
};

// ─── Main Component ──────────────────────────────────────────
const StaffProfile = () => {
  const { toast, show: showToast } = useToast();
  const fileInputRef = useRef(null);

  // ── State ──
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);

  // Profile edit
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

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

  // Image upload
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
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
      setIsEditing(false);
      showToast("Profile updated successfully!", "success");
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
      showToast("New password and confirm password do not match", "error");
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
      showToast("Password changed successfully!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Password change failed", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Image Upload ──
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      showToast("Please select an image first", "error");
      return;
    }
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("profileImage", imageFile);
      const res = await axios.post(`${API_BASE}/api/staff/upload-profile-image`, formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });
      setStaff((prev) => ({ ...prev, profileImage: res.data.profileImage }));
      setImagePreview(null);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("Profile image updated!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Image upload failed", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Render ──
  if (loading) {
    return (
      <div className="sp-container">
        <StaffSidebar />
        <div className="sp-content">
          <div className="sp-loading">
            <div className="sp-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const avatarSrc = staff?.profileImage
    ? `${API_BASE}/${staff.profileImage}`
    : null;

  return (
    <div className="sp-container">
      <StaffSidebar />

      {/* Toast */}
      {toast.visible && (
        <div className={`sp-toast sp-toast-${toast.type}`}>{toast.message}</div>
      )}

      <div className="sp-content">
        {/* ── Page Header ── */}
        <div className="sp-page-header">
          <div>
            <h1 className="sp-page-title">My Profile</h1>
            <p className="sp-page-subtitle">Manage your personal information and account settings</p>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            CARD 1 – Profile Information
        ════════════════════════════════════════════ */}
        <div className="sp-card">
          <h2 className="sp-card-title">👤 Profile Information</h2>

          <div className="sp-profile-overview">
            {/* Avatar */}
            <div className="sp-avatar-wrapper">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" className="sp-avatar" />
              ) : (
                <div className="sp-avatar-placeholder">
                  {staff?.username?.[0]?.toUpperCase() || "S"}
                </div>
              )}
            </div>

            {/* Info rows */}
            <div className="sp-info-section">
              {/* Full Name */}
              <div className="sp-info-row">
                <label>Full Name</label>
                {isEditing ? (
                  <input
                    className="sp-input"
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Enter name"
                  />
                ) : (
                  <span>{staff?.username || "—"}</span>
                )}
              </div>

              {/* Email */}
              <div className="sp-info-row">
                <label>Email</label>
                <span className="sp-readonly">{staff?.email || "—"}</span>
              </div>

              {/* Phone */}
              <div className="sp-info-row">
                <label>Phone</label>
                {isEditing ? (
                  <input
                    className="sp-input"
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <span>{staff?.phone || <em className="sp-empty">Not set</em>}</span>
                )}
              </div>

              {/* Role */}
              <div className="sp-info-row">
                <label>Role</label>
                <span className="sp-badge-role">Staff</span>
              </div>

              {/* Shop */}
              <div className="sp-info-row">
                <label>Shop</label>
                <span className="sp-readonly">{staff?.shopName || "—"}</span>
              </div>

              {/* Joined */}
              <div className="sp-info-row">
                <label>Member Since</label>
                <span>{formatDate(staff?.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="sp-btn-group">
            {!isEditing ? (
              <button className="sp-btn sp-btn-primary" onClick={handleEditClick}>
                ✏️ Edit Profile
              </button>
            ) : (
              <>
                <button
                  className="sp-btn sp-btn-success"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? "Saving..." : "💾 Save Changes"}
                </button>
                <button
                  className="sp-btn sp-btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={savingProfile}
                >
                  ✕ Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════
            CARD 2 – Change Password
        ════════════════════════════════════════════ */}
        <div className="sp-card">
          <h2 className="sp-card-title">🔒 Change Password</h2>
          <form className="sp-password-form" onSubmit={handlePasswordChange} noValidate>
            {/* Current Password */}
            <div className="sp-form-group">
              <label>Current Password</label>
              <div className="sp-input-eye">
                <input
                  className="sp-input"
                  type={showPasswords.current ? "text" : "password"}
                  placeholder="Enter current password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                />
                <button
                  type="button"
                  className="sp-eye-btn"
                  onClick={() => setShowPasswords((s) => ({ ...s, current: !s.current }))}
                  tabIndex={-1}
                >
                  {showPasswords.current ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="sp-form-group">
              <label>New Password <span className="sp-hint">(min 6 characters)</span></label>
              <div className="sp-input-eye">
                <input
                  className="sp-input"
                  type={showPasswords.new ? "text" : "password"}
                  placeholder="Enter new password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                />
                <button
                  type="button"
                  className="sp-eye-btn"
                  onClick={() => setShowPasswords((s) => ({ ...s, new: !s.new }))}
                  tabIndex={-1}
                >
                  {showPasswords.new ? "🙈" : "👁️"}
                </button>
              </div>
              {pwForm.newPassword && pwForm.newPassword.length < 6 && (
                <p className="sp-field-error">Password must be at least 6 characters</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="sp-form-group">
              <label>Confirm New Password</label>
              <div className="sp-input-eye">
                <input
                  className="sp-input"
                  type={showPasswords.confirm ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                />
                <button
                  type="button"
                  className="sp-eye-btn"
                  onClick={() => setShowPasswords((s) => ({ ...s, confirm: !s.confirm }))}
                  tabIndex={-1}
                >
                  {showPasswords.confirm ? "🙈" : "👁️"}
                </button>
              </div>
              {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p className="sp-field-error">Passwords do not match</p>
              )}
            </div>

            <div className="sp-btn-group">
              <button
                type="submit"
                className="sp-btn sp-btn-primary"
                disabled={savingPassword}
              >
                {savingPassword ? "Updating..." : "🔑 Update Password"}
              </button>
            </div>
          </form>
        </div>

        {/* ════════════════════════════════════════════
            CARD 3 – Today's Attendance
        ════════════════════════════════════════════ */}
        <div className="sp-card">
          <h2 className="sp-card-title">📅 Today's Attendance</h2>

          {attendance ? (
            <>
              <div className="sp-attendance-summary">
                <div className="sp-att-stat">
                  <span className="sp-att-icon">🟢</span>
                  <div>
                    <p className="sp-att-label">Login Time</p>
                    <p className="sp-att-value">{formatTime(attendance.checkInTime)}</p>
                  </div>
                </div>

                <div className="sp-att-divider"></div>

                <div className="sp-att-stat">
                  <span className="sp-att-icon">🔴</span>
                  <div>
                    <p className="sp-att-label">Logout Time</p>
                    <p className="sp-att-value">
                      {attendance.isStillWorking ? (
                        <span className="sp-still-working">Still working...</span>
                      ) : (
                        formatTime(attendance.checkOutTime)
                      )}
                    </p>
                  </div>
                </div>

                <div className="sp-att-divider"></div>

                <div className="sp-att-stat">
                  <span className="sp-att-icon">⏱️</span>
                  <div>
                    <p className="sp-att-label">Total Hours</p>
                    <p className="sp-att-value">
                      {attendance.isStillWorking
                        ? `${attendance.totalHours}h (ongoing)`
                        : `${attendance.totalHours}h`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Weekly Table */}
              {weekData.length > 0 && (
                <div className="sp-week-section">
                  <h3 className="sp-week-title">📊 Last 7 Days</h3>
                  <div className="sp-table-wrapper">
                    <table className="sp-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Login</th>
                          <th>Logout</th>
                          <th>Hours</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weekData.map((rec, idx) => (
                          <tr key={idx}>
                            <td>{formatDate(rec.date)}</td>
                            <td>{formatTime(rec.checkIn)}</td>
                            <td>{rec.checkOut ? formatTime(rec.checkOut) : <em className="sp-empty">—</em>}</td>
                            <td>{rec.totalHours}h</td>
                            <td>
                              <span className={`sp-status-badge sp-status-${rec.status}`}>
                                {rec.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="sp-no-attendance">
              <span className="sp-no-att-icon">📋</span>
              <p>No attendance record found for today.</p>
              <p className="sp-no-att-hint">Your attendance is automatically tracked when you log in.</p>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════
            CARD 4 – Profile Image Upload
        ════════════════════════════════════════════ */}
        <div className="sp-card">
          <h2 className="sp-card-title">🖼️ Profile Image</h2>

          <div className="sp-upload-layout">
            {/* Current / Preview */}
            <div className="sp-upload-preview-box">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="sp-upload-preview-img" />
              ) : avatarSrc ? (
                <img src={avatarSrc} alt="Current" className="sp-upload-preview-img" />
              ) : (
                <div className="sp-upload-placeholder">
                  <span>📷</span>
                  <p>No image yet</p>
                </div>
              )}
              {imagePreview && <div className="sp-preview-badge">Preview</div>}
            </div>

            {/* Upload controls */}
            <div className="sp-upload-controls">
              <p className="sp-upload-hint">
                Upload a clear photo of yourself. Accepted formats: JPG, PNG, WEBP (max 5 MB).
              </p>

              <label className="sp-btn sp-btn-secondary sp-file-label" htmlFor="sp-file-input">
                📁 Choose Image
              </label>
              <input
                id="sp-file-input"
                type="file"
                accept="image/*"
                className="sp-file-input-hidden"
                ref={fileInputRef}
                onChange={handleImageSelect}
              />

              {imageFile && (
                <p className="sp-selected-file">✓ {imageFile.name}</p>
              )}

              <button
                className="sp-btn sp-btn-success"
                onClick={handleImageUpload}
                disabled={!imageFile || uploadingImage}
              >
                {uploadingImage ? "Uploading..." : "⬆️ Upload Image"}
              </button>

              {imagePreview && (
                <button
                  className="sp-btn sp-btn-ghost"
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  ✕ Remove Selection
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
