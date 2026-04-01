import React, { useEffect, useState } from "react";
import axios from "axios";
import CustomerSidebar from "../components/CustomerSidebar";
import "../styles/customerLayout.css";
import "../styles/orderHistory.css";
import Rating from "../components/Rating";

const API_BASE = "http://localhost:8000";

// Toast component
const Toast = ({ message, type }) => (
  <div className={`toast toast-${type}`}>
    {type === "success" && "✓"} {message}
  </div>
);

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

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

    if (user) fetchOrders();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/api/orders/${orderId}/status`, {
        status: newStatus,
        role: "customer"
      });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      showToast(`Order ${newStatus.toLowerCase()} successfully`);
    } catch (err) {
      console.error("STATUS UPDATE ERROR:", err);
      showToast(err.response?.data?.message || "Failed to update status", "error");
    }
  };

  const handleCancel = (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      updateStatus(orderId, "Cancelled");
    }
  };

  const handleTrack = (orderId) => {
    showToast("Opening tracking information...");
  };

  const handleReview = (orderId) => {
    showToast("Review feature coming soon");
  };

  const handleReorder = (orderId) => {
    showToast("Reorder feature coming soon");
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "✓";
      case "processing": return "⏱";
      case "pending": return "⏳";
      case "cancelled": return "✕";
      default: return "•";
    }
  };

  const filteredOrders = filter === "all"
    ? orders
    : orders.filter(order => order.status?.toLowerCase() === filter);

  return (
    <div className="sd-layout od-modern-layout">
      <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className={`sd-main od-main-content ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        {/* TOP NAVBAR */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button 
              className="sd-navbar__hamburger" 
              onClick={() => setSidebarOpen((v) => !v)}
              onMouseEnter={() => {
                if (window.sidebarTimer) clearTimeout(window.sidebarTimer);
                setSidebarOpen(true);
              }}
              onMouseLeave={() => {
                window.sidebarTimer = setTimeout(() => setSidebarOpen(false), 300);
              }}
            >
              ☰
            </button>
            <div className="sd-navbar__title">
              <h1>Order History</h1>
              <span className="sd-navbar__subtitle">Track and manage your past purchases</span>
            </div>
          </div>
          
          <div className="sd-navbar__right">
            <button className="od-nav-icon-btn" style={{ marginRight: '16px' }}>🔔</button>
            <div className="sd-avatar">
              <span>C</span>
            </div>
            <div className="sd-navbar__staff-info">
              <span className="sd-navbar__name">Customer</span>
              <span className="sd-navbar__role">Verified Account</span>
            </div>
          </div>
        </header>

        {/* BODY: content */}
        {loading ? (
          <main className="sd-content od-content">
            <div className="order-loading-container">
              <div className="spinner"></div>
              <p>Fetching your order records...</p>
            </div>
          </main>
        ) : (
          <main className="sd-content od-content">
            <div className="si-header-section" style={{ marginBottom: '32px' }}>
              <div className="si-header-info">
                <h2>My Orders</h2>
                <p>You have {orders.length} order{orders.length !== 1 ? "s" : ""} in total.</p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="si-ledger-table-wrap" style={{ padding: '80px 40px', textAlign: 'center', marginBottom: '32px' }}>
                <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>🛍️</div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>No Orders Yet</h2>
                <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '32px' }}>Explore the marketplace to start your first order.</p>
                <button 
                  className="buy-btn" 
                  style={{ maxWidth: '240px', margin: '0 auto' }}
                  onClick={() => navigate('/customer-dashboard')}
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="si-ledger-table-wrap" style={{ padding: '24px', marginBottom: '32px' }}>
                  <div className="filter-section" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginRight: '8px', letterSpacing: '0.5px' }}>Filter by Status:</span>
                    {["all", "pending", "processing", "delivered", "cancelled"].map((f) => (
                      <button
                        key={f}
                        className={`filter-btn ${filter === f ? "active" : ""}`}
                        onClick={() => setFilter(f)}
                        style={{ 
                          padding: '8px 16px', 
                          borderRadius: '8px', 
                          background: filter === f ? '#0f172a' : '#f8fafc', 
                          color: filter === f ? '#fff' : '#475569',
                          border: '1px solid',
                          borderColor: filter === f ? '#0f172a' : '#e2e8f0',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)} ({f === "all" ? orders.length : orders.filter(o => o.status?.toLowerCase() === f).length})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="orders-container">
                  {filteredOrders.length === 0 ? (
                    <div className="no-filtered-orders">
                      <p>📭 No {filter} orders found</p>
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <div key={order._id} className={`order-card ${expandedOrder === order._id ? "expanded" : ""}`}>
                        {/* Card Header */}
                        <div className="order-card-header">
                          <div className="order-info-top">
                            <div className="order-id-section">
                              <div className="order-id">Order #{order._id?.slice(-8).toUpperCase()}</div>
                              <div className="order-date">
                                {new Date(order.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                            </div>
                            <div className={`status-badge status-${order.status?.toLowerCase()}`}>
                              <span className="status-icon">{getStatusIcon(order.status)}</span>
                              <span className="status-text">{order.status}</span>
                            </div>
                          </div>

                          <div className="order-summary">
                            <div className="summary-item">
                              <span className="summary-label">Items:</span>
                              <span className="summary-value">
                                {order.items?.reduce((sum, item) => sum + item.quantity, 0)} unit(s)
                              </span>
                            </div>
                            <div className="summary-item">
                              <span className="summary-label">Total Amount:</span>
                              <span className="summary-value total-amount">NPR {order.totalAmount}</span>
                            </div>
                          </div>

                          <button
                            className="expand-btn"
                            onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                          >
                            {expandedOrder === order._id ? "▼ Hide Details" : "▶ View Detailed Summary"}
                          </button>
                        </div>

                        {/* Expanded Content */}
                        {expandedOrder === order._id && (
                          <div className="order-content">
                            <div className="order-items">
                              {order.items?.map((item, index) => (
                                <div key={index} className="order-item-card">
                                  <div className="item-card-image">
                                    <img src={`${API_BASE}/${item.image}`} alt={item.name} />
                                  </div>
                                  
                                  <div className="item-card-content">
                                    <div className="item-header">
                                      <h3 className="item-name">{item.name}</h3>
                                      <div className="item-price-badge">NPR {item.price}</div>
                                    </div>
                                    
                                    <div className="item-specs">
                                      <div className="spec-group">
                                        <span className="spec-label">Qty Ordered:</span>
                                        <span className="spec-value">{item.quantity}</span>
                                      </div>
                                      <div className="spec-group">
                                        <span className="spec-label">Subtotal:</span>
                                        <span className="spec-value total-price">NPR {item.price * item.quantity}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="order-summary-footer">
                              <div className="summary-row">
                                <span>Order Subtotal:</span>
                                <span>NPR {order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
                              </div>
                              <div className="summary-row total-row">
                                <span>Final Amount:</span>
                                <span>NPR {order.totalAmount}</span>
                              </div>
                            </div>

                            <div className="order-actions">
                              {order.status?.toLowerCase() === "pending" && (
                                <button className="action-btn secondary" onClick={() => handleCancel(order._id)}>
                                  ✕ Cancel Order
                                </button>
                              )}
                              {order.status?.toLowerCase() === "processing" && (
                                <button className="action-btn secondary" onClick={() => handleTrack(order._id)}>
                                  📍 Track Order
                                </button>
                              )}
                              {order.status?.toLowerCase() === "delivered" && (
                                <>
                                  <button className="action-btn secondary" onClick={() => handleReview(order._id)}>
                                    ⭐ Leave Review
                                  </button>
                                  <button className="action-btn reorder" onClick={() => handleReorder(order._id)}>
                                    🔄 Reorder
                                  </button>
                                </>
                              )}
                              {order.status?.toLowerCase() === "cancelled" && (
                                <button className="action-btn disabled">
                                  ⚠ No Actions Available
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </main>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
