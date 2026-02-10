import React, { useState, useEffect } from "react";
import axios from "axios";
import StaffSidebar from "../components/StaffSidebar";
import "../styles/staffDashboard.css";

const StaffProfile = () => {
  const [staff, setStaff] = useState({});
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
  });

  const API_BASE = "http://localhost:8000";

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast({ ...toast, visible: false });
    }, duration);
  };

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const res = await axios.get(`${API_BASE}/api/owner/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStaff(res.data.staff);
        setFormData({
          username: res.data.staff.username || "",
          email: res.data.staff.email || "",
          phone: res.data.staff.phone || "",
          address: res.data.staff.address || "",
        });
      } catch (err) {
        console.error(err);
        showToast("Failed to load profile data", "error");
      }
    };

    fetchStaffData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("accessToken");

      await axios.put(
        `${API_BASE}/api/staff/update-profile`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setStaff((prev) => ({ ...prev, ...formData }));
      setIsEditing(false);
      showToast("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update profile", "error");
    }
  };

  return (
    <div className="staff-layout">
      <StaffSidebar />

      <div className="dashboard-container">
        {/* Header Section */}
        <div className="dashboard-header">
          <header>
            <h1>👤 My Profile</h1>
            <p className="subtitle">View and manage your profile information</p>
          </header>
        </div>

        {/* Profile Section */}
        <section className="profile-section">
          <div className="section-header">
            <h2>Profile Information</h2>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter address"
                  />
                </div>
              </div>

              <div className="profile-actions">
                <button type="submit" className="btn-save">
                  💾 Save Changes
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsEditing(false)}
                >
                  ✕ Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-display">
              <div className="profile-card">
                <div className="profile-item">
                  <span className="label">Username:</span>
                  <span className="value">{staff.username || "N/A"}</span>
                </div>

                <div className="profile-item">
                  <span className="label">Email:</span>
                  <span className="value">{staff.email || "N/A"}</span>
                </div>

                <div className="profile-item">
                  <span className="label">Phone:</span>
                  <span className="value">{staff.phone || "N/A"}</span>
                </div>

                <div className="profile-item">
                  <span className="label">Address:</span>
                  <span className="value">{staff.address || "N/A"}</span>
                </div>

                <div className="profile-item">
                  <span className="label">Role:</span>
                  <span className="value">{staff.role || "Staff"}</span>
                </div>

                <div className="profile-item">
                  <span className="label">Account Status:</span>
                  <span className="value status-active">✔️ Active</span>
                </div>
              </div>

              <button
                className="btn-edit-profile"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit Profile
              </button>
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

export default StaffProfile;
