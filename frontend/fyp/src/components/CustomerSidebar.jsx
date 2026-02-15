import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./sidebar.css";

const CustomerSidebar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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

      localStorage.removeItem("accessToken");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      // Force logout even if API call fails
      localStorage.removeItem("accessToken");
      navigate("/login");
    }
  };

  return (
    <>
      {/* Hamburger Icon */}
      <div
        className="sidebar-toggle"
        onMouseEnter={() => setOpen(true)}
      >
        ☰
      </div>

      {/* Sidebar */}
      <div
        className={`sidebar ${open ? "open" : ""}`}
        onMouseLeave={() => setOpen(false)}
      >
        <h3 className="menu">Menu</h3>

        <Link to="/customer-dashboard">Browse Stores</Link>
        <Link to="/customer-orders">My Orders</Link>
        <Link to="/customer-cart">Shopping Cart</Link>
        <Link to="/customer-profile">My Profile</Link>
        
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </>
  );
};

export default CustomerSidebar;
