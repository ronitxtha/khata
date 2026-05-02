import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";

import "../styles/ownerDashboard.css";
import "../styles/staffManagement.css";

const API_BASE = "http://localhost:8000";

const AddStaff = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [owner, setOwner] = useState({});
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

  const sideLinks = [
    { label: "Dashboard", path: "/owner-dashboard", d: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10" },
    { label: "Orders", path: "/order-management", d: "M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M8 12h8" },
    { label: "Products", path: "/products", d: "M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
    { label: "Staff", path: "/add-staff", d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" },
    { label: "Suppliers", path: "/supplier-management", d: "M3 3h18v4H3zM3 11h18v4H3zM3 19h18v4H3z" },
    { label: "Attendance", path: "/attendance", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { label: "Messages", path: "/owner-messages", d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
    { label: "Reviews", path: "/owner-reviews", d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
    { label: "Profile", path: "/owner-profile", d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
  ];

  return (
    <div className="od-shell">
      <aside className="od-sidebar">
        <div className="od-sidebar__brand">
          <div className="od-sidebar__logo">
            <span className="od-sidebar__logo-icon">K</span>
            <span className="od-sidebar__logo-text">SmartKhata</span>
          </div>
        </div>
        <nav className="od-sidebar__nav">
          {sideLinks.map(link => (
            <button key={link.path}
              className={`od-sidebar__link ${location.pathname === link.path ? "od-sidebar__link--active" : ""}`}
              onClick={() => navigate(link.path)}>
              <span className="od-sidebar__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={link.d}/></svg>
              </span>
              <span className="od-sidebar__label">{link.label}</span>
            </button>
          ))}
        </nav>
        <div className="od-sidebar__footer">
          <div className="od-sidebar__user" onClick={() => navigate("/owner-profile")}>
            <div className="od-sidebar__avatar">
              {owner?.profileImage ? <img src={imgUrl(owner.profileImage)} alt="avatar"/> : <span>{(owner?.username||"U")[0].toUpperCase()}</span>}
            </div>
            <div>
              <div className="od-sidebar__user-name">{owner?.username||"Owner"}</div>
              <div className="od-sidebar__user-role" style={{textTransform:"capitalize"}}>Owner</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="od-main">
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">Staff Management</h1>
            <div className="od-topbar__date">{staffList.length} members</div>
          </div>
          <div className="od-topbar__right">
            <div className="od-topbar__profile" onClick={() => navigate("/owner-profile")}>
              <div className="od-topbar__avatar">
                {owner?.profileImage ? <img src={imgUrl(owner.profileImage)} alt="avatar"/> : <span>{(owner?.username||"U")[0].toUpperCase()}</span>}
              </div>
            </div>
            <button className="od-topbar__logout" onClick={handleLogout} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          </div>
        </header>

        <main className="od-content">
          
          {/* Page Head */}
          <div className="sm-page-head">
            <div>
              <h2 className="sm-page-head__title">Staff Management</h2>
              <p className="sm-page-head__sub">Welcome back, Admin. Here is an overview of your team's status today.</p>
            </div>
            <div className="sm-page-head__actions">
              <button className="sm-btn-primary" onClick={() => setShowAddForm(true)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                Add Staff
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="om-stat-row">
            {[
              { label:"Total Staff",  val: staffList.length, color:"#6366f1", icon:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" },
              { label:"Present Today",val: presentCount,     color:"#10b981", icon:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label:"Absent Today", val: absentCount,      color:"#ef4444", icon:"M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label:"Logged Out",   val: loggedOutCount,   color:"#f59e0b", icon:"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" },
            ].map(c=>(
              <div key={c.label} className="om-stat-card" style={{"--card-color":c.color}}>
                <div className="om-stat-card__icon" style={{background:c.color+"18",color:c.color}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon}/></svg>
                </div>
                <div>
                  <div className="om-stat-card__label">{c.label}</div>
                  <div className="om-stat-card__value">{c.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 3. Active Team Directory */}
          <div className="sm-section-header">
            <h3>Staff List</h3>
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

      {toast.visible && <div className={`od-toast od-toast--${toast.type}`}>{toast.message}</div>}
    </div>
  );
};

export default AddStaff;
