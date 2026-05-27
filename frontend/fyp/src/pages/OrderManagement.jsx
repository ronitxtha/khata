import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import socket from "../socket";
import "../styles/ownerDashboard.css";
import "../styles/orderManagement.css";
import OwnerSidebar from "../components/OwnerSidebar";
import StaffSidebar from "../components/StaffSidebar";
import OwnerNotificationBell from "../components/OwnerNotificationBell";

import { API_BASE } from "../config/api.js";

const STATUS_FILTERS = ["All", "Pending", "Processing", "Delivered", "Cancelled"];

/* ── Tiny inline SVG helper ──────────────────────────────── */
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

/* ── Status colour map ───────────────────────────────────── */
const STATUS_COLORS = {
  pending:    { bg: "#fef9c3", text: "#a16207" },
  processing: { bg: "#dbeafe", text: "#1d4ed8" },
  delivered:  { bg: "#dcfce7", text: "#15803d" },
  cancelled:  { bg: "#fee2e2", text: "#ef4444" },
};

const OrderManagement = () => {
  const navigate   = useNavigate();
  const location   = useLocation();

  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState("All");
  const [toast, setToast]               = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate]     = useState("");

  const user   = JSON.parse(localStorage.getItem("user") || "{}");
  const role   = user?.role || "staff";
  const shopId = user?.shopId;
  const profilePath = role === "owner" ? "/owner-profile" : "/staff-profile";

  /* ── Fetch ── */
  const fetchOrders = async () => {
    try {
      if (!shopId) return;
      const res = await axios.get(`${API_BASE}/api/orders/shop/${shopId}`);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch Orders Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopId) fetchOrders();

    socket.on("newOrder", (data) => {
      if (data.shopId === shopId) {
        fetchOrders();
        showToast("🛒 New order received!");
      }
    });

    return () => socket.off("newOrder");
  }, [shopId]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/api/orders/${orderId}/status`, { status: newStatus, role });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      showToast(`Order marked as ${newStatus}`);
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${API_BASE}/api/staff/logout-click`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (_) {}
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  const handleExport = () => {
    if (!exportStartDate || !exportEndDate) {
      showToast("Please select both start and end dates.", "error");
      return;
    }

    const start = new Date(exportStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(exportEndDate);
    end.setHours(23, 59, 59, 999);

    const filteredForExport = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= start && orderDate <= end;
    });

    if (filteredForExport.length === 0) {
      showToast("No orders found in the selected date range.", "error");
      return;
    }

    let csvContent = "Order ID,Date,Customer Name,Product Name,Quantity,Cost Price,Selling Price,Profit,Loss\n";
    let totalProfit = 0;

    filteredForExport.forEach(order => {
      const orderDate = new Date(order.createdAt).toLocaleDateString("en-US");
      const customerName = order.user?.username || "Guest";
      
      order.items.forEach(item => {
        const cp = item.costPrice || 0;
        const sp = item.price || 0;
        const qty = item.quantity || 1;
        const profit = (sp - cp) * qty;
        totalProfit += profit;

        // Escape fields to avoid CSV breakages
        const safeProductName = `"${(item.name || "").replace(/"/g, '""')}"`;
        const safeCustomerName = `"${customerName.replace(/"/g, '""')}"`;

        const profitCol = profit >= 0 ? profit : "";
        const lossCol = profit < 0 ? Math.abs(profit) : "";
        csvContent += `${order._id},${orderDate},${safeCustomerName},${safeProductName},${qty},${cp},${sp},${profitCol},${lossCol}\n`;
      });
    });

    csvContent += `\n,,,,,,,Total Profit/Loss: ${totalProfit}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Order_Export_${exportStartDate}_to_${exportEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExportModal(false);
    showToast("Export successful!");
  };

  const filteredOrders = filter === "All"
    ? orders
    : orders.filter(o => o.status?.toLowerCase() === filter.toLowerCase());

  const count = (s) => orders.filter(o => o.status?.toLowerCase() === s.toLowerCase()).length;

  return (
    <div className="od-shell">

      {/* ══════════════ SIDEBAR ══════════════ */}
      {role === "owner" ? <OwnerSidebar owner={user} /> : <StaffSidebar staff={user} />}

      {/* ══════════════ MAIN ══════════════ */}
      <div className="od-main">

        {/* ── Topbar ── */}
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">Orders</h1>
            <div className="od-topbar__date">
              <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={14} />
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>

          <div className="od-topbar__right">
            <OwnerNotificationBell shopId={shopId} />
            <div className="od-topbar__profile" onClick={() => navigate(profilePath)}>
              <div className="od-topbar__avatar">
                {user?.profileImage
                  ? <img src={imgUrl(user.profileImage)} alt="avatar" />
                  : <span>{(user?.username || "U")[0].toUpperCase()}</span>}
              </div>
            </div>
            <button className="od-topbar__logout" onClick={handleLogout} title="Logout">
              <Icon d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" size={16} />
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="od-content">

          {/* Page heading */}
          <div className="om-page-head">
            <div>
              <h2 className="om-page-head__title">Order Ledger</h2>
              <p className="om-page-head__sub">Manage and update all shop orders</p>
            </div>
            <div className="om-page-head__actions">
              <button className="om-btn-ghost" onClick={() => setShowExportModal(true)}>
                <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={15} />
                Export
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="om-stat-row">
            {[
              { label: "Total",      val: orders.length,         color: "#6366f1", icon: "M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M8 12h8" },
              { label: "Pending",    val: count("Pending"),      color: "#f59e0b", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Processing", val: count("Processing"),   color: "#3b82f6", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
              { label: "Delivered",  val: count("Delivered"),    color: "#10b981", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Cancelled",  val: count("Cancelled"),    color: "#ef4444", icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
            ].map(card => (
              <div
                key={card.label}
                className={`om-stat-card ${filter === card.label || (filter === "All" && card.label === "Total") ? "om-stat-card--active" : ""}`}
                onClick={() => setFilter(card.label === "Total" ? "All" : card.label)}
                style={{ "--card-color": card.color }}
              >
                <div className="om-stat-card__icon" style={{ background: card.color + "18", color: card.color }}>
                  <Icon d={card.icon} size={18} />
                </div>
                <div>
                  <div className="om-stat-card__label">{card.label}</div>
                  <div className="om-stat-card__value">{card.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter tabs + count */}
          <div className="om-filter-bar">
            <div className="om-tabs">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f}
                  className={`om-tab ${filter === f ? "om-tab--active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                  <span className="om-tab__count">{f === "All" ? orders.length : count(f)}</span>
                </button>
              ))}
            </div>
            <span className="om-results-label">{filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Table */}
          <div className="om-panel">

            {/* Table header */}
            <div className="om-table-head">
              <span>Order ID</span>
              <span>Customer</span>
              <span>Date</span>
              <span>Amount</span>
              <span>Status</span>
              <span></span>
            </div>

            {loading ? (
              <div className="om-empty">
                <div className="om-spinner" />
                <p>Loading orders…</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="om-empty">
                <span style={{ fontSize: 40 }}>📦</span>
                <p>No {filter !== "All" ? filter.toLowerCase() : ""} orders found</p>
              </div>
            ) : (
              filteredOrders.map(order => {
                const st    = order.status?.toLowerCase();
                const color = STATUS_COLORS[st] || { bg: "#f1f5f9", text: "#64748b" };
                const isOpen = expandedOrder === order._id;

                return (
                  <div key={order._id} className={`om-row ${isOpen ? "om-row--open" : ""}`}>

                    {/* Summary row */}
                    <div className="om-row__summary" onClick={() => setExpandedOrder(isOpen ? null : order._id)}>
                      <span className="om-row__id">#{order._id.slice(-6).toUpperCase()}</span>

                      <div className="om-row__customer">
                        <div className="om-avatar">{(order.user?.username || "G")[0].toUpperCase()}</div>
                        <div>
                          <div className="om-row__name">{order.user?.username || "Guest"}</div>
                          <div className="om-row__email">{order.user?.email || "—"}</div>
                        </div>
                      </div>

                      <span className="om-row__date">
                        {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>

                      <span className="om-row__amount">Rs. {order.totalAmount?.toLocaleString()}</span>

                      <span className="om-badge" style={{ background: color.bg, color: color.text }}>
                        {order.status}
                      </span>

                      <span className={`om-chevron ${isOpen ? "om-chevron--up" : ""}`}>
                        <Icon d="M19 9l-7 7-7-7" size={16} />
                      </span>
                    </div>

                    {/* Expanded details */}
                    {isOpen && (
                      <div className="om-row__details">
                        <div className="om-details-items">
                          <p className="om-details-label">Items Ordered</p>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="om-item">
                              <img
                                src={imgUrl(item.image)}
                                alt={item.name}
                                className="om-item__img"
                                onError={e => { e.target.src = "https://placehold.co/56x56?text=Item"; }}
                              />
                              <div className="om-item__info">
                                <span className="om-item__name">{item.name}</span>
                                <span className="om-item__sku">SKU: {item._id?.slice(-8).toUpperCase()}</span>
                              </div>
                              <div className="om-item__price">
                                <span>Rs. {item.price?.toLocaleString()}</span>
                                <span className="om-item__qty">Qty: {item.quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="om-details-side">
                          <div className="om-shipping-box">
                            <p className="om-details-label">Shipping Info</p>
                            <p className="om-shipping-text">
                              Payment: <strong>{order.paymentMethod || "COD"}</strong><br />
                              Phone: {order.user?.phone || "Not provided"}<br />
                              Location: Kathmandu, Nepal
                            </p>
                          </div>

                          <div>
                            <p className="om-details-label">Update Status</p>
                            <div className="om-action-stack">
                              {order.status === "Pending" && (
                                <button className="om-btn-primary" onClick={() => updateOrderStatus(order._id, "Processing")}>
                                  ✓ Accept Order
                                </button>
                              )}
                              {order.status === "Processing" && (
                                <button className="om-btn-primary" onClick={() => updateOrderStatus(order._id, "Delivered")}>
                                  🚚 Mark Delivered
                                </button>
                              )}
                              {(order.status === "Pending" || order.status === "Processing") && (
                                <button className="om-btn-cancel" onClick={() => updateOrderStatus(order._id, "Cancelled")}>
                                  ✕ Cancel Order
                                </button>
                              )}
                              {(order.status === "Delivered" || order.status === "Cancelled") && (
                                <div className="om-final-label" style={{ color: color.text, background: color.bg }}>
                                  Order is {order.status}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`od-toast od-toast--${toast.type}`}>{toast.message}</div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="si-modal-overlay" onClick={() => setShowExportModal(false)} style={{ zIndex: 9999 }}>
          <div className="si-modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="si-modal__header">
              <h2 style={{ fontSize: '18px' }}>Export Orders</h2>
              <button className="si-modal__close" onClick={() => setShowExportModal(false)}>✕</button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ marginBottom: '15px', color: '#64748b', fontSize: '14px' }}>
                Select a date range to download an Excel (CSV) file containing order history and profit/loss calculations.
              </p>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '13px' }}>From Date</label>
                <input 
                  type="date" 
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} 
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '13px' }}>To Date</label>
                <input 
                  type="date" 
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowExportModal(false)}
                  style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleExport}
                  style={{ padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Download Excel (CSV)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
