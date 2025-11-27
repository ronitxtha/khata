// src/components/VerifyEmail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function VerifyEmail() {
  const { token } = useParams(); // Extract the token from frontend route
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Call backend with only the JWT token
        const res = await axios.get(`http://localhost:8000/user/verify/${token}`)

        if (res.data.success) {
          setStatus("Email verified successfully! Redirecting to login...");
          // Redirect after 3 seconds
          setTimeout(() => navigate("/login"), 3000);
        } else {
          setStatus(res.data.message || "Verification failed.");
        }
      } catch (err) {
        console.error(err.response?.data || err.message);
        setStatus(err.response?.data?.message || "Verification failed.");
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus("Invalid verification link.");
    }
  }, [token, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>{status}</h2>
    </div>
  );
}
