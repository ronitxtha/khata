import React from "react";
import "./DisabledAccountPopup.css";

const DisabledAccountPopup = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <div className="disabled-overlay">
      <div className="disabled-card">
        <div className="disabled-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h2 className="disabled-title">Account Disabled</h2>
        <p className="disabled-message">
          Your account has been deactivated by the system administrator. You
          cannot access the dashboard at this time.
        </p>
        <div className="disabled-contact">
          <span>Please contact the admin for support:</span>
          <a href="mailto:ronitxtha09@gmail.com" className="disabled-email">
            ronitxtha09@gmail.com
          </a>
        </div>
        <button className="disabled-btn" onClick={onClose}>
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default DisabledAccountPopup;
