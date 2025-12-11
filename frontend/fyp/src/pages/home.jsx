import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState("");

  const features = [
    { title: "User Authentication", icon: "🔐", text: "Secure login and registration for customers, staff, and owners." },
    { title: "Product Management", icon: "🛒", text: "Add, update, and manage your products easily with real-time data." },
    { title: "Order Tracking", icon: "📦", text: "Track customer orders, manage status, and ensure timely delivery." },
    { title: "Store Management", icon: "🏬", text: "Manage multiple stores, staff, and inventory with one dashboard." },
    { title: "Attendance System", icon: "🕒", text: "Record staff attendance and monitor working hours automatically." },
    { title: "Analytics & Reports", icon: "📊", text: "View business performance insights to make smart decisions." },
  ];

  return (
    <div className="container">
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body, html, .container {
          height: 100%;
          font-family: Arial, sans-serif;
        }
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          min-height: 100vh;
          background: linear-gradient(135deg, #007bff, #00c6ff);
          color: #fff;
          padding: 60px 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .title {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 1.2rem;
          max-width: 700px;
          margin: 0 auto;
          color: #f0f0f0;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 25px;
          width: 100%;
          max-width: 1000px;
          margin-top: 40px;
        }
        .feature-card {
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: 0.3s;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .feature-card.hovered {
          background: rgba(255,255,255,0.2);
          transform: scale(1.05);
        }
        .feature-icon {
          font-size: 2rem;
          margin-bottom: 10px;
        }
        .feature-title {
          font-weight: bold;
          font-size: 1.2rem;
          margin-bottom: 8px;
        }
        .feature-text {
          font-size: 0.95rem;
          color: #e0e0e0;
        }
        .button-container {
          display: flex;
          gap: 20px;
          margin-top: 50px;
        }
        .button {
          background-color: #fff;
          color: #007bff;
          border: none;
          padding: 12px 28px;
          border-radius: 10px;
          font-size: 16px;
          cursor: pointer;
          transition: 0.3s;
          font-weight: bold;
        }
        .button.hovered {
          background-color: #0056b3;
          color: #fff;
        }
        .footer {
          margin-top: 60px;
          color: #cce7ff;
          font-size: 0.9rem;
          text-align: center;
        }
      `}</style>

      <div className="header">
        <h1 className="title">Welcome to Smart-Khata</h1>
        <p className="subtitle">
          A complete business management and e-commerce solution — built for
          owners, staff, and customers to connect seamlessly.
        </p>
      </div>

      <div className="feature-grid">
        {features.map((f, i) => (
          <div
            key={i}
            className={`feature-card ${hovered === i ? "hovered" : ""}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered("")}
            onClick={() => {
              if (f.title === "User Authentication") navigate("/user-authentication");
              if (f.title === "Product Management") navigate("/product-management");
            }}
          >
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-text">{f.text}</div>
          </div>
        ))}
      </div>

      <div className="button-container">
        <button
          className={`button ${hovered === "login" ? "hovered" : ""}`}
          onMouseEnter={() => setHovered("login")}
          onMouseLeave={() => setHovered("")}
          onClick={() => navigate("/login")}
        >
          Login
        </button>

        <button
          className={`button ${hovered === "signup" ? "hovered" : ""}`}
          onMouseEnter={() => setHovered("signup")}
          onMouseLeave={() => setHovered("")}
          onClick={() => navigate("/register")}
        >
          Sign Up
        </button>
      </div>

      <div className="footer">
        <p>© 2025 V Ecommerce — Simplifying your business, one click at a time.</p>
      </div>
    </div>
  );
}
