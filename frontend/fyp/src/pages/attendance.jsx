import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/staffDashboard.css";
import "../styles/staffInventory.css";
import "../styles/ownerDashboard.css";
import OwnerSidebar from "../components/OwnerSidebar";

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
     const fetchData = async () => {
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          setOwner(user);
          await fetchHistory();
        } catch (err) {
          console.error(err);
        }
     };
     fetchData();
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
    return new Date(dateString).toLocaleDateString("en-US", { weekday: 'short', day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    return new Date(timeString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return d.toDateString() === today.toDateString();
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

  return (
    <div className="sd-layout">
      {/* Shared Owner Sidebar */}
      <OwnerSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        owner={owner} 
        handleLogout={handleLogout} 
      />

      {/* ========== MAIN AREA ========== */}
      <div className={`sd-main od-main-content ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        {/* ---- TOP NAVBAR ---- */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)} onMouseEnter={() => { if (window.sidebarTimer) clearTimeout(window.sidebarTimer); setSidebarOpen(true); }} onMouseLeave={() => { window.sidebarTimer = setTimeout(() => setSidebarOpen(false), 300); }}>☰</button>
            <div className="sd-navbar__title">
              <h1>Attendance History</h1>
              <span className="sd-navbar__subtitle">Monitor staff check-in/out patterns</span>
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
          
          {/* 1. Header Section */}
          <div className="si-header-section">
            <div className="si-header-info">
              <h2>Team Attendance Log</h2>
              <p>Detailed overview of staff attendance across your company.</p>
            </div>
            <div className="si-header-actions" style={{ display: 'flex', gap: '12px' }}>
              <select
                className="si-ledger-select"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                style={{ minWidth: '180px' }}
              >
                <option value="all">Time Period: Last 3 Months</option>
                <option value="current">Current Month Only</option>
                <option value="last">Last Month Only</option>
                <option value="older">Older Records</option>
              </select>
            </div>
          </div>

          {/* 2. Stats Section */}
          <div className="si-ledger-cards">
            <div className="si-ledger-card">
              <span className="si-ledger-card__label">Total Staff</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num">{totalStaff}</span>
              </div>
            </div>
            <div className="si-ledger-card">
              <span className="si-ledger-card__label">Present Days</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num" style={{ color: '#10b981' }}>{presentRecords}</span>
              </div>
            </div>
            <div className="si-ledger-card">
              <span className="si-ledger-card__label">Absent Days</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num" style={{ color: '#ef4444' }}>{absentRecords}</span>
              </div>
            </div>
            <div className="si-ledger-card">
              <span className="si-ledger-card__label">Total Days</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num">{totalRecords}</span>
              </div>
            </div>
          </div>

          {/* 3. Grouped History */}
          <div style={{ marginTop: '24px' }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>⏳ Loading team history...</div>
            ) : Object.keys(groupedData).length === 0 ? (
              <div className="sd-panel" style={{ padding: '60px', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                <span>No attendance records found for the selected filter.</span>
              </div>
            ) : (
              Object.values(groupedData).map((staffData) => {
                const limit = visibleCounts[staffData.info._id] || 5;
                const shownRecords = staffData.records.slice(0, limit);
                const presentDays = staffData.records.filter((r) => r.status === "present").length;
                const absentDays = staffData.records.filter((r) => r.status === "absent").length;

                return (
                  <div key={staffData.info._id} className="si-ledger-table-wrap" style={{ marginBottom: '32px' }}>
                    <div style={{ padding: '20px', background: '#fbfcfd', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div className="sd-avatar" style={{ width: 44, height: 44 }}>
                                <span>{(staffData.info.username || "S")[0].toUpperCase()}</span>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 800 }}>{staffData.info.username}</h3>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{staffData.info.email}</div>
                            </div>
                         </div>
                         <div style={{ display: 'flex', gap: '8px' }}>
                             <span className="si-ledger-tag" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #10b98120' }}>✅ {presentDays} Present</span>
                             <span className="si-ledger-tag" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #ef444420' }}>❌ {absentDays} Absent</span>
                         </div>
                    </div>
                    <table className="si-ledger-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Clock-In</th>
                          <th>Clock-Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shownRecords.map((record) => (
                          <tr key={record._id}>
                            <td style={{ fontWeight: 600 }}>{formatDate(record.date)}</td>
                            <td>
                              <div className="si-status-wrap">
                                <span className={`si-dot ${record.status === "present" ? "si-dot--green" : "si-dot--red"}`}></span>
                                <span className="si-status-text" style={{ fontWeight: 600, color: record.status === "present" ? '#059669' : '#dc2626' }}>
                                  {record.status === "present" ? "Present" : "Absent"}
                                </span>
                              </div>
                            </td>
                            <td style={{ fontWeight: 500 }}>
                              {record.status === "absent" ? <span style={{ color: '#94a3b8' }}>—</span> : formatTime(record.checkInTime)}
                            </td>
                            <td style={{ fontWeight: 500 }}>
                              {record.status === "absent" ? (
                                <span style={{ color: "#94a3b8" }}>—</span>
                              ) : record.lastLogoutClick ? (
                                formatTime(record.lastLogoutClick)
                              ) : isToday(record.date) || !record.checkInTime ? (
                                <span style={{ color: '#3b82f6', fontStyle: 'italic' }}>On-duty</span>
                              ) : (
                                <span style={{ color: "#f59e0b", fontStyle: 'italic' }}>Not Recorded</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {staffData.records.length > limit && (
                      <div style={{ padding: '16px', background: '#fbfcfd', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          onClick={() => handleShowMore(staffData.info._id)}
                          className="si-btn-cancel"
                          style={{ minWidth: '180px' }}
                        >
                          Load More ({staffData.records.length - limit} logs remaining)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
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
