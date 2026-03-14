import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

// Using the shared staffDashboard.css for sidebar styles
// We assume parent pages will import staffDashboard.css

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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("accessToken");
      navigate("/login");
    }
  };

  const navLinks = [
    { label: "Browse Stores", icon: "🏬", path: "/customer-dashboard" },
    { label: "My Orders", icon: "📦", path: "/orders" },
    { label: "Shopping Cart", icon: "🛒", path: "/customer-cart" },
    { label: "My Profile", icon: "👤", path: "/customer-profile" },
  ];

  return (
    <aside
      className={`sd-sidebar ${open ? "sd-sidebar--open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="sd-sidebar__brand">
        <span className="sd-sidebar__logo">🛍️</span>
        <span className="sd-sidebar__brand-name">Khata</span>
      </div>

      <nav className="sd-sidebar__nav">
        {navLinks.map((link) => (
          <button
            key={link.path}
            className={`sd-sidebar__link ${location.pathname === link.path ? "active" : ""}`}
            onClick={() => navigate(link.path)}
          >
            <span className="sd-sidebar__icon">{link.icon}</span>
            <span className="sd-sidebar__label">{link.label}</span>
          </button>
        ))}
      </nav>

      <div className="sd-sidebar__bottom">
        <button className="sd-sidebar__link sd-sidebar__logout" onClick={handleLogout}>
          <span className="sd-sidebar__icon">🚪</span>
          <span className="sd-sidebar__label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default CustomerSidebar;
