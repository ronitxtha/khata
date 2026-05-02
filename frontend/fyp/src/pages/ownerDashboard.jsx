import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import { trackProductView } from "../utils/interactionTracking";
import socket from "../socket";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Area, AreaChart
} from "recharts";
import "../styles/ownerDashboard.css";

const API_BASE = "http://localhost:8000";

/* ── tiny helpers ─────────────────────────────────────────── */
const NavIcon = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV_LINKS = [
  { label: "Dashboard",           path: "/owner-dashboard",       d: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10" },
  { label: "Orders",              path: "/order-management",      d: "M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M8 12h8",           badge: null },
  { label: "Products",            path: "/products",              d: "M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
  { label: "Staff",               path: "/add-staff",             d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { label: "Suppliers",           path: "/supplier-management",   d: "M3 3h18v4H3zM3 11h18v4H3zM3 19h18v4H3z" },
  { label: "Attendance",          path: "/attendance",            d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { label: "Messages",            path: "/owner-messages",        d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
  { label: "Reviews",             path: "/owner-reviews",         d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  { label: "Profile",             path: "/owner-profile",         d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
];

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* ── component ────────────────────────────────────────────── */
const OwnerDashboard = () => {
  const navigate = useNavigate();
  const today = new Date();

  const [owner, setOwner]                     = useState({});
  const [salesData, setSalesData]             = useState([]);
  const [salesTimeframe, setSalesTimeframe]   = useState("week");
  const [yearlyOrders, setYearlyOrders]       = useState([]);
  const [notifications, setNotifications]     = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast]                     = useState({ message: "", type: "success", visible: false });
  const [stats, setStats] = useState({
    totalProducts: 0, totalOrders: 0, pendingOrdersCount: 0,
    totalStaffCount: 0, onlineStaffCount: 0,
    lowStockProducts: 0, outOfStockProducts: 0
  });

  const totalRevenue = salesData.reduce((a, c) => a + (c.sales  || 0), 0);
  const totalProfit  = salesData.reduce((a, c) => a + (c.profit || 0), 0);

  const showToast = (message, type = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const fetchDashboardMetrics = async (token, timeframe) => {
    try {
      const [salesRes, ordersRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/owner/sales-report?timeframe=${timeframe}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/api/owner/yearly-orders`,                        { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/api/owner/statistics`,                            { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setSalesData(salesRes.data.data || []);
      setYearlyOrders(ordersRes.data.orders || []);
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchNotifications = async (shopId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/api/notifications/${shopId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) setNotifications(res.data);
    } catch (err) { console.error(err); }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`${API_BASE}/api/notifications/mark-all-read/${owner.shopId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      setShowNotifications(false);
      showToast("Notifications cleared");
    } catch (err) { showToast("Failed to clear notifications", "error"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get(`${API_BASE}/api/owner/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOwner(res.data.owner);
        fetchDashboardMetrics(token, salesTimeframe);
        if (res.data.owner.shopId) fetchNotifications(res.data.owner.shopId);
      } catch (err) { console.error(err); }
    };
    init();

    socket.on("lowStockAlert", (data) => {
      showToast(data.message, "error");
      fetchDashboardMetrics(localStorage.getItem("accessToken"), salesTimeframe);
    });
    socket.on("newOrder", (data) => {
      if (data.shopId === owner.shopId) {
        showToast(data.message, "success");
        fetchDashboardMetrics(localStorage.getItem("accessToken"), salesTimeframe);
      }
    });
    return () => { socket.off("lowStockAlert"); socket.off("newOrder"); };
  }, [owner.shopId]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && owner.shopId) fetchDashboardMetrics(token, salesTimeframe);
  }, [salesTimeframe, owner.shopId]);

  /* day-of-week activity (derived from yearlyOrders) */
  const dayActivity = DAYS.map((d, i) => ({
    day: d,
    count: yearlyOrders.filter(o => new Date(o.createdAt).getDay() === i).length
  }));
  const maxDay = Math.max(...dayActivity.map(d => d.count), 1);
  const currentDayIndex = today.getDay();

  const location = window.location;

  return (
    <div className="od-shell">

      {/* ══════════════════════ SIDEBAR ══════════════════════ */}
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
              {link.badge && <span className="od-sidebar__badge">{link.badge}</span>}
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
              <div className="od-sidebar__user-role">Owner · Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ══════════════════════ MAIN ══════════════════════════ */}
      <div className="od-main">

        {/* ── Top bar ── */}
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">Dashboard</h1>
            <div className="od-topbar__date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>

          <div className="od-topbar__right">
            {/* Timeframe filter */}
            <div className="od-timeframe-pills">
              {["today","week","month"].map(t => (
                <button
                  key={t}
                  className={`od-pill ${salesTimeframe === t ? "od-pill--active" : ""}`}
                  onClick={() => setSalesTimeframe(t)}
                >
                  {t === "today" ? "Today" : t === "week" ? "Last 7 days" : "Last 30 days"}
                </button>
              ))}
            </div>

            {/* Notification bell */}
            <div style={{ position: "relative" }}>
              <button className="od-topbar__icon-btn" onClick={() => setShowNotifications(v => !v)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                {notifications.length > 0 && <span className="od-topbar__notif-dot">{notifications.length}</span>}
              </button>
              {showNotifications && (
                <div className="od-notif-panel">
                  <div className="od-notif-panel__head">
                    <strong>Notifications ({notifications.length})</strong>
                    {notifications.length > 0 && (
                      <button onClick={handleMarkAllRead} className="od-notif-panel__clear">Mark all read</button>
                    )}
                  </div>
                  <div className="od-notif-panel__body">
                    {notifications.length === 0
                      ? <p className="od-notif-panel__empty">All caught up! 🎉</p>
                      : notifications.map(n => (
                          <div key={n._id} className={`od-notif-item od-notif-item--${n.type === "low_stock" ? "warn" : "info"}`}>
                            <span>{n.type === "low_stock" ? "🚨" : "📦"}</span>
                            <div>
                              <p>{n.message}</p>
                              <small>{new Date(n.createdAt).toLocaleString()}</small>
                            </div>
                          </div>
                        ))
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="od-topbar__profile" onClick={() => navigate("/owner-profile")}>
              <div className="od-topbar__avatar">
                {owner?.profileImage
                  ? <img src={imgUrl(owner.profileImage)} alt="avatar" />
                  : <span>{(owner?.username || "O")[0].toUpperCase()}</span>}
              </div>
            </div>

            {/* Logout */}
            <button className="od-topbar__logout" onClick={handleLogout} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="od-content">

          {/* ── Stat cards ── */}
          <div className="od-stat-grid">
            {[
              { label: "Total Revenue",    value: `Rs. ${totalRevenue.toLocaleString()}`,                     color: "#6366f1", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
              { label: "Estimated Profit", value: `Rs. ${totalProfit.toLocaleString()}`,                      color: "#10b981", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
              { label: "Total Orders",     value: stats.totalOrders?.toLocaleString() || "0",                 color: "#f59e0b", icon: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" },
              { label: "Pending Orders",   value: stats.pendingOrdersCount,                                   color: "#ef4444", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Total Products",   value: stats.totalProducts?.toLocaleString() || "0",               color: "#8b5cf6", icon: "M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
              { label: "Out of Stock",     value: stats.outOfStockProducts || "0",                            color: "#f43f5e", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" },
              { label: "Staff Online",     value: `${stats.onlineStaffCount}/${stats.totalStaffCount}`,       color: "#06b6d4", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" },
              { label: "Low Stock Items",  value: stats.lowStockProducts || "0",                              color: "#f97316", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            ].map(card => (
              <div className="od-stat-card" key={card.label}>
                <div className="od-stat-card__icon" style={{ background: card.color + "18", color: card.color }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={card.icon} />
                  </svg>
                </div>
                <div>
                  <div className="od-stat-card__label">{card.label}</div>
                  <div className="od-stat-card__value">{card.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Charts row ── */}
          <div className="od-charts-row">

            {/* Left: Sales area chart */}
            <div className="od-panel od-panel--large">
              <div className="od-panel__head">
                <div>
                  <div className="od-panel__title">Total Revenue</div>
                  <div className="od-panel__sub">Rs. {totalRevenue.toLocaleString()} · {salesTimeframe}</div>
                </div>
              </div>
              <div className="od-chart-area">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", fontSize: 13 }} />
                    <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2.5} fill="url(#salesGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Customer breakdown row */}
              <div className="od-breakdown-row">
                <div className="od-breakdown-item od-breakdown-item--blue">
                  <div className="od-breakdown-item__num">{stats.totalOrders || 0}</div>
                  <div className="od-breakdown-item__label">Total Orders</div>
                </div>
                <div className="od-breakdown-item od-breakdown-item--green">
                  <div className="od-breakdown-item__num">{stats.pendingOrdersCount || 0}</div>
                  <div className="od-breakdown-item__label">Pending</div>
                </div>
                <div className="od-breakdown-item od-breakdown-item--orange">
                  <div className="od-breakdown-item__num">{stats.totalProducts || 0}</div>
                  <div className="od-breakdown-item__label">Products</div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="od-right-col">

              {/* Day activity */}
              <div className="od-panel">
                <div className="od-panel__head">
                  <div className="od-panel__title">Most Active Day</div>
                </div>
                <div className="od-day-bars">
                  {dayActivity.map((d, i) => (
                    <div key={d.day} className="od-day-bar-col">
                      <div
                        className={`od-day-bar ${i === currentDayIndex ? "od-day-bar--active" : ""}`}
                        style={{ height: `${Math.round((d.count / maxDay) * 80) + 10}%` }}
                      />
                      <span className={`od-day-label ${i === currentDayIndex ? "od-day-label--active" : ""}`}>{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profit chart */}
              <div className="od-panel">
                <div className="od-panel__head">
                  <div className="od-panel__title">Profit Trend</div>
                  <div className="od-panel__sub">Rs. {totalProfit.toLocaleString()}</div>
                </div>
                <div className="od-chart-area" style={{ height: 120 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontSize: 12 }} />
                      <Bar dataKey="profit" fill="#10b981" radius={[4,4,0,0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>

          {/* ── Recent Orders Table ── */}
          <div className="od-panel od-panel--table" style={{ marginTop: "1.5rem" }}>
            <div className="od-panel__head">
              <div>
                <div className="od-panel__title">Best Selling / Recent Orders</div>
                <div className="od-panel__sub">Latest {Math.min(yearlyOrders.length, 5)} transactions</div>
              </div>
              <button className="od-view-all-btn" onClick={() => navigate("/order-management")}>
                View All Orders →
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="od-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(yearlyOrders || []).slice(0, 5).map(order => {
                    const st = order.status?.toLowerCase();
                    return (
                      <tr key={order._id}>
                        <td className="od-table__id">#{order._id.slice(-6).toUpperCase()}</td>
                        <td className="od-table__customer">{order.user?.username || "Guest"}</td>
                        <td className="od-table__amount">Rs. {order.totalAmount?.toLocaleString()}</td>
                        <td>
                          <span className={`od-badge od-badge--${st === "delivered" ? "green" : st === "pending" ? "amber" : "blue"}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="od-table__date">{new Date(order.createdAt).toLocaleDateString("en-US", { month:"short", day:"numeric" })}</td>
                      </tr>
                    );
                  })}
                  {yearlyOrders.length === 0 && (
                    <tr><td colSpan={5} className="od-table__empty">No orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* Toast */}
      {toast.visible && (
        <div className={`od-toast od-toast--${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default OwnerDashboard;
