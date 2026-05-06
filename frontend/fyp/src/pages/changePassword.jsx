import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";
import { API_BASE } from "../config/api.js";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { email } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validatePassword = (password) => {
    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (!hasMinLength) {
      return { valid: false, message: "Password must be at least 8 characters" };
    }
    if (!hasNumber) {
      return { valid: false, message: "Password must contain at least one number" };
    }
    if (!hasSpecialChar) {
      return { valid: false, message: "Password must contain at least one special character (!@#$%^&*)" };
    }
    return { valid: true, message: "" };
  };

  const validateForm = () => {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message);
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
        `${API_BASE}/user/change-password/${email}`,
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
    <div className="auth-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
      <div className="auth-form-container glass-card" style={{ maxWidth: "500px", borderRadius: "1.5rem" }}>
        <h2>Change Password</h2>
        <p className="form-subtitle">Create a new secure password</p>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}
        
        <form onSubmit={handleChangePassword} className="auth-form-content animate-fade-in">
          <div className="auth-form-group">
            <label className="input-label">New Password</label>
            <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "8px", marginTop: "-8px" }}>
              Must contain: 8+ characters, 1 number, 1 special character (!@#$%^&*)
            </p>
            <input
              type="password"
              className="input-field"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="auth-form-group">
            <label className="input-label">Confirm Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="premium-btn auth-submit-btn">Update Password</button>
        </form>
      </div>
    </div>
  );
}
