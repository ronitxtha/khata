import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/staffDashboard.css";
import "../styles/ownerDashboard.css";
import "../styles/OwnerProfile.css"; // Reuse some refined styles if needed
import socket from "../socket";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import OwnerSidebar from "../components/OwnerSidebar";

const API_BASE = "http://localhost:8000";

const OwnerDashboard = () => {
  const navigate = useNavigate();

  // ── State ──
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [owner, setOwner] = useState({});
  const [salesData, setSalesData] = useState([]);
  const [salesTimeframe, setSalesTimeframe] = useState("today");
  const [yearlyOrders, setYearlyOrders] = useState([]);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("owner_notifications");
    return saved ? JSON.parse(saved) : [];
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrdersCount: 0,
    totalStaffCount: 0,
    onlineStaffCount: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  });

  const totalRevenue = salesData.reduce((acc, curr) => acc + (curr.sales || 0), 0);
  const totalProfit = salesData.reduce((acc, curr) => acc + (curr.profit || 0), 0);

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  };

  const fetchDashboardMetrics = async (token, timeframe) => {
    try {
      const [salesRes, ordersRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/owner/sales-report?timeframe=${timeframe}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/api/owner/yearly-orders`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/api/owner/statistics`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSalesData(salesRes.data.data || []);
      setYearlyOrders(ordersRes.data.orders || []);
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const resOwner = await axios.get(`${API_BASE}/api/owner/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOwner(resOwner.data.owner);
        fetchDashboardMetrics(token, "today");
      } catch (err) { console.error(err); }
    };
    fetchOwnerData();

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

    return () => {
      socket.off("lowStockAlert");
      socket.off("newOrder");
    };
  }, [owner.shopId]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && owner.shopId) fetchDashboardMetrics(token, salesTimeframe);
  }, [salesTimeframe, owner.shopId]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="sd-layout od-modern-layout">
      {/* Shared Owner Sidebar */}
      <OwnerSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        owner={owner} 
        handleLogout={handleLogout} 
      />

      {/* ========== MAIN ========== */}
      <div className={`sd-main od-main-content ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        
        {/* Global Navbar */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)} onMouseEnter={() => { if (window.sidebarTimer) clearTimeout(window.sidebarTimer); setSidebarOpen(true); }} onMouseLeave={() => { window.sidebarTimer = setTimeout(() => setSidebarOpen(false), 300); }}>☰</button>
            <div className="sd-navbar__title">
              <h1>Business Dashboard</h1>
              <span className="sd-navbar__subtitle">Enterprise Analytics and Growth Overview</span>
            </div>
          </div>
          
          <div className="sd-navbar__right">
            <button className="od-nav-icon-btn" style={{ marginRight: '16px' }}>🔔</button>
            <div className="sd-avatar">
              <span>{(owner?.username || "O")[0].toUpperCase()}</span>
            </div>
            <div className="sd-navbar__staff-info">
              <span className="sd-navbar__name">{owner?.username || "Owner"}</span>
              <span className="sd-navbar__role">Owner</span>
            </div>
          </div>
        </header>

        <main className="sd-content">
          
          {/* Header Greeting */}
          <div className="si-header-section" style={{ marginBottom: '32px' }}>
            <div className="si-header-info">
              <h2>Welcome, {owner.username?.split(' ')[0] || "Owner"}</h2>
              
            </div>
            <div className="si-header-actions">
               <button className="si-btn-primary si-btn-primary--dark" onClick={() => navigate("/products")}>Manage Inventory</button>
            </div>
          </div>

          {/* Top Level Cards */}
          <div className="si-ledger-cards">
            <div className="si-ledger-card">
              <span className="si-ledger-card__label">TOTAL REVENUE (NPR)</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num">Rs. {totalRevenue.toLocaleString()}</span>
                <span className="si-ledger-tag si-ledger-tag--success" style={{ fontWeight: 800 }}>+12.4%</span>
              </div>
            </div>
            <div className="si-ledger-card">
              <span className="si-ledger-card__label">ESTIMATED PROFIT</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num">Rs. {totalProfit.toLocaleString()}</span>
                <span className="si-ledger-tag" style={{ background: '#f1f5f9', fontWeight: 800 }}>NPR</span>
              </div>
            </div>
            <div className="si-ledger-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <span className="si-ledger-card__label">PENDING ORDERS</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num" style={{ color: '#d97706' }}>{stats.pendingOrdersCount}</span>
                <span className="si-ledger-tag si-ledger-tag--warning" style={{ fontWeight: 800 }}>ATTENTION</span>
              </div>
            </div>
            <div className="si-ledger-card" style={{ borderLeft: '4px solid #6366f1' }}>
              <span className="si-ledger-card__label">STAFF ONLINE</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num">{stats.onlineStaffCount}/{stats.totalStaffCount}</span>
                <span className="si-ledger-tag" style={{ background: '#eef2ff', color: '#4338ca', fontWeight: 800 }}>ACTIVE</span>
              </div>
            </div>
            
            <div className="si-ledger-card" style={{ borderLeft: '4px solid #10b981' }}>
              <span className="si-ledger-card__label">TOTAL PRODUCTS</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num">{stats.totalProducts?.toLocaleString() || "0"}</span>
                <span className="si-ledger-tag si-ledger-tag--success" style={{ fontWeight: 800 }}>CATALOGUE</span>
              </div>
            </div>

            <div className="si-ledger-card" style={{ borderLeft: '4px solid #0f172a' }}>
              <span className="si-ledger-card__label">OUT OF STOCK</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num" style={{ color: '#ef4444' }}>{stats.outOfStockProducts || "0"}</span>
                <span className="si-ledger-tag" style={{ background: '#fee2e2', color: '#ef4444', fontWeight: 800 }}>CRITICAL</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px', marginBottom: '20px' }}>
             <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Performance Analytics</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Real-time revenue and profit trends across your business</p>
             </div>
             <div style={{ display: 'flex', background: '#fff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                {["today", "week", "month"].map(time => (
                  <button 
                    key={time} 
                    style={{ 
                      padding: '8px 20px', 
                      fontSize: '12px', 
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      color: salesTimeframe === time ? '#0f172a' : '#94a3b8', 
                      background: salesTimeframe === time ? '#f1f5f9' : 'transparent', 
                      borderRadius: '8px',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setSalesTimeframe(time)}
                  >
                    {time[0].toUpperCase() + time.slice(1)}
                  </button>
                ))}
             </div>
          </div>

          <div className="si-profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            
            {/* Sales Chart Panel */}
            <div className="si-ledger-table-wrap">
              <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                 <h3 style={{ fontSize: '15px', fontWeight: 800 }}>Revenue Trends</h3>
              </div>
              <div style={{ height: '350px', padding: '24px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                       <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                       <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }} />
                       <Bar dataKey="sales" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
            </div>

            {/* Profit & Loss Chart Panel */}
            <div className="si-ledger-table-wrap">
              <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                 <h3 style={{ fontSize: '15px', fontWeight: 800 }}>Profit & Loss Ledger</h3>
              </div>
              <div style={{ height: '350px', padding: '24px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                       <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                       <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }} />
                       <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Recent Orders Table - Full Width Below */}
          <div className="si-ledger-table-wrap" style={{ display: 'flex', flexDirection: 'column', marginTop: '32px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontSize: '15px', fontWeight: 800 }}>🧾 Recent Activity</h3>
               <button className="op-edit-link" onClick={() => navigate("/order-management")}>View Full Ledger</button>
            </div>
            <table className="si-ledger-table">
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>CUSTOMER</th>
                  <th>TOTAL</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {(yearlyOrders || []).slice(0, 8).map(order => (
                  <tr key={order._id}>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>#{order._id.slice(-6).toUpperCase()}</td>
                    <td style={{ fontWeight: 600 }}>{order.user?.username || "Guest"}</td>
                    <td style={{ fontWeight: 800 }}>Rs. {order.totalAmount?.toLocaleString()}</td>
                    <td>
                      <span className={`si-ledger-tag si-ledger-tag--${order.status.toLowerCase() === 'delivered' ? 'success' : order.status.toLowerCase() === 'pending' ? 'warning' : 'processing'}`} style={{ fontWeight: 800, fontSize: '10px' }}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
        </main>
      </div>

      {/* TOAST */}
      {toast.visible && <div className={`sd-toast sd-toast--${toast.type}`}>{toast.message}</div>}
    </div>
  );
};

export default OwnerDashboard;
