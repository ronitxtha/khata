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

const CustomerSidebar = ({ customer }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const NAV_LINKS = [
    { label: "Marketplace",       path: "/customer-dashboard",    d: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10" },
    { label: "My Orders",         path: "/orders",                d: "M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M8 12h8" },
    { label: "Messages",          path: "/customer-messages",     d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
    { label: "Shopping Cart",     path: "/cart",                  d: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" },
    { label: "My Profile",        path: "/customer-profile",      d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
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
        {NAV_LINKS.map(link => (
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
        <div className="od-sidebar__user" onClick={() => navigate("/customer-profile")}>
          <div className="od-sidebar__avatar">
            {customer?.profileImage
              ? <img src={imgUrl(customer.profileImage)} alt="avatar" />
              : <span>{(customer?.username || "C")[0].toUpperCase()}</span>}
          </div>
          <div>
            <div className="od-sidebar__user-name">{customer?.username || "Customer"}</div>
            <div className="od-sidebar__user-role" style={{textTransform: 'capitalize'}}>{customer?.role || "Customer"}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CustomerSidebar;