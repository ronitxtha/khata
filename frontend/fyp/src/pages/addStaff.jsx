import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../styles/staffManagement.css";
import OwnerSidebar from "../components/OwnerSidebar";

const API_BASE = "http://localhost:8000";

const AddStaff = () => {
  const navigate = useNavigate();
  const [owner, setOwner] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });

  const [staffList, setStaffList] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);

  // Add staff form
  const [showAddForm, setShowAddForm] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffAddress, setStaffAddress] = useState("");
  
  // Edit staff form
  const [showEditForm, setShowEditForm] = useState(false);
  const [editStaffId, setEditStaffId] = useState(null);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffEmail, setEditStaffEmail] = useState("");
  const [editStaffPhone, setEditStaffPhone] = useState("");
  const [editStaffAddress, setEditStaffAddress] = useState("");

  // Success Modal state

  const [createdStaffInfo, setCreatedStaffInfo] = useState(null);

  // Notifications handled globally in Dashboards

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ visible: false }), duration);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setOwner(user);

        const [staffRes, attendanceRes] = await Promise.all([
          axios.get(`${API_BASE}/api/owner/staff`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/api/owner/today-attendance`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setStaffList(staffRes.data.staff || []);
        setAttendanceList(attendanceRes.data.attendance || []);
      } catch (err) {
        console.error(err);
        showToast("Failed to load data", "error");
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isValidPhone = (phone) => /^\d{10}$/.test(phone);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!isValidPhone(staffPhone)) {
      showToast("Phone number must be exactly 10 digits", "error");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const password = Math.random().toString(36).slice(-8);

      const res = await axios.post(
        `${API_BASE}/api/owner/add-staff`,
        { name: staffName, email: staffEmail, phone: staffPhone, address: staffAddress, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStaffList([...staffList, res.data.staff]);
      
      // Store info for success modal
      setCreatedStaffInfo({
        name: staffName,
        email: staffEmail,
        password: password
      });

      // Clear form
      setStaffName(""); setStaffEmail(""); setStaffPhone(""); setStaffAddress("");
      setShowAddForm(false);
      
      showToast("Staff added successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add staff", "error");
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm("Remove this staff member?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_BASE}/api/owner/delete-staff/${staffId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaffList(staffList.filter((s) => s._id !== staffId));
      showToast("Staff removed");
    } catch {
      showToast("Delete failed", "error");
    }
  };

  const openEditModal = (staff) => {
    setEditStaffId(staff._id);
    setEditStaffName(staff.username);
    setEditStaffEmail(staff.email);
    setEditStaffPhone(staff.phone);
    setEditStaffAddress(staff.address || "");
    setShowEditForm(true);
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    if (!isValidPhone(editStaffPhone)) {
      showToast("Phone number must be exactly 10 digits", "error");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(
        `${API_BASE}/api/owner/update-staff/${editStaffId}`,
        { 
          username: editStaffName, 
          email: editStaffEmail, 
          phone: editStaffPhone, 
          address: editStaffAddress 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStaffList(staffList.map(s => s._id === editStaffId ? res.data.staff : s));
      setShowEditForm(false);
      showToast("Staff updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update staff", "error");
    }
  };


  const presentCount = attendanceList.filter((a) => !a.lastLogoutClick).length;
  const loggedOutCount = attendanceList.filter((a) => a.lastLogoutClick).length;
  const absentCount = Math.max(0, staffList.length - attendanceList.length);

  return (
    <div className="sd-layout">
      {/* Shared Owner Sidebar */}
      <OwnerSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        owner={owner} 
        handleLogout={handleLogout} 
      />

      {/* ========== GLOBAL NAVBAR ========== */}
      <div className={`sd-main od-main-content ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)} onMouseEnter={() => { if (window.sidebarTimer) clearTimeout(window.sidebarTimer); setSidebarOpen(true); }} onMouseLeave={() => { window.sidebarTimer = setTimeout(() => setSidebarOpen(false), 300); }}>☰</button>
            <div className="sd-navbar__title">
              <h1>Staff Management</h1>
              <span className="sd-navbar__subtitle">Add, manage, and track your team</span>
            </div>
          </div>
          
          <div className="sd-navbar__right">
             {/* Notifications Removed from inline pages */}

            <div
              onClick={() => navigate("/owner-profile")}
              style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
            >
              <div className="sd-avatar">
                {owner?.profileImage ? (
                  <img src={`${API_BASE}/${owner.profileImage}`} alt="avatar" />
                ) : (
                  <span>{(owner?.username || "O")[0].toUpperCase()}</span>
                )}
              </div>
              <div className="sd-navbar__staff-info">
                <span className="sd-navbar__name">{owner?.username || "Owner"}</span>
                <span className="sd-navbar__role">Owner</span>
              </div>
            </div>
          </div>
        </header>

        {/* ---- CONTENT AREA ---- */}
        <main className="sd-content">
          
          {/* 1. Page Header (White Bar style) */}
          <div className="sm-page-header">
            <div className="sm-header-title-group">
              <h1>Staff Management</h1>
              <p className="sm-header-subtitle">
                Welcome back, Admin. Here is an overview of your team's status today.
              </p>
            </div>
            <div className="sm-header-actions">
              <button className="sm-btn-primary" onClick={() => setShowAddForm(true)}>
               Add Staff
              </button>
            </div>
          </div>

          {/* 2. Summary Stats Grid */}
          <div className="sm-stats-grid">
            <div className="sm-stat-card">
              <div className="sm-stat-label">Total Staff</div>
              <div className="sm-stat-num">{staffList.length}</div>
            </div>
            <div className="sm-stat-card">
              <div className="sm-stat-label">Present Today</div>
              <div className="sm-stat-num">{presentCount}</div>
            </div>
            <div className="sm-stat-card">
              <div className="sm-stat-label">Absent Today</div>
              <div className="sm-stat-num">{absentCount}</div>
            </div>
            <div className="sm-stat-card">
              <div className="sm-stat-label">Logged Out</div>
              <div className="sm-stat-num">{loggedOutCount}</div>
            </div>
          </div>

          {/* 3. Active Team Directory */}
          <div className="sm-section-header">
            <h3>Active Team Directory</h3>
            <span className="sm-view-all">View All Staff →</span>
          </div>

          <div className="sm-table-wrap">
            <table className="sm-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Contact Details</th>
                  <th>Location</th>
                  <th>Current Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No staff members found.</td></tr>
                ) : (
                  staffList.map((staff) => {
                    const attendance = attendanceList.find(a => a.staffId?._id === staff._id || a.staffId === staff._id);
                    const isPresent = !!attendance && !attendance.lastLogoutClick;
                    const isLoggedOut = !!attendance && !!attendance.lastLogoutClick;
                    
                    const initials = (staff.username || "S").split(" ").map(n => n[0]).join("").toUpperCase();

                    return (
                      <tr key={staff._id}>
                        <td>
                          <div className="sm-user-cell">
                            <div className={`sm-avatar-circle sm-avatar--${initials.slice(0, 2)}`}>
                              {initials.slice(0, 2)}
                            </div>
                            <div className="sm-user-info">
                              <span className="sm-user-name">{staff.username}</span>
                            </div>

                          </div>
                        </td>
                        <td>
                          <div className="sm-contact-cell">
                            <span className="sm-contact-email">{staff.email}</span>
                            <span className="sm-contact-phone">{staff.phone}</span>
                          </div>
                        </td>
                        <td>
                          <div className="sm-location-cell">{staff.address || "N/A"}</div>
                        </td>
                        <td>
                          {isPresent ? (
                            <span className="sm-status-badge sm-status--present">Present</span>
                          ) : isLoggedOut ? (
                            <span className="sm-status-badge sm-status--away">Logged Out</span>
                          ) : (
                            <span className="sm-status-badge sm-status--absent">Absent</span>
                          )}
                        </td>
                        <td>
                          <div className="sm-action-btns">
                            <button className="sm-action-btn sm-btn-edit" onClick={() => openEditModal(staff)}> Edit </button>
                            <button className="sm-action-btn sm-btn-delete" onClick={() => handleDeleteStaff(staff._id)}> Delete </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 4. Bottom Grid: Log + Spotlight */}
          <div className="sm-bottom-grid">
            <div className="sm-log-section">
               <div className="sm-section-header">
                <h3>Today's Attendance Log</h3>
                <span className="sm-view-all">Real-time Tracking</span>
              </div>
              <div className="sm-table-wrap">
                <table className="sm-table">
                  <thead>
                    <tr>
                      <th>Staff Name</th>
                      <th>Login</th>
                      <th>Logout</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceList.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No check-ins yet today.</td></tr>
                    ) : (
                      attendanceList.map(a => (
                        <tr key={a._id}>
                          <td className="sm-user-name">{a.staffId?.username || "Unknown"}</td>
                          <td style={{ color: "#475569", fontSize: 13 }}>
                            {a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </td>
                          <td style={{ color: "#475569", fontSize: 13 }}>
                            {a.lastLogoutClick ? new Date(a.lastLogoutClick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </td>
                          <td className="sm-log-status">
                            <span className={`sm-dot ${!a.lastLogoutClick ? "sm-dot--green" : "sm-dot--gray"}`}></span>
                            {!a.lastLogoutClick ? "On Duty" : "Shift Ended"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>


        </main>
      </div>

      {/* ========== ADD STAFF MODAL ========== */}
      {showAddForm && (
        <div className="sm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false); }}>
          <div className="sm-modal">
            <div className="sm-modal__header">
              <h2>Add New Staff</h2>
              <button className="sm-modal__close" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            <form onSubmit={handleAddStaff} className="sm-form">
              <div className="sm-form__grid">
                <div className="sm-form__group">
                  <label>Full Name *</label>
                  <input
                    type="text" placeholder="Staff Name"
                    value={staffName} onChange={(e) => setStaffName(e.target.value)} required
                  />
                </div>
                <div className="sm-form__group">
                  <label>Email *</label>
                  <input
                    type="email" placeholder="staff@example.com"
                    value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required
                  />
                </div>
                <div className="sm-form__group">
                  <label>Phone (10 digits) *</label>
                  <input
                    type="text" placeholder="98XXXXXXXX"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value.replace(/\D/g, ""))}
                    maxLength={10} required
                  />
                </div>
                <div className="sm-form__group">
                  <label>Address *</label>
                  <input
                    type="text" placeholder="City, District"
                    value={staffAddress} onChange={(e) => setStaffAddress(e.target.value)} required
                  />
                </div>
              </div>
              <p style={{ fontSize: 13, color: "var(--sm-text-muted)", marginTop: -8, display: "flex", gap: "6px", alignItems: "center" }}>
                <span>💡</span> A random password will be auto-generated.
              </p>
              <div className="sm-form__actions">
                <button type="button" className="sm-btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="sm-btn-primary">Add Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== SUCCESS MODAL (Show Password) ========== */}
      {createdStaffInfo && (
        <div className="sm-modal-overlay">
          <div className="sm-modal" style={{ maxWidth: "420px", textAlign: "center", padding: "16px 0 0 0" }}>
            <div className="sm-modal__header" style={{ justifyContent: "center", borderBottom: "none", paddingBottom: "0" }}>
              <h2 style={{ fontSize: "24px" }}>🎉 Staff Added!</h2>
            </div>
            
            <div style={{ padding: "16px 32px 32px 32px" }}>
              <p style={{ color: "var(--sm-text-muted)", marginBottom: "24px", fontSize: "14px" }}>
                Staff account for <strong>{createdStaffInfo.name}</strong> has been created.
              </p>
              
              <div style={{ 
                background: "#f8fafc", 
                padding: "24px", 
                borderRadius: "12px", 
                border: "1px solid var(--sm-border)",
                marginBottom: "24px"
              }}>
                <span style={{ fontSize: "12px", color: "var(--sm-text-muted)", display: "block", marginBottom: "8px", fontWeight: "700", letterSpacing: "1px" }}>
                  AUTO-GENERATED PASSWORD
                </span>
                <span style={{ 
                  fontSize: "32px", 
                  fontWeight: "800", 
                  letterSpacing: "3px", 
                  color: "var(--sm-primary)",
                  fontFamily: "monospace" 
                }}>
                  {createdStaffInfo.password}
                </span>
              </div>

              <div style={{ padding: "12px", background: "#fff1f2", borderRadius: "8px", marginBottom: "24px" }}>
                <p style={{ fontSize: "12px", color: "#ef4444", fontWeight: "600", margin: 0 }}>
                  ⚠️ Please copy this password now. It will not be shown again.
                </p>
              </div>

              <button 
                className="sm-btn-primary" 
                style={{ width: "100%", justifyContent: "center", padding: "12px" }}
                onClick={() => setCreatedStaffInfo(null)}
              >
                Close & Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== EDIT STAFF MODAL ========== */}
      {showEditForm && (
        <div className="sm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowEditForm(false); }}>
          <div className="sm-modal">
            <div className="sm-modal__header">
              <h2>Edit Staff Details</h2>
              <button className="sm-modal__close" onClick={() => setShowEditForm(false)}>✕</button>
            </div>
            <form onSubmit={handleEditStaff} className="sm-form">
              <div className="sm-form__grid">
                <div className="sm-form__group">
                  <label>Full Name *</label>
                  <input
                    type="text" placeholder="Staff Name"
                    value={editStaffName} onChange={(e) => setEditStaffName(e.target.value)} required
                  />
                </div>
                <div className="sm-form__group">
                  <label>Email *</label>
                  <input
                    type="email" placeholder="staff@example.com"
                    value={editStaffEmail} onChange={(e) => setEditStaffEmail(e.target.value)} required
                  />
                </div>
                <div className="sm-form__group">
                  <label>Phone (10 digits) *</label>
                  <input
                    type="text" placeholder="98XXXXXXXX"
                    value={editStaffPhone}
                    onChange={(e) => setEditStaffPhone(e.target.value.replace(/\D/g, ""))}
                    maxLength={10} required
                  />
                </div>
                <div className="sm-form__group">
                  <label>Address *</label>
                  <input
                    type="text" placeholder="City, District"
                    value={editStaffAddress} onChange={(e) => setEditStaffAddress(e.target.value)} required
                  />
                </div>
              </div>
              <div className="sm-form__actions">
                <button type="button" className="sm-btn-cancel" onClick={() => setShowEditForm(false)}>Cancel</button>
                <button type="submit" className="sm-btn-primary">Update Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST */}

      {toast.visible && (
        <div className={`sd-toast sd-toast--${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default AddStaff;
