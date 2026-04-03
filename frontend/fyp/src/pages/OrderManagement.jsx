import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import socket from "../socket";
import "../styles/orderManagement.css";
import OwnerSidebar from "../components/OwnerSidebar";
import StaffSidebar from "../components/StaffSidebar";

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
  
  // Notifications handled globally in Dashboard

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

  return (
    <div className="sd-layout">
      {/* Role-based Sidebar */}
      {role === "owner" ? (
        <OwnerSidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          owner={user} 
          handleLogout={handleLogout} 
        />
      ) : (
        <StaffSidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          staff={user} 
          handleLogout={handleLogout} 
        />
      )}

      {/* ========== GLOBAL NAVBAR ========== */}
      <div className={`sd-main od-main-content ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)} onMouseEnter={() => { if (window.sidebarTimer) clearTimeout(window.sidebarTimer); setSidebarOpen(true); }} onMouseLeave={() => { window.sidebarTimer = setTimeout(() => setSidebarOpen(false), 300); }}>☰</button>
            <div className="sd-navbar__title">
              <h1>Order Management</h1>
              <span className="sd-navbar__subtitle">View and manage shop orders</span>
            </div>
          </div>
          
          <div className="sd-navbar__right">
            {/* Notifications Removed from inline pages */}

            <div
              onClick={() => navigate(role === "owner" ? "/owner-profile" : "/staff-profile")}
              style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
            >
              <div className="sd-avatar">
                {user?.profileImage ? (
                  <img src={imgUrl(user.profileImage)} alt="avatar" />
                ) : (
                  <span>{(user?.username || (role === "owner" ? "O" : "S"))[0].toUpperCase()}</span>
                )}
              </div>
              <div className="sd-navbar__staff-info">
                <span className="sd-navbar__name">{user?.username || (role === "owner" ? "Owner" : "Staff")}</span>
                <span className="sd-navbar__role" style={{ textTransform: 'capitalize' }}>{role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ---- CONTENT ---- */}
        <main className="sd-content">
          
          {/* Page Header (White Bar style like Inventory) */}
          <div className="om-page-header">
            <div className="om-header-title-group">
              <h1>Order Ledger</h1>
              <p className="om-header-subtitle">
                Manage and update your order history for SmartKhata.
              </p>
            </div>
            <div className="om-ledger-header-actions">
              <button className="om-ledger-btn-secondary">📄 Export Report</button>
              <button className="om-ledger-btn-primary">+ Manual Entry</button>
            </div>
          </div>
          
          {/* 1. Summary Analytics Cards */}
          <div className="om-ledger-cards">
            <div className="om-ledger-card">
              <span className="om-ledger-card__label">Total Orders</span>
              <span className="om-ledger-card__num">{orders.length.toLocaleString()}</span>
              
            </div>
            <div className="om-ledger-card">
              <span className="om-ledger-card__label">Pending</span>
              <span className="om-ledger-card__num">{countByStatus("Pending")}</span>
              
            </div>
            <div className="om-ledger-card">
              <span className="om-ledger-card__label">Processing</span>
              <span className="om-ledger-card__num">{countByStatus("Processing")}</span>
              
            </div>
            <div className="om-ledger-card">
              <span className="om-ledger-card__label">Delivered</span>
              <span className="om-ledger-card__num">{countByStatus("Delivered")}</span>
              
            </div>
            <div className="om-ledger-card">
              <span className="om-ledger-card__label">Cancelled</span>
              <span className="om-ledger-card__num">{countByStatus("Cancelled")}</span>
              
            </div>
          </div>

          {/* 2. Filter & Actions Row */}
          <div className="om-ledger-filters">
            <div className="om-tab-bar">
              {STATUS_FILTERS.map(f => (
                <button 
                  key={f}
                  className={`om-tab-btn ${filter === f ? "om-tab-btn--active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f} <span className="om-tab-count">{f === "All" ? orders.length : countByStatus(f)}</span>
                </button>
              ))}
            </div>
            <div className="om-ledger-header-actions">
              <button className="om-ledger-btn-secondary">⚙ Advanced Filters</button>
              <button className="om-ledger-btn-secondary">📅 Last 30 Days</button>
            </div>
          </div>

          {/* 3. The Order Ledger */}
          <div className="om-ledger-table">
            <div className="om-ledger-table-head">
              <span>Order ID</span>
              <span>Customer</span>
              <span>Date</span>
              <span>Amount</span>
              <span>Status</span>
              <span></span>
            </div>

            {loading ? (
              <div className="om-loading">
                <div className="om-spinner"></div>
                <p>Syncing orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
               <div className="sd-empty" style={{ padding: '60px', textAlign: 'center' }}>
                <span style={{ fontSize: '40px' }}>📦</span>
                <p>No {filter !== "All" ? filter.toLowerCase() : ""} orders found.</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order._id} className={`om-order-row ${expandedOrder === order._id ? "om-order-row--expanded" : ""}`}>
                  {/* Row Summary */}
                  <div className="om-order-summary" onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}>
                    <span className="om-order-id">#KH-{order._id.slice(-4).toUpperCase()}</span>
                    
                    <div className="om-customer-cell">
                      <div className="om-customer-avatar">
                        {order.user?.username ? order.user.username[0].toUpperCase() : "G"}
                      </div>
                      <div className="om-customer-info">
                        <span className="om-customer-name">{order.user?.username || "Guest Customer"}</span>
                        <span className="om-customer-email">{order.user?.email || "No email available"}</span>
                      </div>
                    </div>

                    <span className="om-date-cell">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>

                    <span className="om-amount-cell">Rs. {order.totalAmount?.toLocaleString()}</span>

                    <span className={`om-status-tag om-status--${order.status?.toLowerCase()}`}>
                      {order.status}
                    </span>

                    <span className={`om-expand-arrow ${expandedOrder === order._id ? "om-expand-arrow--up" : ""}`}>
                      ▼
                    </span>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrder === order._id && (
                    <div className="om-order-details">
                      <div className="om-details-main">
                        <h4 className="om-section-label">Items Ordered</h4>
                        <div className="om-items-list">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="om-item-card">
                              <img 
                                src={imgUrl(item.image)} 
                                alt={item.name} 
                                className="om-item-img" 
                                onError={(e) => { e.target.src = "https://placehold.co/60x60?text=Item"; }}
                              />
                              <div className="om-item-main">
                                <span className="om-item-name">{item.name}</span>
                                <span className="om-item-sku">SKU: {item._id?.slice(-8).toUpperCase()}</span>
                              </div>
                              <div className="om-item-pricing">
                                <span className="om-item-price">Rs. {item.price?.toLocaleString()}</span>
                                <span className="om-item-qty">Qty: {item.quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="om-details-sidebar">
                        <div className="om-shipping-section">
                           <h4 className="om-section-label">Shipping To</h4>
                           <div className="om-shipping-box">
                             <span className="om-shipping-title">Delivery Location</span>
                             <p className="om-shipping-addr">
                               Order placed via {order.paymentMethod || "Direct Payment"}<br/>
                               {order.user?.phone || "No phone provided"}<br/>
                               Kathmandu, Nepal
                             </p>
                           </div>
                        </div>

                        <div className="om-status-actions">
                           <h4 className="om-section-label">Update Status</h4>
                           <div className="om-actions-stack">
                              {/* Action Buttons based on status */}
                              {order.status === "Pending" && (
                                <button className="om-btn-main" onClick={() => updateOrderStatus(order._id, "Processing")}>
                                  Accept Order
                                </button>
                              )}
                              {order.status === "Processing" && (
                                <button className="om-btn-main" onClick={() => updateOrderStatus(order._id, "Delivered")}>
                                   Mark as Delivered
                                </button>
                              )}
                              
                              <div className="om-actions-row-mini">
                                {(order.status === "Pending" || order.status === "Processing") && (
                                   <button className="om-btn-outline om-btn-outline--cancel" onClick={() => updateOrderStatus(order._id, "Cancelled")}>
                                      Cancel Order
                                   </button>
                                )}
                                {order.status === "Pending" && (
                                   <button className="om-btn-outline om-btn-outline--accept" onClick={() => updateOrderStatus(order._id, "Processing")}>
                                      Quick Process
                                   </button>
                                )}
                              </div>

                              {(order.status === "Delivered" || order.status === "Cancelled") && (
                                <div className="om-final-label">This order is {order.status.toLowerCase()}</div>
                              )}
                           </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
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
