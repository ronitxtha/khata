import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import "../styles/ownerDashboard.css"; // We'll reuse this file's layout and some styles

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const [filterMonth, setFilterMonth] = useState("all"); // 'all', 'current', 'last', 'older'

  const API_BASE = "http://localhost:8000";

  useEffect(() => {
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
      setError("Failed to load attendance history.");
      showToast("Error loading history", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast({ ...toast, visible: false });
    }, duration);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    const d = new Date(timeString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group attendance by Staff Member
  const groupedData = attendance.reduce((acc, record) => {
    if (!record.staffId) return acc; // Skip orphaned records
    
    // Grouping by Date for filtering purposes
    const recordMonth = new Date(record.date).getMonth();
    const currentMonth = new Date().getMonth();
    
    let timeCategory = "older";
    if (recordMonth === currentMonth) timeCategory = "current";
    else if ((currentMonth === 0 && recordMonth === 11) || recordMonth === currentMonth - 1) timeCategory = "last";

    if (filterMonth !== "all" && timeCategory !== filterMonth) return acc;

    const staffId = record.staffId._id;
    if (!acc[staffId]) {
      acc[staffId] = {
        info: record.staffId,
        records: []
      };
    }
    acc[staffId].records.push(record);
    return acc;
  }, {});

  return (
    <div className="owner-layout">
      <Sidebar />
      <div className="dashboard-container">
        
        <div className="dashboard-header">
          <header>
            <h1>Staff Attendance History</h1>
            <p className="subtitle">View up to 3 months of staff login and logout records</p>
          </header>
        </div>

        <section className="attendance-section" style={{ padding: "20px 0" }}>
          
          <div className="filter-controls" style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
             <label style={{ fontWeight: "bold" }}>Filter by Time:</label>
             <select 
               value={filterMonth} 
               onChange={(e) => setFilterMonth(e.target.value)}
               style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc" }}
             >
               <option value="all">Last 3 Months (All)</option>
               <option value="current">Current Month</option>
               <option value="last">Last Month</option>
             </select>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>Loading records...</div>
          ) : error ? (
            <div className="empty-state">
              <p style={{ color: "red" }}>{error}</p>
            </div>
          ) : Object.keys(groupedData).length === 0 ? (
             <div className="empty-state">
               <p>📋 No attendance records found for the selected period.</p>
             </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
              {Object.values(groupedData).map((staffData) => (
                <div key={staffData.info._id} style={{ 
                    background: "white", 
                    borderRadius: "15px", 
                    padding: "20px", 
                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)" 
                }}>
                  <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      borderBottom: "2px solid #f0f0f0", 
                      paddingBottom: "15px", 
                      marginBottom: "15px" 
                  }}>
                    <div>
                      <h3 style={{ margin: "0 0 5px 0", color: "#1a1a1a" }}>{staffData.info.username}</h3>
                      <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>{staffData.info.email}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: "0 0 5px 0", fontSize: "0.85rem", color: "#888" }}>Joined Date</p>
                      <p style={{ margin: 0, fontWeight: "bold", color: "#007bff" }}>
                        {formatDate(staffData.info.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f8f9fa" }}>
                          <th style={{ padding: "12px", borderBottom: "2px solid #eaeaea", color: "#444" }}>Date</th>
                          <th style={{ padding: "12px", borderBottom: "2px solid #eaeaea", color: "#444" }}>Status</th>
                          <th style={{ padding: "12px", borderBottom: "2px solid #eaeaea", color: "#444" }}>Login Time</th>
                          <th style={{ padding: "12px", borderBottom: "2px solid #eaeaea", color: "#444" }}>Logout Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffData.records.map((record) => (
                          <tr key={record._id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                            <td style={{ padding: "12px", fontWeight: "500" }}>{formatDate(record.date)}</td>
                            <td style={{ padding: "12px" }}>
                              <span style={{ 
                                padding: "4px 8px", 
                                borderRadius: "4px", 
                                fontSize: "0.85rem",
                                fontWeight: "bold",
                                backgroundColor: record.status === "present" ? "#e6f4ea" : "#fce8e6",
                                color: record.status === "present" ? "#137333" : "#c5221f"
                              }}>
                                {record.status.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: "12px", color: "#555" }}>{formatTime(record.checkInTime)}</td>
                            <td style={{ padding: "12px", color: "#555" }}>
                              {record.checkOutTime ? formatTime(record.checkOutTime) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {toast.visible && (
          <div className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
