import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)} onMouseEnter={() => { if (window.sidebarTimer) clearTimeout(window.sidebarTimer); setSidebarOpen(true); }} onMouseLeave={() => { window.sidebarTimer = setTimeout(() => setSidebarOpen(false), 300); }}>☰</button>
            <div className="sd-navbar__title">
              <h1>Personal Attendance</h1>
              <span className="sd-navbar__subtitle">Track your performance and working hours</span>
            </div>
          </div>
          <div className="sd-navbar__right">
              <div
                onClick={() => navigate("/staff-profile")}
                style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
              >
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
          </div>
        </header>

        {/* ---- CONTENT ---- */}
        <main className="sd-content">
          
          {/* Header Section */}
          <div className="si-header-section">
            <div className="si-header-info">
              <h2>Attendance Record</h2>
              <p>Overview of your monthly logins, total hours, and completion rate.</p>
            </div>
          </div>

          {!loading ? (
            <>
              {/* Summary Metrics */}
              <div className="si-ledger-cards">
                <div className="si-ledger-card">
                  <span className="si-ledger-card__label">Total Logins</span>
                  <div className="si-ledger-card__content">
                    <span className="si-ledger-card__num">{totalDays}</span>
                  </div>
                </div>
                <div className="si-ledger-card">
                  <span className="si-ledger-card__label">Total Hours</span>
                  <div className="si-ledger-card__content">
                    <span className="si-ledger-card__num" style={{ color: '#10b981' }}>{totalHoursNum.toFixed(1)} <span style={{fontSize: '14px', fontWeight: 500}}>hrs</span></span>
                  </div>
                </div>
                <div className="si-ledger-card">
                  <span className="si-ledger-card__label">Completed Days</span>
                  <div className="si-ledger-card__content">
                    <span className="si-ledger-card__num" style={{ color: '#3b82f6' }}>{completedDays}</span>
                  </div>
                </div>
                <div className="si-ledger-card">
                   <span className="si-ledger-card__label">Average (hrs/day)</span>
                   <div className="si-ledger-card__content">
                     <span className="si-ledger-card__num">{totalDays > 0 ? (totalHoursNum / totalDays).toFixed(1) : "0.0"}</span>
                   </div>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="si-ledger-table-wrap" style={{ marginTop: '32px' }}>
                <div style={{ padding: '20px', background: '#fbfcfd', borderBottom: '1px solid #f1f5f9' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800 }}>Detailed History</h3>
                </div>
                <table className="si-ledger-table">
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
                            <td style={{ fontWeight: 600 }}>{formatDate(record.date || record.checkInTime)}</td>
                            <td>{formatTime(record.checkInTime)}</td>
                            <td>
                              {checkOutTime ? formatTime(record.lastLogoutClick) : (isToday ? <span style={{ color: '#3b82f6', fontStyle: 'italic' }}>Active session</span> : <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>Not recorded</span>)}
                            </td>
                            <td style={{ fontWeight: 600, color: '#0f172a' }}>{workingHours}</td>
                            <td>
                                <div className="si-status-wrap">
                                    <span className={`si-dot ${checkOutTime ? 'si-dot--green' : (isToday ? 'si-dot--blue' : 'si-dot--orange')}`}></span>
                                    <span className="si-status-text" style={{ fontWeight: 600 }}>
                                      {checkOutTime ? "Completed" : (isToday ? "In Progress" : "Missing Checkout")}
                                    </span>
                                </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                          No attendance records found yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
