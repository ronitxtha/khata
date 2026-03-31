import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/staffDashboard.css";
import "../styles/ownerDashboard.css";

const OwnerSidebar = ({ sidebarOpen, setSidebarOpen, owner, handleLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: "Dashboard", icon: "🏠", path: "/owner-dashboard" },
    { label: "Product Management", icon: "📦", path: "/products" },
    { label: "Orders", icon: "🛒", path: "/order-management" },
    { label: "Staff Management", icon: "👥", path: "/add-staff" },
    { label: "Supplier Management", icon: "🏭", path: "/supplier-management" },
    { label: "Attendance", icon: "📅", path: "/attendance" },
    { label: "Profile", icon: "👤", path: "/owner-profile" },
  ];

  return (
    <>
      <aside
        className={`sd-sidebar-modern od-sidebar ${sidebarOpen ? "open" : ""}`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <div className="sd-sidebar__brand od-brand">
          <div className="od-logo-container">
            <span className="od-logo-text">SmartKhata</span>
          </div>
        </div>

        <nav className="sd-sidebar__nav od-nav">
          {navLinks.map((link) => (
            <button
              key={link.path}
              className={`sd-sidebar__link od-nav-link ${location.pathname === link.path ? "active" : ""}`}
              onClick={() => navigate(link.path)}
            >
              <span className="sd-sidebar__label visible">{link.label}</span>
            </button>
          ))}
        </nav>

        <div className="sd-sidebar__bottom od-sidebar-footer">
          <div className="od-user-profile">
            <div className="od-user-avatar">
              <img src={owner?.profileImage || `https://ui-avatars.com/api/?name=${owner?.username || "Owner"}`} alt="Profile" />
            </div>
            <div className="od-user-info">
              <span className="od-user-name">{owner?.username || "Owner"}</span>
              <span className="od-user-role">OWNER</span>
            </div>
          </div>
          <button className="od-logout-btn" onClick={handleLogout} title="Logout">
             Logout
          </button>
        </div>
      </aside>

      {/* Backdrop for Overlay Sidebar */}
      {sidebarOpen && (
        <div 
          className="od-sidebar-backdrop" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </>
  );
};

export default OwnerSidebar;
