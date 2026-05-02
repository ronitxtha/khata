import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import "../styles/ownerDashboard.css";
import "../styles/orderManagement.css";
import "../styles/attendance.css";

const API_BASE = "http://localhost:8000";

const Attendance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [owner, setOwner] = useState({});
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
            <h1 className="od-topbar__title">Attendance History</h1>
            <div className="od-topbar__date">Monitor staff check-in/out patterns</div>
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
          <div className="am-page-head">
            <div>
              <h2 className="am-page-head__title">Team Attendance Log</h2>
              <p className="am-page-head__sub">Detailed overview of staff attendance across your company.</p>
            </div>
            <div className="am-page-head__actions" style={{ display: 'flex', gap: '12px' }}>
              <select
                className="am-select"
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

          {/* Stat cards */}
          <div className="om-stat-row">
            {[
              { label:"Total Staff",  val: totalStaff,     color:"#6366f1", icon:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" },
              { label:"Present Days", val: presentRecords, color:"#10b981", icon:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label:"Absent Days",  val: absentRecords,  color:"#ef4444", icon:"M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label:"Total Logs",   val: totalRecords,   color:"#8b5cf6", icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
            ].map(c=>(
              <div key={c.label} className="om-stat-card" style={{"--card-color":c.color}}>
                <div className="om-stat-card__icon" style={{background:c.color+"18",color:c.color}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon}/></svg>
                </div>
                <div>
                  <div className="om-stat-card__label">{c.label}</div>
                  <div className="om-stat-card__value" style={{color: c.label === "Absent Days" ? "#ef4444" : c.label === "Present Days" ? "#10b981" : ""}}>{c.val}</div>
                </div>
              </div>
            ))}
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
                  <div key={staffData.info._id} className="am-table-wrap" style={{ marginBottom: '32px' }}>
                    <div style={{ padding: '20px', background: '#fbfcfd', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div className="am-avatar-circle" style={{ width: 44, height: 44 }}>
                                <span>{(staffData.info.username || "S")[0].toUpperCase()}</span>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 800 }}>{staffData.info.username}</h3>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{staffData.info.email}</div>
                            </div>
                         </div>
                         <div style={{ display: 'flex', gap: '8px' }}>
                             <span className="am-tag" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #10b98120' }}>✅ {presentDays} Present</span>
                             <span className="am-tag" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #ef444420' }}>❌ {absentDays} Absent</span>
                         </div>
                    </div>
                    <table className="am-table">
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
                              <div className="am-status-wrap">
                                <span className={`am-dot ${record.status === "present" ? "am-dot--green" : "am-dot--red"}`}></span>
                                <span className="am-status-text" style={{ fontWeight: 600, color: record.status === "present" ? '#059669' : '#dc2626' }}>
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
                          className="am-btn-ghost"
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
      {toast.visible && <div className={`od-toast od-toast--${toast.type}`}>{toast.message}</div>}
    </div>
  );
};

export default Attendance;
