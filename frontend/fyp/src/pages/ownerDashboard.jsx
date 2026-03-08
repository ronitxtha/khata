import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/ownerDashboard.css";
import Sidebar from "../components/Sidebar";
import socket from "../socket";

const OwnerDashboard = () => {
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const [owner, setOwner] = useState({});
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("owner_notifications");
    return saved ? JSON.parse(saved) : [];
  });
  const [showNotifications, setShowNotifications] = useState(false);

  const API_BASE = "http://localhost:8000";

  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const resOwner = await axios.get(`${API_BASE}/api/owner/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOwner(resOwner.data.owner);
        fetchNotifications(resOwner.data.owner.shopId);
      } catch (err) {
        console.error(err);
        showToast(err.response?.data?.message || "Error loading owner data");
      }
    };
    fetchOwnerData();

    socket.off("lowStockAlert");
    socket.off("newOrder");

    socket.on("lowStockAlert", (data) => {
      const newNotification = {
        id: data.productId + "_" + Date.now(),
        message: data.message,
        type: "low_stock",
        read: false,
        createdAt: new Date()
      };
      setNotifications(prev => {
        const updated = [newNotification, ...prev];
        localStorage.setItem("owner_notifications", JSON.stringify(updated));
        return updated;
      });
      showToast(data.message, "error");
    });

    socket.on("newOrder", (data) => {
      if (data.shopId === owner.shopId) {
        const newNotification = {
          id: data.orderId + "_" + Date.now(),
          message: data.message,
          type: "new_order",
          read: false,
          createdAt: new Date()
        };
        setNotifications(prev => {
          const updated = [newNotification, ...prev];
          localStorage.setItem("owner_notifications", JSON.stringify(updated));
          return updated;
        });
        showToast(data.message, "success");
      }
    });

    return () => {
      socket.off("lowStockAlert");
      socket.off("newOrder");
    };
  }, [owner.shopId]);

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast({ ...toast, visible: false });
    }, duration);
  };

  const fetchNotifications = async (shopId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/api/notifications/${shopId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clearedIds = JSON.parse(localStorage.getItem("owner_cleared_notifications") || "[]");
      const backendNotifications = res.data
        .filter(n => !n.isRead && !clearedIds.includes(n._id))
        .map(n => ({
          id: n._id,
          message: n.message,
          read: n.isRead,
          createdAt: n.createdAt
        }));
      setNotifications(backendNotifications);
      localStorage.setItem("owner_notifications", JSON.stringify(backendNotifications));
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  return (
    <div className="owner-layout">
      <Sidebar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <header>
            <h1>Welcome, {owner?.username || "Owner"}</h1>
            <p className="subtitle">Owner Dashboard</p>
          </header>

          <div className="notification-container">
            <button 
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔
              {notifications.some(n => !n.read) && <span className="notification-badge"></span>}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  <button
                    onClick={() => {
                      const clearedIds = JSON.parse(localStorage.getItem("owner_cleared_notifications") || "[]");
                      const newClearedIds = [...clearedIds, ...notifications.map(n => n.id)];
                      localStorage.setItem("owner_cleared_notifications", JSON.stringify(newClearedIds));
                      setNotifications([]);
                      localStorage.setItem("owner_notifications", JSON.stringify([]));
                      showToast("Notifications cleared");
                    }}
                    className="clear-all-btn"
                  >
                    Clear All
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    <span className="no-notif-icon">📭</span>
                    <p>No new notifications</p>
                  </div>
                ) : (
                  <div className="notification-list">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notification-item ${n.read ? "read" : "unread"}`}
                        onClick={() => {
                          const updated = notifications.map(notif => 
                            notif.id === n.id ? { ...notif, read: true } : notif
                          );
                          setNotifications(updated);
                          localStorage.setItem("owner_notifications", JSON.stringify(updated));
                        }}
                      >
                        <div className="notification-icon">
                          {n.type === "new_order" ? "📦" : "⚠️"}
                        </div>
                        <div className="notification-content">
                          <p className="notification-message">{n.message}</p>
                          <span className="notification-time">
                            {n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {toast.visible && (
          <div className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
