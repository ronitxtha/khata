import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const CustomerSidebar = ({ isOpen, setIsOpen }) => {
  const [localOpen, setLocalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : localOpen;
  const setOpen = setIsOpen || setLocalOpen;

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const API_BASE = "http://localhost:8000";

      await axios.post(
        `${API_BASE}/api/customer/logout-click`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("accessToken");
      navigate("/login");
    }
  };

  const navLinks = [
    { path: "/customer-dashboard", label: "Browse Stores", icon: "🏪" },
    { path: "/orders", label: "My Orders", icon: "📦" },
    { path: "/customer-messages", label: "Messages", icon: "💬" },
    { path: "/cart", label: "Shopping Cart", icon: "🛒" },
    { path: "/customer-profile", label: "My Profile", icon: "👤" },
  ];

  return (
    <>
      <aside
        className={`sd-sidebar-modern od-sidebar ${open ? "open" : ""}`}
        onMouseEnter={() => {
          if (window.sidebarTimer) clearTimeout(window.sidebarTimer);
          setOpen(true);
        }}
        onMouseLeave={() => {
          window.sidebarTimer = setTimeout(() => setOpen(false), 300);
        }}
      >
        <div className="sd-sidebar__brand od-brand">
          <div className="od-logo-container">
            <span className="od-logo-text">KhataStore</span>
            <span className="od-logo-subtext">CUSTOMER PORTAL</span>
          </div>
        </div>

        <nav className="sd-sidebar__nav od-nav">
          {navLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <button
                key={link.path}
                className={`sd-sidebar__link od-nav-link ${active ? "active" : ""}`}
                onClick={() => navigate(link.path)}
              >
                <span className="sd-sidebar__label visible">{link.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sd-sidebar__bottom od-sidebar-footer">
          <div className="od-user-profile">
            <div className="od-user-avatar">
              <span>C</span>
            </div>
            <div className="od-user-info">
              <span className="od-user-name">Welcome!</span>
              <span className="od-user-role">CUSTOMER</span>
            </div>
          </div>
          <button className="od-logout-btn" onClick={handleLogout} title="Logout">
             Logout
          </button>
        </div>
      </aside>

      {/* Backdrop for Overlay Sidebar */}
      {open && (
        <div 
          className="od-sidebar-backdrop" 
          onClick={() => setOpen(false)}
        ></div>
      )}
    </>
  );
};

export default CustomerSidebar;