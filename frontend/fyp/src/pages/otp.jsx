import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../styles/otp.css";

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
  <div className="otp-page-wrapper">
    <div className="otp-container">
      <h2>Verify OTP</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleVerify}>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <button type="submit">Verify OTP</button>
      </form>
    </div>
  </div>
);


}
