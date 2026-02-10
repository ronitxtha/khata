import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/addStaff.css";
import Sidebar from "../components/Sidebar";


const addStaff = () => {
  const API_BASE = "http://localhost:8000";

  const [staffList, setStaffList] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const [staffPhone, setStaffPhone] = useState("");
const [staffAddress, setStaffAddress] = useState("");


  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ visible: false }), duration);
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("accessToken");

      const staffRes = await axios.get(`${API_BASE}/api/owner/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const attendanceRes = await axios.get(
        `${API_BASE}/api/owner/today-attendance`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStaffList(staffRes.data.staff || []);
      setAttendanceList(attendanceRes.data.attendance || []);
    };

    fetchData();
  }, []);

  const isValidPhone = (phone) => {
  const phoneRegex = /^\d{10}$/;   // exactly 10 digits
  return phoneRegex.test(phone);
};

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
  { 
    name: staffName, 
    email: staffEmail, 
    phone: staffPhone,
    address: staffAddress,
    password 
  },
  { headers: { Authorization: `Bearer ${token}` } }
);

      setStaffList([...staffList, res.data.staff]);
      setStaffName("");
      setStaffEmail("");
      setStaffPhone("");
      setStaffAddress("");
      showToast(`Staff added. Password: ${password}`);
    } catch (err) {
      showToast("Failed to add staff", "error");
    }
  };

  const handleDeleteStaff = async (staffId) => {
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
  
    return (
  <div className="owner-layout">
    <Sidebar />

    <div className="dashboard-container">

      <h1>Staff Management</h1>

      {/* Add Staff */}
      <section className="add-staff-section">
        <h2>Add Staff</h2>
        <form onSubmit={handleAddStaff}>
          <input
  type="text"
  placeholder="Staff Name"
  value={staffName}
  onChange={(e) => setStaffName(e.target.value)}
  required
/>

<input
  type="email"
  placeholder="Staff Email"
  value={staffEmail}
  onChange={(e) => setStaffEmail(e.target.value)}
  required
/>

<input
  type="text"
  placeholder="Phone Number"
  value={staffPhone}
  onChange={(e) => setStaffPhone(e.target.value.replace(/\D/g, ""))}
  maxLength={10}
  required
/>

<input
  type="text"
  placeholder="Address"
  value={staffAddress}
  onChange={(e) => setStaffAddress(e.target.value)}
  required
/>

          <button type="submit">Add Staff</button>
        </form>
      </section>

      {/* Staff List */}
      <section className="staff-list">
        <h2>Staff List</h2>
        {staffList && staffList.length > 0 ? (
          <div className="staff-table-wrapper">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff._id}>
                    <td>{staff.username || "N/A"}</td>
                    <td>{staff.email || "N/A"}</td>
                    <td>{staff.phone || "N/A"}</td>
                    <td>{staff.address || "N/A"}</td>
                    <td>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteStaff(staff._id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No staff members added yet.</p>
          </div>
        )}
      </section>

      {/* Attendance */}
      <section className="attendance-section">
        <h2>Today's Attendance</h2>

        {attendanceList.length === 0 ? (
          <p>No attendance today</p>
        ) : (
          <div className="attendance-grid">
            {attendanceList.map((a) => {
              const isWorking = !a.lastLogoutClick;
              return (
                <div key={a._id} className="attendance-card">
                  <h4>{a.staffId?.username}</h4>
                  <p>{a.staffId?.email}</p>
                  <p>Status: {isWorking ? "🟢 Present" : "✔️ Logged out"}</p>
                  {a.checkInTime && (
                    <p>Login: {new Date(a.checkInTime).toLocaleTimeString()}</p>
                  )}
                  {a.lastLogoutClick && (
                    <p>Logout: {new Date(a.lastLogoutClick).toLocaleTimeString()}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {toast.visible && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
    </div>
  );
};

export default addStaff;
