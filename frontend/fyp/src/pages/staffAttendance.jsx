import React, { useState, useEffect } from "react";
import axios from "axios";
import StaffSidebar from "../components/StaffSidebar";
import "../styles/staffDashboard.css";

const StaffAttendance = () => {
  const [attendanceList, setAttendanceList] = useState([]);
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });

  const API_BASE = "http://localhost:8000";

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast({ ...toast, visible: false });
    }, duration);
  };

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const res = await axios.get(
          `${API_BASE}/api/staff/my-attendance`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setAttendanceList(res.data.attendance || []);
      } catch (err) {
        console.error(err);
        showToast("Failed to load attendance data", "error");
      }
    };

    fetchAttendance();
  }, []);

  return (
    <div className="staff-layout">
      <StaffSidebar />

      <div className="dashboard-container">
        {/* Header Section */}
        <div className="dashboard-header">
          <header>
            <h1>📅 Attendance Records</h1>
            <p className="subtitle">View your check-in and check-out history</p>
          </header>
        </div>

        {/* Attendance List Table */}
        <section className="attendance-section">
          <div className="section-header">
            <h2>Your Attendance</h2>
          </div>

          {attendanceList && attendanceList.length > 0 ? (
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check-In Time</th>
                    <th>Check-Out Time</th>
                    <th>Status</th>
                    <th>Working Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceList.map((record) => {
                    const checkInTime = record.checkInTime ? new Date(record.checkInTime) : null;
                    const checkOutTime = record.lastLogoutClick ? new Date(record.lastLogoutClick) : null;
                    
                    let workingHours = "N/A";
                    if (checkInTime && checkOutTime) {
                      const diff = (checkOutTime - checkInTime) / (1000 * 60 * 60);
                      workingHours = `${diff.toFixed(2)} hrs`;
                    }

                    return (
                      <tr key={record._id}>
                        <td>{checkInTime ? checkInTime.toLocaleDateString() : "N/A"}</td>
                        <td>{checkInTime ? checkInTime.toLocaleTimeString() : "N/A"}</td>
                        <td>{checkOutTime ? checkOutTime.toLocaleTimeString() : "Still working"}</td>
                        <td>
                          <span className={`status-badge ${checkOutTime ? "completed" : "active"}`}>
                            {checkOutTime ? "✔️ Completed" : "🟢 Active"}
                          </span>
                        </td>
                        <td>{workingHours}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No attendance records found.</p>
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

export default StaffAttendance;
