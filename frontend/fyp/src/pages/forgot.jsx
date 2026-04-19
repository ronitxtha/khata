import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleForgot = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8000/user/forgot-password", { email });

      if (res.data.success) {
        setMessage(res.data.message);
        setError("");

        // Redirect to OTP page after 1 second
        setTimeout(() => {
          navigate(`/otp/${email}`);
        }, 1000);
      } else {
        setError(res.data.message);
        setMessage("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Request failed");
      setMessage("");
    }
  };

  return (
    <div className="auth-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
      <div className="auth-form-container glass-card" style={{ maxWidth: "500px", borderRadius: "1.5rem" }}>
        <h2>Forgot Password</h2>
        <p className="form-subtitle">Enter your email to receive an OTP.</p>
        
        {message && <div className="success-box">{message}</div>}
        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleForgot} className="auth-form-content animate-fade-in">
          <div className="auth-form-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="premium-btn auth-submit-btn">Send OTP</button>
        </form>

        <div className="form-links">
          <span onClick={() => navigate("/login")}>
            Back to login
          </span>
        </div>
      </div>
    </div>
  );
}
