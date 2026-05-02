import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import "../styles/staffDashboard.css";
import "../styles/staffInventory.css";
import "../styles/ownerDashboard.css";
import StaffSidebar from "../components/StaffSidebar";

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
        
        const [profileRes, attRes] = await Promise.all([
          axios.get(`${API_BASE}/api/staff/profile`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/api/staff/my-attendance`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setStaff(profileRes.data.staff);
        
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "—";
    return new Date(timeString).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="od-shell">
      {/* ══════════════════════ SIDEBAR ══════════════════════ */}
      <StaffSidebar staff={staff} />

      {/* ══════════════════════ MAIN ══════════════════════════ */}
      <div className="od-main">
        {/* ── Top bar ── */}
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">Personal Attendance</h1>
            <div className="od-topbar__date" style={{fontSize: '13px', color: '#64748b', marginTop: '4px'}}>
              Track your performance and working hours
            </div>
          </div>

          <div className="od-topbar__right">
            {/* Avatar */}
            <div className="od-topbar__profile" onClick={() => navigate("/staff-profile")}>
              <div className="od-topbar__avatar">
                {staff?.profileImage ? (
                  <img src={imgUrl(staff.profileImage)} alt="avatar" />
                ) : (
                  <span>{(staff?.username || "S")[0].toUpperCase()}</span>
                )}
              </div>
            </div>

            {/* Logout */}
            <button className="od-topbar__logout" onClick={handleLogout} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="od-content">
          

          {!loading ? (
            <>
              {/* Summary Metrics */}
              <div className="od-stat-grid" style={{ marginBottom: "24px" }}>
                <div className="od-stat-card">
                  <div className="od-stat-card__icon" style={{ background: "#8b5cf618", color: "#8b5cf6" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <div>
                    <div className="od-stat-card__label">Total Logins</div>
                    <div className="od-stat-card__value">{totalDays}</div>
                  </div>
                </div>
                <div className="od-stat-card">
                  <div className="od-stat-card__icon" style={{ background: "#10b98118", color: "#10b981" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div>
                    <div className="od-stat-card__label">Total Hours</div>
                    <div className="od-stat-card__value">{totalHoursNum.toFixed(1)} <span style={{fontSize: '14px', fontWeight: 500}}>hrs</span></div>
                  </div>
                </div>
                <div className="od-stat-card">
                  <div className="od-stat-card__icon" style={{ background: "#3b82f618", color: "#3b82f6" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div>
                    <div className="od-stat-card__label">Completed Days</div>
                    <div className="od-stat-card__value">{completedDays}</div>
                  </div>
                </div>
                <div className="od-stat-card">
                  <div className="od-stat-card__icon" style={{ background: "#f59e0b18", color: "#f59e0b" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
                  </div>
                  <div>
                    <div className="od-stat-card__label">Average (hrs/day)</div>
                    <div className="od-stat-card__value">{totalDays > 0 ? (totalHoursNum / totalDays).toFixed(1) : "0.0"}</div>
                  </div>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="od-panel od-panel--table" style={{ marginBottom: "40px" }}>
                <div className="od-panel__head">
                  <div>
                    <div className="od-panel__title">Detailed History</div>
                    <div className="od-panel__sub">Your daily attendance logs</div>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="od-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Check-In</th>
                        <th>Check-Out</th>
                        <th>Duration</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceList.length > 0 ? (
                        attendanceList.map((record) => {
                          const checkInTime = record.checkInTime ? new Date(record.checkInTime) : null;
                          const checkOutTime = record.lastLogoutClick ? new Date(record.lastLogoutClick) : null;
                          const isToday = checkInTime && (new Date().toDateString() === checkInTime.toDateString());
                          
                          let workingHours = "—";
                          if (checkInTime && checkOutTime) {
                            const diff = (checkOutTime - checkInTime) / (1000 * 60 * 60);
                            workingHours = `${diff.toFixed(2)} hrs`;
                          }
                          
                          return (
                            <tr key={record._id}>
                              <td className="od-table__date">{formatDate(record.date || record.checkInTime)}</td>
                              <td>{formatTime(record.checkInTime)}</td>
                              <td>
                                {checkOutTime ? formatTime(record.lastLogoutClick) : (isToday ? <span style={{ color: '#3b82f6', fontStyle: 'italic' }}>Active session</span> : <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>Not recorded</span>)}
                              </td>
                              <td style={{ fontWeight: 600, color: '#0f172a' }}>{workingHours}</td>
                              <td>
                                <span className={`od-badge od-badge--${checkOutTime ? 'green' : (isToday ? 'blue' : 'amber')}`}>
                                  {checkOutTime ? "Completed" : (isToday ? "In Progress" : "Missing Checkout")}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="od-table__empty">
                            No attendance records found yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>
              ⏳ Loading your history...
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
