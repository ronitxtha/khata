import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/staffDashboard.css";
import "../styles/staffInventory.css";

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
      setStaffName(""); setStaffEmail(""); setStaffPhone(""); setStaffAddress("");
      setShowAddForm(false);
      showToast(`Staff added! Auto-password: ${password}`);
    } catch (err) {
      showToast("Failed to add staff", "error");
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

  const navLinks = [
    { label: "Dashboard", icon: "🏠", path: "/owner-dashboard" },
    { label: "Product Management", icon: "📦", path: "/products" },
    { label: "Orders", icon: "🛒", path: "/order-management" },
    { label: "Staff Management", icon: "👥", path: "/add-staff" },
    { label: "Attendance", icon: "📅", path: "/attendance" },
    { label: "Profile", icon: "👤", path: "/owner-profile" },
  ];

  const presentCount = attendanceList.filter((a) => !a.lastLogoutClick).length;
  const absentCount = staffList.length - attendanceList.length;

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

      {/* ========== MAIN AREA ========== */}
      <div className={`sd-main ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        {/* ---- TOP NAVBAR ---- */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div className="sd-navbar__title">
              <h1>Staff Management</h1>
              <span className="sd-navbar__subtitle">Add, manage, and track your team</span>
            </div>
          </div>
          <div className="sd-navbar__right">
            <div className="sd-avatar">
              <span>{(owner?.username || "O")[0].toUpperCase()}</span>
            </div>
            <div className="sd-navbar__staff-info">
              <span className="sd-navbar__name">{owner?.username || "Owner"}</span>
              <span className="sd-navbar__role">Owner</span>
            </div>
          </div>
        </header>

        {/* ---- CONTENT ---- */}
        <main className="sd-content">

          {/* Banner */}
          <div className="sd-welcome si-banner">
            <div>
              <h2>👥 Your Team</h2>
              <p>Manage staff accounts and monitor today's attendance at a glance.</p>
            </div>
            <button className="sd-btn-scan si-add-btn" onClick={() => setShowAddForm(true)}>
              ➕ Add Staff
            </button>
          </div>

          {/* Mini stat cards */}
          <div className="si-mini-cards">
            <div className="si-mini-card si-mini-card--blue">
              <span className="si-mini-card__icon">👥</span>
              <div>
                <div className="si-mini-card__num">{staffList.length}</div>
                <div className="si-mini-card__label">Total Staff</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--green">
              <span className="si-mini-card__icon">🟢</span>
              <div>
                <div className="si-mini-card__num">{presentCount}</div>
                <div className="si-mini-card__label">Present Today</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--orange">
              <span className="si-mini-card__icon">🔴</span>
              <div>
                <div className="si-mini-card__num">{absentCount < 0 ? 0 : absentCount}</div>
                <div className="si-mini-card__label">Absent Today</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--red">
              <span className="si-mini-card__icon">✔️</span>
              <div>
                <div className="si-mini-card__num">{attendanceList.filter((a) => a.lastLogoutClick).length}</div>
                <div className="si-mini-card__label">Logged Out</div>
              </div>
            </div>
          </div>

          {/* Staff List Table */}
          <div className="sd-panel si-table-panel">
            <div className="sd-panel__header">
              <h3>👤 Staff List ({staffList.length})</h3>
            </div>

            {staffList.length > 0 ? (
              <div className="si-table-wrap">
                <table className="si-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Today's Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((staff) => {
                      const attendance = attendanceList.find((a) => a.staffId?._id === staff._id || a.staffId === staff._id);
                      const isPresent = !!attendance && !attendance.lastLogoutClick;
                      const isLoggedOut = !!attendance && !!attendance.lastLogoutClick;
                      return (
                        <tr key={staff._id}>
                          <td>
                            <div className="si-product-cell">
                              <div className="si-product-thumb-placeholder" style={{ fontSize: 18 }}>
                                {(staff.username || "S")[0].toUpperCase()}
                              </div>
                              <span className="si-product-name">{staff.username || "N/A"}</span>
                            </div>
                          </td>
                          <td style={{ color: "#475569", fontSize: 13 }}>{staff.email || "N/A"}</td>
                          <td style={{ color: "#475569", fontSize: 13 }}>{staff.phone || "N/A"}</td>
                          <td className="si-desc-cell">{staff.address || "N/A"}</td>
                          <td>
                            {isPresent ? (
                              <span className="sd-badge badge-delivered">🟢 Present</span>
                            ) : isLoggedOut ? (
                              <span className="sd-badge badge-processing">✔️ Logged out</span>
                            ) : (
                              <span className="sd-badge badge-cancelled">🔴 Absent</span>
                            )}
                          </td>
                          <td>
                            <div className="si-actions">
                              <button
                                className="si-btn si-btn--delete"
                                onClick={() => handleDeleteStaff(staff._id)}
                                title="Remove staff"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="sd-empty">
                <span>👤</span>
                <p>No staff members added yet.</p>
              </div>
            )}
          </div>

          {/* Today's Attendance */}
          <div className="sd-panel si-table-panel">
            <div className="sd-panel__header">
              <h3>📅 Today's Attendance ({attendanceList.length} checked in)</h3>
            </div>

            {attendanceList.length === 0 ? (
              <div className="sd-empty">
                <span>📅</span>
                <p>No attendance recorded today.</p>
              </div>
            ) : (
              <div className="si-table-wrap">
                <table className="si-table">
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Email</th>
                      <th>Login Time</th>
                      <th>Logout Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceList.map((a) => {
                      const isWorking = !a.lastLogoutClick;
                      return (
                        <tr key={a._id}>
                          <td>
                            <div className="si-product-cell">
                              <div className="si-product-thumb-placeholder" style={{ fontSize: 18 }}>
                                {(a.staffId?.username || "S")[0].toUpperCase()}
                              </div>
                              <span className="si-product-name">{a.staffId?.username || "Unknown"}</span>
                            </div>
                          </td>
                          <td style={{ color: "#475569", fontSize: 13 }}>{a.staffId?.email || "N/A"}</td>
                          <td style={{ color: "#334155", fontSize: 13 }}>
                            {a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString() : "—"}
                          </td>
                          <td style={{ color: "#334155", fontSize: 13 }}>
                            {a.lastLogoutClick ? new Date(a.lastLogoutClick).toLocaleTimeString() : "—"}
                          </td>
                          <td>
                            {isWorking ? (
                              <span className="sd-badge badge-delivered">🟢 Working</span>
                            ) : (
                              <span className="sd-badge badge-processing">✔️ Done</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ========== ADD STAFF MODAL ========== */}
      {showAddForm && (
        <div className="si-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false); }}>
          <div className="si-modal">
            <div className="si-modal__header">
              <h2>➕ Add New Staff</h2>
              <button className="si-modal__close" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            <form onSubmit={handleAddStaff} className="si-form">
              <div className="si-form__grid">
                <div className="si-form__group">
                  <label>Full Name *</label>
                  <input
                    type="text" placeholder="Staff Name"
                    value={staffName} onChange={(e) => setStaffName(e.target.value)} required
                  />
                </div>
                <div className="si-form__group">
                  <label>Email *</label>
                  <input
                    type="email" placeholder="staff@example.com"
                    value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required
                  />
                </div>
                <div className="si-form__group">
                  <label>Phone (10 digits) *</label>
                  <input
                    type="text" placeholder="98XXXXXXXX"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value.replace(/\D/g, ""))}
                    maxLength={10} required
                  />
                </div>
                <div className="si-form__group">
                  <label>Address *</label>
                  <input
                    type="text" placeholder="City, District"
                    value={staffAddress} onChange={(e) => setStaffAddress(e.target.value)} required
                  />
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: -8 }}>
                💡 A random password will be auto-generated and shown after adding.
              </p>
              <div className="si-form__actions">
                <button type="button" className="si-btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="si-btn-submit">Add Staff</button>
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
