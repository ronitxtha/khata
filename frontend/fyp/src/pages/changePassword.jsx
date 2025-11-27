import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../styles/changePassword.css";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { email } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateForm = () => {
    if (newPassword.length < 4) {
      setError("Password must be at least 4 characters");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    setError("");
    return true;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await axios.post(
        `http://localhost:8000/user/change-password/${email}`,
        { newPassword, confirmPassword }
      );
      if (res.data.success) {
        setSuccess(res.data.message);
        setError("");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(res.data.message);
        setSuccess("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Password change failed");
      setSuccess("");
    }
  };

  return (
    <div className="change-password-container">
      <h2>Change Password</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleChangePassword}>
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button type="submit">Change Password</button>
      </form>
    </div>
  );
}
