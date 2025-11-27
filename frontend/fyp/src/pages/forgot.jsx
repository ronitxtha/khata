import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/ForgotPassword.css";

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
    <div className="forgot-page">
      <div className="forgot-container">
        <h2>Forgot Password</h2>
        {message && <p className="message">{message}</p>}
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleForgot}>
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send OTP</button>
        </form>
      </div>
    </div>
  );
}
