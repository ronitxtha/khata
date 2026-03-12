import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/staffDashboard.css";
import "../styles/ownerDashboard.css";
import socket from "../socket";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API_BASE = "http://localhost:8000";

const OwnerDashboard = () => {
  const navigate = useNavigate();

  // ── State ──
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [owner, setOwner] = useState({});
  const [salesData, setSalesData] = useState([]);
  const [salesTimeframe, setSalesTimeframe] = useState("today"); // today, week, month
  const [yearlyOrders, setYearlyOrders] = useState([]);

  // Notifications
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("owner_notifications");
    return saved ? JSON.parse(saved) : [];
  });
  const [showNotifications, setShowNotifications] = useState(false);

  // ── Functions ──
  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  };

  const fetchDashboardMetrics = async (token, timeframe) => {
    try {
      const [salesRes, ordersRes] = await Promise.all([
        axios.get(`${API_BASE}/api/owner/sales-report?timeframe=${timeframe}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/api/owner/yearly-orders`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSalesData(salesRes.data.data || []);
      setYearlyOrders(ordersRes.data.orders || []);
    } catch (err) {
      console.error("Dashboard metrics failed", err);
    }
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

  // ── Effects ──
  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const resOwner = await axios.get(`${API_BASE}/api/owner/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOwner(resOwner.data.owner);
        fetchNotifications(resOwner.data.owner.shopId);
        fetchDashboardMetrics(token, "today");
      } catch (err) {
        console.error(err);
        showToast("Error loading owner data", "error");
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

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && owner.shopId) {
      fetchDashboardMetrics(token, salesTimeframe);
    }
  }, [salesTimeframe, owner.shopId]);

  // ── Navigation & Actions ──
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navLinks = [
    { label: "Dashboard", icon: "🏠", path: "/owner-dashboard" },
    { label: "Product Management", icon: "📦", path: "/products" },
    { label: "Orders", icon: "🛒", path: "/order-management" },
    { label: "Staff Management", icon: "👥", path: "/add-staff" },
    { label: "Supplier Management", icon: "🏭", path: "/supplier-management" },
    { label: "Attendance", icon: "📅", path: "/attendance" },
    { label: "Profile", icon: "👤", path: "/owner-profile" },
  ];

  return (
    <div className="sd-layout">
      {/* ========== SIDEBAR ========== */}
      <aside
        className={`sd-sidebar ${sidebarOpen ? "sd-sidebar--open" : ""}`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <div className="sd-sidebar__brand">
          <span className="sd-sidebar__logo">🛍️</span>
          <span className="sd-sidebar__brand-name">Khata</span>
        </div>
        <nav className="sd-sidebar__nav">
          {navLinks.map((link) => (
            <button
              key={link.path}
              className={`sd-sidebar__link ${window.location.pathname === link.path ? "active" : ""}`}
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

      {/* ========== MAIN CONTENT ========== */}
      <div className={`sd-main ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        {/* ---- NAVBAR ---- */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div className="sd-navbar__title">
              <h1>Welcome, {owner?.username || "Owner"}</h1>
              <span className="sd-navbar__subtitle">Owner Dashboard</span>
            </div>
          </div>
          
          <div className="sd-navbar__right">
            {/* Notifications */}
            <div className="od-notif-wrapper">
              <button 
                className="sd-navbar__bell"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔
                {notifications.some(n => !n.read) && <span className="sd-navbar__badge"></span>}
              </button>

              {showNotifications && (
                <div className="od-notif-dropdown">
                  <div className="od-notif-header">
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
                      className="od-notif-clear"
                    >
                      Clear All
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="od-notif-empty">
                      <span>📭</span>
                      <p>No new notifications</p>
                    </div>
                  ) : (
                    <div className="od-notif-list">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`od-notif-item ${!n.read ? "unread" : ""}`}
                          onClick={() => {
                            const updated = notifications.map(notif => 
                              notif.id === n.id ? { ...notif, read: true } : notif
                            );
                            setNotifications(updated);
                            localStorage.setItem("owner_notifications", JSON.stringify(updated));
                          }}
                        >
                          <div className="od-notif-icon">
                            {n.type === "new_order" ? "📦" : "⚠️"}
                          </div>
                          <div className="od-notif-content">
                            <p>{n.message}</p>
                            <span>
                              {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="sd-avatar">
              <span>{owner?.username ? owner.username[0].toUpperCase() : "O"}</span>
            </div>
            <div className="sd-navbar__staff-info">
              <span className="sd-navbar__name">{owner?.username || "Owner"}</span>
              <span className="sd-navbar__role">Owner</span>
            </div>
          </div>
        </header>

        {/* ---- CONTENT ---- */}
        <main className="sd-content">
          
          {/* Sales Chart Panel */}
          <div className="sd-panel od-chart-panel">
            <div className="sd-panel__header od-chart-header">
              <h3>📈 Items Sold</h3>
              <div className="od-chart-filter">
                {["today", "week", "month"].map(time => (
                  <button
                    key={time}
                    className={`od-filter-btn ${salesTimeframe === time ? "active" : ""}`}
                    onClick={() => setSalesTimeframe(time)}
                  >
                    {time === "today" ? "Today" : time === "week" ? "This Week" : "This Month"}
                  </button>
                ))}
              </div>
            </div>

            <div className="od-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} 
                    axisLine={{ stroke: "#e2e8f0" }} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#e2e8f0" 
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}
                  />
                  <Bar 
                    dataKey="items" 
                    fill="url(#barGradient)" 
                    radius={[6, 6, 0, 0]}
                    barSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Orders Panel */}
          <div className="sd-panel od-table-panel">
            <div className="sd-panel__header">
              <h3>💳 Recent Orders (Current Year)</h3>
              <button 
                className="sd-quick-btn"
                onClick={() => navigate("/order-management")}
              >
                View full list
              </button>
            </div>

            <div className="sd-table-wrapper">
              {yearlyOrders.length === 0 ? (
                <div className="sd-empty">
                  <span>📉</span>
                  <p>No orders found for this year.</p>
                </div>
              ) : (
                <table className="sd-orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyOrders.slice(0, 10).map(order => (
                      <tr key={order._id}>
                        <td className="sd-table__id">#{order._id.slice(-6).toUpperCase()}</td>
                        <td>
                          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                        </td>
                        <td className="sd-table__strong">{order.user?.username || "Guest"}</td>
                        <td>NPR {order.totalAmount?.toLocaleString()}</td>
                        <td>
                          <span className={`sd-badge ${
                            order.status === "Pending" ? "badge-pending" :
                            order.status === "Processing" ? "badge-processing" :
                            order.status === "Delivered" ? "badge-delivered" :
                            "badge-cancelled"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ========== TOAST ========== */}
      {toast.visible && (
        <div className={`sd-toast sd-toast--${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default OwnerDashboard;
