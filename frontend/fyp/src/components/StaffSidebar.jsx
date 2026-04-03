import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/staffDashboard.css";
import "../styles/ownerDashboard.css";
import { imgUrl } from "../utils/imageUrl";

const StaffSidebar = ({ sidebarOpen, setSidebarOpen, staff, handleLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: "Dashboard", icon: "🏠", path: "/staff-dashboard" },
    { label: "Inventory", icon: "📦", path: "/staff-inventory" },
    { label: "Attendance", icon: "📅", path: "/staff-attendance" },
    { label: "Orders", icon: "🛒", path: "/order-management" },
    { label: "Profile", icon: "👤", path: "/staff-profile" },
  ];

  const API_BASE = "http://localhost:8000";

  return (
    <>
      <aside
        className={`sd-sidebar-modern od-sidebar ${sidebarOpen ? "open" : ""}`}
        onMouseEnter={() => {
          if (window.sidebarTimer) clearTimeout(window.sidebarTimer);
          setSidebarOpen(true);
        }}
        onMouseLeave={() => {
          window.sidebarTimer = setTimeout(() => setSidebarOpen(false), 300);
        }}
      >
        <div className="sd-sidebar__brand od-brand">
          <div className="od-logo-container">
            <span className="od-logo-text">KhataStaff</span>
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
              <img 
                src={staff?.profileImage ? imgUrl(staff.profileImage) : `https://ui-avatars.com/api/?name=${staff?.username || "Staff"}`} 
                alt="Profile" 
              />
            </div>
            <div className="od-user-info">
              <span className="od-user-name">{staff?.username || "Staff"}</span>
              <span className="od-user-role">STAFF</span>
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

export default StaffSidebar;
