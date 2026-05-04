import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/ownerDashboard.css";
import { imgUrl } from "../utils/imageUrl";

const NavIcon = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const OwnerSidebar = ({ owner }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: "Dashboard",  path: "/owner-dashboard",      d: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10" },
    { label: "Orders",     path: "/order-management",     d: "M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M8 12h8" },
    { label: "Products",   path: "/products",             d: "M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
    { label: "Staff",      path: "/add-staff",            d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" },
    { label: "Suppliers",  path: "/supplier-management",  d: "M3 3h18v4H3zM3 11h18v4H3zM3 19h18v4H3z" },
    { label: "Attendance", path: "/attendance",           d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { label: "Messages",   path: "/owner-messages",       d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
    { label: "Reviews",    path: "/owner-reviews",        d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
    { label: "Profile",    path: "/owner-profile",        d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
  ];

  return (
    <aside className="od-sidebar">
      {/* Brand */}
      <div className="od-sidebar__brand">
        <div className="od-sidebar__logo">
          <span className="od-sidebar__logo-icon">K</span>
          <span className="od-sidebar__logo-text">SmartKhata</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="od-sidebar__nav">
        {navLinks.map(link => (
          <button
            key={link.path}
            className={`od-sidebar__link ${location.pathname === link.path ? "od-sidebar__link--active" : ""}`}
            onClick={() => navigate(link.path)}
          >
            <span className="od-sidebar__icon"><NavIcon d={link.d} /></span>
            <span className="od-sidebar__label">{link.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="od-sidebar__footer">
        <div className="od-sidebar__user" onClick={() => navigate("/owner-profile")}>
          <div className="od-sidebar__avatar">
            {owner?.profileImage
              ? <img src={imgUrl(owner.profileImage)} alt="avatar" />
              : <span>{(owner?.username || "O")[0].toUpperCase()}</span>}
          </div>
          <div>
            <div className="od-sidebar__user-name">{owner?.username || "Owner"}</div>
            <div className="od-sidebar__user-role" style={{ textTransform: "capitalize" }}>Owner</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default OwnerSidebar;
