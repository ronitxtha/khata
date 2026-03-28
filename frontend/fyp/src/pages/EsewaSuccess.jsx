import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:8000";

const EsewaSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying payment...");

  useEffect(() => {
    const data = searchParams.get("data");

    if (!data) {
      setStatus("Invalid payment response.");
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await axios.post(`${API_BASE}/api/orders/esewa-success`, { data });
        setStatus("Payment verified successfully! Redirecting...");
        setTimeout(() => {
          navigate("/orders");
        }, 2000);
      } catch (error) {
        console.error("Verification error:", error);
        setStatus(error.response?.data?.message || "Payment verification failed.");
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h2>Payment Status</h2>
      <p>{status}</p>
      {status.includes("failed") && (
        <button 
          onClick={() => navigate("/checkout")}
          style={{ padding: "10px 20px", marginTop: "20px", cursor: "pointer", background: "#f44336", color: "#fff", border: "none", borderRadius: "4px" }}
        >
          Return to Checkout
        </button>
      )}
    </div>
  );
};

export default EsewaSuccess;
