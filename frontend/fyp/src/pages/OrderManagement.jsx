import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import StaffSidebar from "../components/StaffSidebar";
import socket from "../socket";
import "../styles/orderHistory.css"; // Reusing styles where possible

const API_BASE = "http://localhost:8000";

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [toast, setToast] = useState(null);
    
    // Determine if user is owner or staff
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role; // "owner" or "staff"
    const shopId = user?.shopId;

    const SidebarComponent = role === "owner" ? Sidebar : StaffSidebar;

    useEffect(() => {
        const fetchShopOrders = async () => {
            try {
                if (!shopId) return;
                const res = await axios.get(`${API_BASE}/api/orders/shop/${shopId}`);
                setOrders(res.data);
            } catch (err) {
                console.error("Fetch Orders Error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (shopId) fetchShopOrders();

        // Socket listener for real-time orders
        socket.on("newOrder", (data) => {
            if (data.shopId === shopId) {
                // Fetch again to get populated user data or just add to list
                fetchShopOrders();
                showToast("New order received!");
            }
        });

        return () => {
            socket.off("newOrder");
        };
    }, [shopId]);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`${API_BASE}/api/orders/${orderId}/status`, {
                status: newStatus,
                role: role
            });
            setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
            showToast(`Order marked as ${newStatus}`);
        } catch (err) {
            showToast(err.response?.data?.message || "Update failed", "error");
        }
    };

    const filteredOrders = filter === "all"
        ? orders
        : orders.filter(o => o.status?.toLowerCase() === filter);

    if (loading) return <div className="order-loading-container"><div className="spinner"></div></div>;

    return (
        <div style={{ display: 'flex' }}>
            <SidebarComponent />
            <div className="order-history-wrapper" style={{ flex: 1, marginLeft: '0px' }}>
                {toast && (
                    <div className={`toast toast-${toast.type}`}>
                        {toast.message}
                    </div>
                )}

                <div className="order-history-header">
                    <h1>📋 Shop Orders</h1>
                    <p className="order-count">{orders.length} total orders for your shop</p>
                </div>

                <div className="filter-section">
                    <span className="filter-label">Filter:</span>
                    {["all", "pending", "processing", "delivered", "cancelled"].map((f) => (
                        <button
                            key={f}
                            className={`filter-btn ${filter === f ? "active" : ""}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="orders-container">
                    {filteredOrders.length === 0 ? (
                        <div className="no-filtered-orders">No orders found</div>
                    ) : (
                        filteredOrders.map(order => (
                            <div key={order._id} className="order-card" style={{ marginBottom: '20px' }}>
                                <div className="order-card-header">
                                    <div className="order-info-top">
                                        <div className="order-id">ID: {order._id.slice(-8).toUpperCase()}</div>
                                        <div className="order-date">{new Date(order.createdAt).toLocaleDateString()}</div>
                                        <div className={`status-badge status-${order.status.toLowerCase()}`}>
                                            {order.status}
                                        </div>
                                    </div>
                                    <div className="customer-info" style={{ marginTop: '10px' }}>
                                        <strong>Customer:</strong> {order.user?.username || "Guest"} ({order.user?.email})
                                    </div>
                                </div>

                                <div className="order-items" style={{ maxHeight: 'none', overflow: 'visible', padding: '20px' }}>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="order-item-card" style={{ gridTemplateColumns: '80px 1fr', gap: '15px', padding: '15px' }}>
                                            <img src={`${API_BASE}/${item.image}`} alt={item.name} style={{ width: '80px', height: '80px' }} />
                                            <div>
                                                <h4>{item.name}</h4>
                                                <p>NPR {item.price} x {item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="order-summary-footer">
                                    <div className="summary-row total-row">
                                        <span>Total:</span>
                                        <span>NPR {order.totalAmount}</span>
                                    </div>
                                </div>

                                <div className="order-actions">
                                    {order.status === "Pending" && (
                                        <button className="action-btn primary" onClick={() => updateOrderStatus(order._id, "Processing")}>
                                            ✅ Accept & Process
                                        </button>
                                    )}
                                    {order.status === "Processing" && (
                                        <button className="action-btn primary" onClick={() => updateOrderStatus(order._id, "Delivered")}>
                                            🚚 Mark as Delivered
                                        </button>
                                    )}
                                    {(order.status === "Pending" || order.status === "Processing") && (
                                        <button className="action-btn secondary" onClick={() => updateOrderStatus(order._id, "Cancelled")}>
                                            ✕ Cancel Order
                                        </button>
                                    )}
                                    {(order.status === "Delivered" || order.status === "Cancelled") && (
                                        <span style={{ color: '#95a5a6', fontSize: '12px' }}>Final Status - No Actions</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderManagement;
