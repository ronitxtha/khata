import { useState } from "react";
import { Link } from "react-router-dom";
import "./sidebar.css";

const Sidebar = () => {
  const [open, setOpen] = useState(false);

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

        <Link to="/owner-dashboard">Dashboard</Link>
        <Link to="/add-staff">Staff Management</Link>
        <Link to="/products">Products</Link>
        <Link to="/attendance">Attendance</Link>
        <Link to="/order-management">Order Management</Link>
      </div>
    </>
  );
};

export default Sidebar;
