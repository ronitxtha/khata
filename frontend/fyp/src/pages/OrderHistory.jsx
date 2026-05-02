import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import CustomerSidebar from "../components/CustomerSidebar";
import "../styles/ownerDashboard.css";

const API_BASE = "http://localhost:8000";

const STATUS_COLORS = {
  pending:    { badge: "od-badge--amber", dot: "#f59e0b" },
  processing: { badge: "od-badge--blue",  dot: "#6366f1" },
  delivered:  { badge: "od-badge--green", dot: "#10b981" },
  cancelled:  { badge: "od-badge--red",   dot: "#ef4444" },
};

const STATUS_ICONS = {
  delivered:  "✓",
  processing: "⏱",
  pending:    "⏳",
  cancelled:  "✕",
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/orders/my-orders/${user._id}`);
        setOrders(res.data);
      } catch (err) {
        console.error("FETCH ORDER ERROR:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetchOrders();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/api/orders/${orderId}/status`, { status: newStatus, role: "customer" });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      showToast(`Order ${newStatus.toLowerCase()} successfully`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    }
  };

  const handleCancel = (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) updateStatus(orderId, "Cancelled");
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${API_BASE}/api/customer/logout-click`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { console.error(err); }
    finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const filteredOrders = filter === "all" ? orders : orders.filter(o => o.status?.toLowerCase() === filter);
  const filterCounts = (f) => f === "all" ? orders.length : orders.filter(o => o.status?.toLowerCase() === f).length;

  if (loading) {
    return (
      <div className="od-shell">
        <CustomerSidebar customer={user} />
        <div className="od-main">
          <main className="od-content">
            <div style={{ padding: '80px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 24px' }} />
              <p style={{ fontWeight: 600, color: '#64748b' }}>Fetching your order records...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="od-shell">
      <CustomerSidebar customer={user} />

      <div className="od-main">
        {/* TOP NAVBAR */}
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">My Orders</h1>
            <div className="od-topbar__date">Track and manage your past purchases</div>
          </div>
          <div className="od-topbar__right">
            <div className="od-topbar__profile" onClick={() => navigate("/customer-profile")}>
              <div className="od-topbar__avatar">
                {user?.profileImage ? <img src={imgUrl(user.profileImage)} alt="avatar" /> : <span>{(user?.username || "C")[0].toUpperCase()}</span>}
              </div>
            </div>
            <button className="od-topbar__logout" onClick={handleLogout} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          </div>
        </header>

        <main className="od-content">
          {/* STAT CARDS */}
          <div className="od-stat-grid" style={{ marginBottom: '28px' }}>
            {[
              { label: "Total Orders",   val: orders.length,                                                           color: "#6366f1", icon: "M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M8 12h8" },
              { label: "Pending",        val: orders.filter(o => o.status?.toLowerCase() === "pending").length,        color: "#f59e0b", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Processing",     val: orders.filter(o => o.status?.toLowerCase() === "processing").length,     color: "#3b82f6", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
              { label: "Delivered",      val: orders.filter(o => o.status?.toLowerCase() === "delivered").length,      color: "#10b981", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
            ].map(c => (
              <div key={c.label} className="od-stat-card">
                <div className="od-stat-card__icon" style={{ background: c.color + "18", color: c.color }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon}/></svg>
                </div>
                <div>
                  <div className="od-stat-card__label">{c.label}</div>
                  <div className="od-stat-card__value">{c.val}</div>
                </div>
              </div>
            ))}
          </div>

          {orders.length === 0 ? (
            <div className="od-panel" style={{ padding: '80px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '52px', marginBottom: '16px' }}>🛍️</div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>No Orders Yet</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>Explore the marketplace to start your first order.</p>
              <button
                onClick={() => navigate('/customer-dashboard')}
                style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Browse Marketplace →
              </button>
            </div>
          ) : (
            <>
              {/* FILTER BAR */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px', flexShrink: 0 }}>Filter:</span>
                {["all", "pending", "processing", "delivered", "cancelled"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '20px',
                      background: filter === f ? '#6366f1' : '#f8fafc',
                      color: filter === f ? '#fff' : '#475569',
                      border: `1px solid ${filter === f ? '#6366f1' : '#e2e8f0'}`,
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)} ({filterCounts(f)})
                  </button>
                ))}
              </div>

              {/* ORDER LIST */}
              {filteredOrders.length === 0 ? (
                <div className="od-panel" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                  📭 No <strong>{filter}</strong> orders found
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredOrders.map((order) => {
                    const statusKey = order.status?.toLowerCase();
                    const statusStyle = STATUS_COLORS[statusKey] || STATUS_COLORS.pending;
                    const isExpanded = expandedOrder === order._id;

                    return (
                      <div key={order._id} className="od-panel" style={{ overflow: 'hidden' }}>
                        {/* Order Header */}
                        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                              #{order._id?.slice(-8).toUpperCase()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                              {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Items</div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{order.items?.reduce((s, i) => s + i.quantity, 0)}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Total</div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#6366f1' }}>NPR {order.totalAmount?.toLocaleString()}</div>
                            </div>
                            <span className={`od-badge ${statusStyle.badge}`} style={{ fontSize: '12px', padding: '5px 12px' }}>
                              {STATUS_ICONS[statusKey]} {order.status}
                            </span>
                            <button
                              onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                              style={{ background: 'none', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                            >
                              {isExpanded ? "▲ Hide" : "▼ Details"}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Order Details */}
                        {isExpanded && (
                          <div style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
                            {/* Items */}
                            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {order.items?.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#fff', borderRadius: '10px', padding: '14px', border: '1px solid #f1f5f9' }}>
                                  <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', flexShrink: 0 }}>
                                    <img src={imgUrl(item.image)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'darken' }} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{item.name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Qty: {item.quantity} × NPR {item.price?.toLocaleString()}</div>
                                  </div>
                                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#6366f1' }}>
                                    NPR {(item.price * item.quantity).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Summary + Actions */}
                            <div style={{ padding: '16px 24px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                                  Subtotal: NPR {order.items?.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                                  Final Amount: NPR {order.totalAmount?.toLocaleString()}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '10px' }}>
                                {statusKey === "pending" && (
                                  <button onClick={() => handleCancel(order._id)} style={{ padding: '8px 18px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    ✕ Cancel Order
                                  </button>
                                )}
                                {statusKey === "processing" && (
                                  <button style={{ padding: '8px 18px', background: '#ede9fe', color: '#6366f1', border: '1px solid #ddd6fe', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    📍 Track Order
                                  </button>
                                )}
                                {statusKey === "delivered" && (
                                  <>
                                    <button style={{ padding: '8px 18px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                      ⭐ Leave Review
                                    </button>
                                    <button style={{ padding: '8px 18px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                      🔄 Reorder
                                    </button>
                                  </>
                                )}
                                {statusKey === "cancelled" && (
                                  <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>⚠ No actions available</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {toast.visible && (
        <div className={`od-toast od-toast--${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default OrderHistory;

