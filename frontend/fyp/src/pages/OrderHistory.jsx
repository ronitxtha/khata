import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/orderHistory.css";

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
    // TODO: Implement shipping progress / tracking page
  };

  const handleReview = (orderId) => {
    showToast("Review feature coming soon");
    // TODO: Implement review page
  };

  const handleReorder = (orderId) => {
    showToast("Reorder feature coming soon");
    // TODO: Implement reorder
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

  if (loading) {
    return (
      <div className="order-loading-container">
        <div className="spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="order-history-wrapper">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="order-history-header">
        <div>
          <h1>📦 Order History</h1>
          <p className="order-count">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛍️</div>
          <h2>No Orders Yet</h2>
          <p>Start shopping to see your orders here</p>
          <button className="cta-button">Continue Shopping</button>
        </div>
      ) : (
        <>
          <div className="filter-section">
            <span className="filter-label">Filter by status:</span>
            {["all", "pending", "processing", "delivered", "cancelled"].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({f === "all" ? orders.length : orders.filter(o => o.status?.toLowerCase() === f).length})
              </button>
            ))}
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
                          {order.items?.reduce((sum, item) => sum + item.quantity, 0)} item{order.items?.reduce((sum, item) => sum + item.quantity, 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Total:</span>
                        <span className="summary-value total-amount">NPR {order.totalAmount}</span>
                      </div>
                    </div>

                    <button
                      className="expand-btn"
                      onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                    >
                      {expandedOrder === order._id ? "▼ Hide Details" : "▶ View Details"}
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
                              
                              {item.description && (
                                <p className="item-description">{item.description}</p>
                              )}
                              
                              <div className="item-specs">
                                <div className="spec-group">
                                  <span className="spec-label">Quantity Ordered:</span>
                                  <span className="spec-value">{item.quantity} unit{item.quantity > 1 ? 's' : ''}</span>
                                </div>
                                <div className="spec-group">
                                  <span className="spec-label">Unit Price:</span>
                                  <span className="spec-value">NPR {item.price}</span>
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
                          <span>Subtotal:</span>
                          <span>NPR {order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
                        </div>
                        <div className="summary-row total-row">
                          <span>Total Amount:</span>
                          <span>NPR {order.totalAmount}</span>
                        </div>
                      </div>

                      <div className="order-actions">
                        {/* Actions based on status */}
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
                            ⚠ No Actions
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
    </div>
  );
};

export default OrderHistory;
