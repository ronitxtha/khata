import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();

  const features = [
    { title: "User Authentication", icon: "🔐", text: "Secure login and registration for customers, staff, and owners.", nav: "/login" },
    { title: "Product Management", icon: "🛒", text: "Add, update, and manage your products easily with real-time data.", nav: "/login" },
    { title: "Order Tracking", icon: "📦", text: "Track customer orders, manage status, and ensure timely delivery.", nav: "/login" },
    { title: "Store Management", icon: "🏬", text: "Manage multiple stores, staff, and inventory with one dashboard.", nav: "/login" },
    { title: "Attendance System", icon: "🕒", text: "Record staff attendance and monitor working hours automatically.", nav: "/login" },
    { title: "Analytics & Reports", icon: "📊", text: "View business performance insights to make smart decisions.", nav: "/login" },
  ];

  return (
    <div className="home-layout">
      {/* Navbar */}
      <header className="home-nav">
        <div className="home-logo">
          <span>SmartKhata</span>
        </div>
        <div className="home-nav-actions">
          <button className="premium-btn-outline" onClick={() => navigate("/login")}>Sign In</button>
          <button className="premium-btn" onClick={() => navigate("/register")}>Open Account</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-bg"></div>
        <div className="home-hero-content">
          <span className="home-badge">v2.0 Release Now Available</span>
          <h1 className="home-title">Retail infrastructure for the <span>modern age.</span></h1>
          <p className="home-subtitle">
            A complete business management and e-commerce solution built for 
            owners, staff, and customers to connect seamlessly.
          </p>
          <div className="home-hero-actions">
            <button className="premium-btn" onClick={() => navigate("/register")}>Start for free</button>
            <button className="premium-btn-outline" onClick={() => navigate("/demo-shop")}>View Demo</button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="home-features-section">
        <h2 className="home-section-title">Everything you need to scale</h2>
        <div className="home-grid">
          {features.map((f, i) => (
            <div key={i} className="home-card">
              <div className="home-card-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
              <div className="home-card-link" onClick={() => navigate(f.nav)}>
                Explore feature →
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>© 2026 Khata Retail Solutions. Simplifying your business, one click at a time.</p>
      </footer>
    </div>
  );
}
