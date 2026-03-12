import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/staffDashboard.css";
import "../styles/staffAttendance.css";

const API_BASE = "http://localhost:8000";

const StaffAttendance = () => {
  const navigate = useNavigate();
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        
        // Fetch staff profile for navbar and attendance data
        const [profileRes, attRes] = await Promise.all([
          axios.get(`${API_BASE}/api/staff/profile`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/api/staff/my-attendance`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setStaff(profileRes.data.staff);
        
        // Ensure attendance list is sorted by date ascending? Let's sort descending (newest first)
        const sortedAtt = (attRes.data.attendance || []).sort((a, b) => {
          return new Date(b.date || b.checkInTime) - new Date(a.date || a.checkInTime);
        });
        setAttendanceList(sortedAtt);
      } catch (err) {
        console.error(err);
        showToast("Failed to load attendance", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${API_BASE}/api/staff/logout-click`, {}, { headers: { Authorization: `Bearer ${token}` } });
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

  // Calculations for summary cards
  const totalDays = attendanceList.length;
  const completedDays = attendanceList.filter(a => a.lastLogoutClick).length;

  let totalHoursNum = 0;
  attendanceList.forEach(rec => {
    const checkInTime = rec.checkInTime ? new Date(rec.checkInTime) : null;
    const checkOutTime = rec.lastLogoutClick ? new Date(rec.lastLogoutClick) : null;
    if (checkInTime && checkOutTime) {
      const diff = (checkOutTime - checkInTime) / (1000 * 60 * 60);
      totalHoursNum += diff;
    }
  });

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
              <h1>Attendance History</h1>
              <span className="sd-navbar__subtitle">View your past check-ins and hours</span>
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
              <span className="sd-navbar__role">Staff</span>
            </div>
          </div>
        </header>

        {/* ---- CONTENT ---- */}
        <main className="sd-content">
          <div className="sd-welcome sa-banner">
            <div>
              <h2>📅 Attendance Overview</h2>
              <p>Track your working hours and daily logins.</p>
            </div>
          </div>

          {!loading && (
            <>
              {/* Summary mini-cards */}
              <div className="si-mini-cards sa-mini-cards">
                <div className="si-mini-card si-mini-card--blue">
                  <span className="si-mini-card__icon">🗓️</span>
                  <div>
                    <div className="si-mini-card__num">{totalDays}</div>
                    <div className="si-mini-card__label">Total Logins</div>
                  </div>
                </div>
                <div className="si-mini-card si-mini-card--green">
                  <span className="si-mini-card__icon">⏱️</span>
                  <div>
                    <div className="si-mini-card__num">{totalHoursNum.toFixed(1)}</div>
                    <div className="si-mini-card__label">Total Hours</div>
                  </div>
                </div>
                <div className="si-mini-card si-mini-card--orange">
                  <span className="si-mini-card__icon">✅</span>
                  <div>
                    <div className="si-mini-card__num">{completedDays}</div>
                    <div className="si-mini-card__label">Completed Days</div>
                  </div>
                </div>
              </div>

              {/* Attendance Table Panel */}
              <div className="sd-panel sa-table-panel">
                <div className="sd-panel__header">
                  <h3>📜 Attendance Records</h3>
                </div>

                {attendanceList.length > 0 ? (
                  <div className="sa-table-wrap">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Check-In</th>
                          <th>Check-Out</th>
                          <th>Hours</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceList.map((record) => {
                          const checkInTime = record.checkInTime ? new Date(record.checkInTime) : null;
                          const checkOutTime = record.lastLogoutClick ? new Date(record.lastLogoutClick) : null;
                          
                          // Check if the record is from today
                          const isToday = checkInTime && (new Date().toDateString() === checkInTime.toDateString());
                          
                          let workingHours = "—";
                          if (checkInTime && checkOutTime) {
                            const diff = (checkOutTime - checkInTime) / (1000 * 60 * 60);
                            workingHours = `${diff.toFixed(2)} hrs`;
                          }
                          
                          let checkOutDisplay = "—";
                          let statusDisplay = "Missing Checkout";
                          let badgeClass = "badge-pending";

                          if (checkOutTime) {
                            checkOutDisplay = checkOutTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
                            statusDisplay = "Completed";
                            badgeClass = "badge-delivered";
                          } else if (isToday) {
                            checkOutDisplay = <span className="sa-active-text">Still working</span>;
                            statusDisplay = "Active";
                          } else {
                            checkOutDisplay = <span className="sa-missing-text">Not recorded</span>;
                            badgeClass = "badge-out-stock";
                          }

                          return (
                            <tr key={record._id}>
                              <td className="sa-date-cell">
                                {checkInTime ? checkInTime.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                              </td>
                              <td className="sa-time-cell">
                                {checkInTime ? checkInTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }) : "—"}
                              </td>
                              <td className="sa-time-cell">
                                {checkOutDisplay}
                              </td>
                              <td className="sa-hours-cell">{workingHours}</td>
                              <td>
                                <span className={`sd-badge ${badgeClass}`}>
                                  {statusDisplay}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="sd-empty">
                    <span>📋</span>
                    <p>No attendance records found.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {loading && (
            <div className="sa-loading">
              <div className="sa-spinner"></div>
              <p>Loading attendance data...</p>
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

export default StaffAttendance;
