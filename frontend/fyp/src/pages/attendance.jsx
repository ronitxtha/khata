import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/staffDashboard.css";
import "../styles/staffInventory.css";

const API_BASE = "http://localhost:8000";

const Attendance = () => {
  const navigate = useNavigate();
  const [owner, setOwner] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("all");
  const [visibleCounts, setVisibleCounts] = useState({});

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setOwner(user);
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/api/owner/attendance-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setAttendance(res.data.attendance || []);
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading attendance history", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    return new Date(timeString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  // Group by staff member, with month filtering
  const groupedData = attendance.reduce((acc, record) => {
    if (!record.staffId) return acc;
    const recordMonth = new Date(record.date).getMonth();
    const currentMonth = new Date().getMonth();
    let timeCategory = "older";
    if (recordMonth === currentMonth) timeCategory = "current";
    else if ((currentMonth === 0 && recordMonth === 11) || recordMonth === currentMonth - 1) timeCategory = "last";

    if (filterMonth !== "all" && timeCategory !== filterMonth) return acc;

    const staffId = record.staffId._id;
    if (!acc[staffId]) acc[staffId] = { info: record.staffId, records: [] };
    acc[staffId].records.push(record);
    return acc;
  }, {});

  const handleShowMore = (staffId) => {
    setVisibleCounts((prev) => ({ ...prev, [staffId]: (prev[staffId] || 5) + 10 }));
  };

  // Stats
  const totalStaff = Object.keys(groupedData).length;
  const totalRecords = attendance.length;
  const presentRecords = attendance.filter((a) => a.status === "present").length;
  const absentRecords = attendance.filter((a) => a.status === "absent").length;

  const navLinks = [
    { label: "Dashboard", icon: "🏠", path: "/owner-dashboard" },
    { label: "Product Management", icon: "📦", path: "/products" },
    { label: "Orders", icon: "🛒", path: "/order-management" },
    { label: "Staff Management", icon: "👥", path: "/add-staff" },
    { label: "Supplier Management", icon: "🏭", path: "/supplier-management" },
    { label: "Attendance", icon: "📅", path: "/attendance" },
    { label: "Profile", icon: "👤", path: "/owner-profile" },
  ];

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
              <h1>Attendance History</h1>
              <span className="sd-navbar__subtitle">View staff login and logout records</span>
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
              <h2>📅 Staff Attendance</h2>
              <p>Review detailed login/logout records for every staff member over the last 3 months.</p>
            </div>
            <select
              className="sd-filter-select"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              style={{ alignSelf: "center" }}
            >
              <option value="all">Last 3 Months</option>
              <option value="current">Current Month</option>
              <option value="last">Last Month</option>
              <option value="older">Older</option>
            </select>
          </div>

          {/* Summary mini-cards */}
          <div className="si-mini-cards">
            <div className="si-mini-card si-mini-card--blue">
              <span className="si-mini-card__icon">👥</span>
              <div>
                <div className="si-mini-card__num">{totalStaff}</div>
                <div className="si-mini-card__label">Staff Members</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--green">
              <span className="si-mini-card__icon">✅</span>
              <div>
                <div className="si-mini-card__num">{presentRecords}</div>
                <div className="si-mini-card__label">Present Days</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--red">
              <span className="si-mini-card__icon">❌</span>
              <div>
                <div className="si-mini-card__num">{absentRecords}</div>
                <div className="si-mini-card__label">Absent Days</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--orange">
              <span className="si-mini-card__icon">📋</span>
              <div>
                <div className="si-mini-card__num">{totalRecords}</div>
                <div className="si-mini-card__label">Total Records</div>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="sd-panel" style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
              ⏳ Loading attendance records...
            </div>
          ) : Object.keys(groupedData).length === 0 ? (
            <div className="sd-panel">
              <div className="sd-empty">
                <span>📅</span>
                <p>No attendance records found for the selected period.</p>
              </div>
            </div>
          ) : (
            Object.values(groupedData).map((staffData) => {
              const limit = visibleCounts[staffData.info._id] || 5;
              const shownRecords = staffData.records.slice(0, limit);
              const presentDays = staffData.records.filter((r) => r.status === "present").length;
              const absentDays = staffData.records.filter((r) => r.status === "absent").length;

              return (
                <div key={staffData.info._id} className="sd-panel si-table-panel">
                  {/* Staff Header */}
                  <div className="sd-panel__header" style={{ marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div className="sd-avatar" style={{ width: 44, height: 44, fontSize: 18 }}>
                        <span>{(staffData.info.username || "S")[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>
                          {staffData.info.username}
                        </h3>
                        <span style={{ fontSize: 13, color: "#94a3b8" }}>{staffData.info.email}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span className="sd-badge badge-delivered">✅ {presentDays} Present</span>
                      <span className="sd-badge badge-cancelled">❌ {absentDays} Absent</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{staffData.records.length} records</span>
                    </div>
                  </div>

                  {/* Attendance table */}
                  <div className="si-table-wrap">
                    <table className="si-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Login</th>
                          <th>Logout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shownRecords.map((record) => (
                          <tr key={record._id}>
                            <td style={{ fontWeight: 500, color: "#334155" }}>{formatDate(record.date)}</td>
                            <td>
                              <span className={`sd-badge ${record.status === "present" ? "badge-delivered" : "badge-cancelled"}`}>
                                {record.status === "present" ? "Present" : "Absent"}
                              </span>
                            </td>
                            <td style={{ color: record.status === "absent" ? "#ef4444" : "#334155" }}>
                              {record.status === "absent" ? "—" : formatTime(record.checkInTime)}
                            </td>
                            <td>
                              {record.status === "absent" ? (
                                <span style={{ color: "#ef4444" }}>—</span>
                              ) : record.lastLogoutClick ? (
                                formatTime(record.lastLogoutClick)
                              ) : isToday(record.date) || !record.checkInTime ? (
                                "—"
                              ) : (
                                <span className="sd-badge badge-cancelled">Not Recorded</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Show More */}
                  {staffData.records.length > limit && (
                    <div style={{ textAlign: "center", marginTop: "16px" }}>
                      <button
                        onClick={() => handleShowMore(staffData.info._id)}
                        className="si-btn-cancel"
                        style={{ borderRadius: "20px", padding: "8px 24px" }}
                      >
                        Show More ({staffData.records.length - limit} remaining)
                      </button>
                    </div>
                  )}
                </div>
              );
            })
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

export default Attendance;
