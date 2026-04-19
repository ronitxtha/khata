import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

export default function OTP() {
  const navigate = useNavigate();
  const { email } = useParams();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateForm = () => {
    if (otp.length !== 6 || isNaN(Number(otp))) {
      setError("OTP must be a 6-digit number");
      return false;
    }
    setError("");
    return true;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await axios.post(`http://localhost:8000/user/verify-otp/${email}`, {
        otp,
      });
      if (res.data.success) {
        setSuccess(res.data.message);
        setError("");
        setTimeout(() => navigate(`/change-password/${email}`), 1500);
      } else {
        setError(res.data.message);
        setSuccess("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
      setSuccess("");
    }
  };

  return (
  <div className="auth-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
    <div className="auth-form-container glass-card" style={{ maxWidth: "500px", borderRadius: "1.5rem" }}>
      <h2>Verify OTP</h2>
      <p className="form-subtitle">We sent a 6-digit code to {email}</p>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}
      
      <form onSubmit={handleVerify} className="auth-form-content animate-fade-in">
        <div className="auth-form-group">
          <label className="input-label">6-Digit Code</label>
          <input
            type="text"
            className="input-field"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </div>
        <button type="submit" className="premium-btn auth-submit-btn">Verify OTP</button>
      </form>

      <div className="form-links">
        <span onClick={() => navigate("/login")}>Back to login</span>
      </div>
    </div>
  </div>
);


}
