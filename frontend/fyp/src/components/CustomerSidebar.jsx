import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Store, Package, ShoppingCart, User, LogOut, ShoppingBag } from "lucide-react";

// Using the shared customerLayout.css for sidebar styles
// We assume parent pages will import customerLayout.css

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

  // Mock cart items count logic for demonstration (in a real app, take from context)
  const cartItemCount = 3;

  const navLinks = [
    { path: "/customer-dashboard", label: "Browse Stores", icon: <Store size={20} /> },
    { path: "/order-history", label: "My Orders", icon: <Package size={20} /> },
    { path: "/cart", label: "Shopping Cart", icon: <ShoppingCart size={20} />, badge: cartItemCount },
    { path: "/customer-profile", label: "My Profile", icon: <User size={20} /> },
  ];

  return (
    <aside
      className={`cd-sidebar ${open ? "cd-sidebar--open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="cd-sidebar__brand">
        <span className="cd-sidebar__logo"><ShoppingBag size={24} color="#4f46e5" /></span>
        <span className="cd-sidebar__brand-name">Khata</span>
      </div>

      <nav className="cd-sidebar__nav">
        {navLinks.map((link) => (
          <button
            key={link.path}
            className={`cd-sidebar__link ${location.pathname === link.path ? "active" : ""}`}
            onClick={() => navigate(link.path)}
          >
            <span className="cd-sidebar__icon">{link.icon}</span>
            <span className="cd-sidebar__label">{link.label}</span>
            {link.badge && (
              <span className="cd-sidebar__badge">{link.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="cd-sidebar__bottom">
        <button className="cd-sidebar__link cd-sidebar__logout" onClick={handleLogout}>
          <span className="cd-sidebar__icon"><LogOut size={20} /></span>
          <span className="cd-sidebar__label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default CustomerSidebar;
