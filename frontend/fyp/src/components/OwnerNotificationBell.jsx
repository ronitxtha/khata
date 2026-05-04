import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import socket from "../socket";

const API_BASE = "http://localhost:8000";

const OwnerNotificationBell = ({ shopId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const containerRef = useRef(null);

  // Fetch notifications from server
  const fetchNotifications = async (targetShopId) => {
    if (!targetShopId) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/api/notifications/${targetShopId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setNotifications(res.data);
        const unread = res.data.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  // Toggle bell → if opening and there are unread, mark them read (badge goes, list stays)
  const handleToggle = async () => {
    const opening = !showNotifications;
    setShowNotifications(opening);

    if (opening && unreadCount > 0) {
      try {
        const token = localStorage.getItem("accessToken");
        await axios.put(`${API_BASE}/api/notifications/mark-all-read/${shopId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (err) {
        console.error("Failed to mark notifications as read", err);
      }
    }
  };

  // "Mark all read" button — clears the badge, keeps the list
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`${API_BASE}/api/notifications/mark-all-read/${shopId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  // "Clear all" button — actually deletes/removes all notifications
  const handleClearAll = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_BASE}/api/notifications/clear-all/${shopId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to clear notifications", err);
      // Fallback: clear locally even if API not yet wired
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (shopId) fetchNotifications(shopId);
  }, [shopId]);

  useEffect(() => {
    const handleLowStock = () => {
      if (shopId) fetchNotifications(shopId);
    };
    const handleNewOrder = (data) => {
      if (data.shopId === shopId) fetchNotifications(shopId);
    };

    socket.on("lowStockAlert", handleLowStock);
    socket.on("newOrder", handleNewOrder);

    return () => {
      socket.off("lowStockAlert", handleLowStock);
      socket.off("newOrder", handleNewOrder);
    };
  }, [shopId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  if (!shopId) return null;

  return (
    <div style={{ position: "relative" }} ref={containerRef}>
      <button className="od-topbar__icon-btn" onClick={handleToggle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unreadCount > 0 && <span className="od-topbar__notif-dot">{unreadCount}</span>}
      </button>

      {showNotifications && (
        <div className="od-notif-panel">
          <div className="od-notif-panel__head">
            <strong>Notifications {notifications.length > 0 && `(${notifications.length})`}</strong>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="od-notif-panel__clear">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="od-notif-panel__clear od-notif-panel__clear--danger"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="od-notif-panel__body">
            {notifications.length === 0 ? (
              <p className="od-notif-panel__empty">All caught up! 🎉</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  className={`od-notif-item od-notif-item--${n.type === "low_stock" ? "warn" : "info"}${n.read ? " od-notif-item--read" : ""}`}
                >
                  <span>{n.type === "low_stock" ? "🚨" : "📦"}</span>
                  <div style={{ flex: 1 }}>
                    <p>{n.message}</p>
                    <small>{new Date(n.createdAt).toLocaleString()}</small>
                  </div>
                  {!n.read && <span className="od-notif-item__unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerNotificationBell;
