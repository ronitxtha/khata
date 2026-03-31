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
    { path: "/cart", label: "Shopping Cart", icon: "🛒" },
    { path: "/customer-profile", label: "My Profile", icon: "👤" },
  ];

  return (
    <aside
      className={`cd-sidebar ${open ? "cd-sidebar--open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Brand */}
      <div className="cd-sidebar__brand">
        <span className="cd-sidebar__logo">🛍️</span>
        <span className="cd-sidebar__brand-name">Khata</span>
      </div>

      {/* Navigation */}
      <nav className="cd-sidebar__nav">
        {navLinks.map((link) => {
          const active = location.pathname === link.path;

          return (
            <button
              key={link.path}
              className={`cd-sidebar__link ${active ? "active" : ""}`}
              onClick={() => navigate(link.path)}
            >
              <span className="cd-sidebar__icon">{link.icon}</span>
              <span className="cd-sidebar__label">{link.label}</span>
              {active && <span className="cd-sidebar__active-bar" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom (Logout) */}
      <div className="cd-sidebar__bottom">
        <button
          className="cd-sidebar__link cd-sidebar__logout"
          onClick={handleLogout}
        >
          <span className="cd-sidebar__icon">🚪</span>
          <span className="cd-sidebar__label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default CustomerSidebar;