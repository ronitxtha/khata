import React from "react";
import { useNavigate } from "react-router-dom";

const EsewaFailure = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h2 style={{ color: "#f44336" }}>Payment Failed or Cancelled</h2>
      <p>You cancelled the payment or an error occurred during the transaction.</p>
      <button 
        onClick={() => navigate("/checkout")}
        style={{ padding: "10px 20px", marginTop: "20px", cursor: "pointer", background: "#f44336", color: "#fff", border: "none", borderRadius: "4px" }}
      >
        Return to Checkout
      </button>
    </div>
  );
};

export default EsewaFailure;
