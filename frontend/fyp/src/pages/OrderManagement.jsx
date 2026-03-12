import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../socket";
import "../styles/staffDashboard.css";
import "../styles/orderManagement.css";

const API_BASE = "http://localhost:8000";

const STATUS_FILTERS = ["All", "Pending", "Processing", "Delivered", "Cancelled"];

const OrderManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || "staff";
  const shopId = user?.shopId;

  // Fetch orders
  useEffect(() => {
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

    if (shopId) fetchOrders();

    socket.on("newOrder", (data) => {
      if (data.shopId === shopId) {
        fetchOrders();
        showToast("🛒 New order received!", "success");
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
      await axios.put(`${API_BASE}/api/orders/${orderId}/status`, {
        status: newStatus,
        role,
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
      showToast(`Order marked as ${newStatus}`);
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    }
  };

  const filteredOrders =
    filter === "All"
      ? orders
      : orders.filter((o) => o.status?.toLowerCase() === filter.toLowerCase());

  // Summary counts
  const countByStatus = (s) =>
    orders.filter((o) => o.status?.toLowerCase() === s.toLowerCase()).length;

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${API_BASE}/api/staff/logout-click`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  const navLinks = [
    { label: "Dashboard", icon: "🏠", path: role === "owner" ? "/owner-dashboard" : "/staff-dashboard" },
    { label: "Product Management", icon: "📦", path: role === "owner" ? "/products" : "/staff-inventory" },
    { label: "Orders", icon: "🛒", path: "/order-management" },
    ...(role === "owner" ? [{ label: "Staff Management", icon: "👥", path: "/add-staff" }] : []),
    { label: "Attendance", icon: "📅", path: role === "owner" ? "/attendance" : "/staff-attendance" },
    { label: "Profile", icon: "👤", path: role === "owner" ? "/owner-profile" : "/staff-profile" },
  ];

  const statusClass = (status) => {
    if (status === "Pending") return "badge-pending";
    if (status === "Processing") return "badge-processing";
    if (status === "Delivered") return "badge-delivered";
    if (status === "Cancelled") return "badge-cancelled";
    return "";
  };

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

      {/* ========== MAIN ========== */}
      <div className={`sd-main ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        {/* ---- NAVBAR ---- */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div className="sd-navbar__title">
              <h1>Order Management</h1>
              <span className="sd-navbar__subtitle">Track and update shop orders</span>
            </div>
          </div>
          <div className="sd-navbar__right">
            <div className="sd-avatar">
              <span>{role === "owner" ? "O" : "S"}</span>
            </div>
            <div className="sd-navbar__staff-info">
              <span className="sd-navbar__name">{user?.username || "Staff"}</span>
              <span className="sd-navbar__role">{role === "owner" ? "Owner" : "Staff"}</span>
            </div>
          </div>
        </header>

        {/* ---- CONTENT ---- */}
        <main className="sd-content">
          {/* Banner */}
          <div className="sd-welcome om-banner">
            <div>
              <h2>🧾 Shop Orders</h2>
              <p>{orders.length} total order{orders.length !== 1 ? "s" : ""} for your shop</p>
            </div>
          </div>

          {/* Summary mini-cards */}
          <div className="si-mini-cards">
            <div className="si-mini-card si-mini-card--blue">
              <span className="si-mini-card__icon">📋</span>
              <div>
                <div className="si-mini-card__num">{orders.length}</div>
                <div className="si-mini-card__label">Total Orders</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--orange">
              <span className="si-mini-card__icon">⏳</span>
              <div>
                <div className="si-mini-card__num">{countByStatus("Pending")}</div>
                <div className="si-mini-card__label">Pending</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--purple" style={{"--accent":"#8b5cf6"}}>
              <span className="si-mini-card__icon">⚙️</span>
              <div>
                <div className="si-mini-card__num">{countByStatus("Processing")}</div>
                <div className="si-mini-card__label">Processing</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--green">
              <span className="si-mini-card__icon">✅</span>
              <div>
                <div className="si-mini-card__num">{countByStatus("Delivered")}</div>
                <div className="si-mini-card__label">Delivered</div>
              </div>
            </div>
            <div className="si-mini-card si-mini-card--red">
              <span className="si-mini-card__icon">✕</span>
              <div>
                <div className="si-mini-card__num">{countByStatus("Cancelled")}</div>
                <div className="si-mini-card__label">Cancelled</div>
              </div>
            </div>
          </div>

          {/* Filter Tab Bar */}
          <div className="sd-panel om-filter-panel">
            <div className="om-filter-bar">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f}
                  className={`om-filter-btn ${filter === f ? "om-filter-btn--active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                  <span className="om-filter-count">
                    {f === "All" ? orders.length : countByStatus(f)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table Panel */}
          <div className="sd-panel om-table-panel">
            <div className="sd-panel__header">
              <h3>
                {filter === "All" ? "All Orders" : `${filter} Orders`}
                <span className="om-result-count"> ({filteredOrders.length})</span>
              </h3>
            </div>

            {loading ? (
              <div className="om-loading">
                <div className="om-spinner"></div>
                <p>Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="sd-empty">
                <span>📋</span>
                <p>No {filter !== "All" ? filter.toLowerCase() : ""} orders found.</p>
              </div>
            ) : (
              <div className="om-orders-list">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="om-order-card">
                    {/* Order card header */}
                    <div
                      className="om-order-card__header"
                      onClick={() =>
                        setExpandedOrder(expandedOrder === order._id ? null : order._id)
                      }
                    >
                      <div className="om-order-card__left">
                        <div className="om-order-id">
                          #{order._id.slice(-8).toUpperCase()}
                        </div>
                        <div className="om-order-meta">
                          <span className="om-order-customer">
                            👤 {order.user?.username || "Guest"}
                            {order.user?.email ? ` · ${order.user.email}` : ""}
                          </span>
                          <span className="om-order-date">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="om-order-card__right">
                        <span className="om-order-total">
                          NPR {order.totalAmount?.toLocaleString()}
                        </span>
                        <span className={`sd-badge ${statusClass(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="om-expand-icon">
                          {expandedOrder === order._id ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>

                    {/* Expanded items + actions */}
                    {expandedOrder === order._id && (
                      <div className="om-order-card__body">
                        {/* Items */}
                        <div className="om-items-grid">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="om-item">
                              <img
                                src={`${API_BASE}/${item.image}`}
                                alt={item.name}
                                className="om-item__img"
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                              <div className="om-item__info">
                                <span className="om-item__name">{item.name}</span>
                                <span className="om-item__price">
                                  NPR {item.price?.toLocaleString()} × {item.quantity}
                                </span>
                                <span className="om-item__subtotal">
                                  = NPR {(item.price * item.quantity)?.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Footer: total + actions */}
                        <div className="om-order-card__footer">
                          <div className="om-order-total-row">
                            <span>Order Total</span>
                            <span className="om-order-total-val">
                              NPR {order.totalAmount?.toLocaleString()}
                            </span>
                          </div>
                          <div className="om-action-row">
                            {order.status === "Pending" && (
                              <button
                                className="om-action-btn om-action-btn--accept"
                                onClick={() => updateOrderStatus(order._id, "Processing")}
                              >
                                ✅ Accept & Process
                              </button>
                            )}
                            {order.status === "Processing" && (
                              <button
                                className="om-action-btn om-action-btn--deliver"
                                onClick={() => updateOrderStatus(order._id, "Delivered")}
                              >
                                🚚 Mark as Delivered
                              </button>
                            )}
                            {(order.status === "Pending" || order.status === "Processing") && (
                              <button
                                className="om-action-btn om-action-btn--cancel"
                                onClick={() => updateOrderStatus(order._id, "Cancelled")}
                              >
                                ✕ Cancel Order
                              </button>
                            )}
                            {(order.status === "Delivered" || order.status === "Cancelled") && (
                              <span className="om-final-label">Final Status — No Further Actions</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ========== TOAST ========== */}
      {toast && (
        <div className={`sd-toast sd-toast--${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default OrderManagement;
