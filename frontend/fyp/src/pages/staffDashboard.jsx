import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import QRScanner from "./QRScanner";
import socket from "../socket";
import "../styles/staffDashboard.css";
import "../styles/staffInventory.css";
import "../styles/ownerDashboard.css";
import StaffSidebar from "../components/StaffSidebar";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_BASE = "http://localhost:8000";

const StaffDashboard = () => {
  const navigate = useNavigate();

  // Staff & core data
  const [staff, setStaff] = useState({});
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Toast
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });

  // QR Scanner
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [closedScannedProduct, setClosedScannedProduct] = useState(false);
  const [reAddQuantity, setReAddQuantity] = useState(1);
  const [isAddingStock, setIsAddingStock] = useState(false);
  
  // Edited scanned fields
  const [editScannedPrice, setEditScannedPrice] = useState("");
  const [editScannedQuantity, setEditScannedQuantity] = useState("");
  const [isUpdatingScanned, setIsUpdatingScanned] = useState(false);

  // Chart filter
  const [chartFilter, setChartFilter] = useState("This Week");

  const notifRef = useRef(null);

  // ===================== Data Fetch =====================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const resStaff = await axios.get(`${API_BASE}/api/owner/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const staffData = resStaff.data.owner || resStaff.data.staff;
        setStaff(staffData);

        const shopId = staffData?.shopId;

        const resProducts = await axios.get(`${API_BASE}/api/owner/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(resProducts.data.products || []);

        if (shopId) {
          fetchNotifications(shopId);
          try {
            const resOrders = await axios.get(`${API_BASE}/api/orders/shop/${shopId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setOrders(Array.isArray(resOrders.data) ? resOrders.data : []);
          } catch {
            setOrders([]);
          }
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to load dashboard data", "error");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!staff?.shopId) return;

    const fetchOrdersBackground = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const resOrders = await axios.get(`${API_BASE}/api/orders/shop/${staff.shopId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(Array.isArray(resOrders.data) ? resOrders.data : []);
      } catch (err) {
        console.error("Failed to background fetch orders:", err);
      }
    };

    socket.on("lowStockAlert", (data) => {
      showToast(data.message, "error");
      fetchNotifications(staff.shopId);
      setProducts((prev) => prev.map((p) => p._id === data.productId ? { ...p, quantity: data.quantity } : p));
    });

    socket.on("newOrder", (data) => {
      if (data.shopId === staff.shopId) {
        showToast(data.message, "success");
        fetchNotifications(staff.shopId);
        fetchOrdersBackground();
      }
    });

    return () => {
      socket.off("lowStockAlert");
      socket.off("newOrder");
    };
  }, [staff?.shopId]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const fetchNotifications = async (shopId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/api/notifications/${shopId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`${API_BASE}/api/notifications/mark-all-read/${staff.shopId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      setShowNotifications(false);
      showToast("Notifications cleared", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to clear notifications", "error");
    }
  };

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  };

  // ===================== Logout =====================
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_BASE}/api/staff/logout-click`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  // ===================== QR Scan =====================
  const handleScanSuccess = async (productId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/api/owner/product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const product = res.data.product;
      setScannedProduct({ ...product, deleted: !!product.deleted });
      setEditScannedPrice(product.price || 0);
      setEditScannedQuantity(product.quantity || 0);
      setClosedScannedProduct(false);
    } catch {
      setScannedProduct(null);
    }
    setScannerOpen(false);
  };

  const handleUpdateScannedProduct = async () => {
    setIsUpdatingScanned(true);
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("name", scannedProduct.name);
      formData.append("price", editScannedPrice);
      formData.append("quantity", editScannedQuantity);
      formData.append("category", scannedProduct.category || "Others");
      formData.append("description", scannedProduct.description || "");

      const res = await axios.put(
        `${API_BASE}/api/owner/update-product/${scannedProduct._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setProducts((prev) => {
        const exists = prev.find((p) => p._id === scannedProduct._id);
        if (exists) return prev.map((p) => (p._id === scannedProduct._id ? res.data.product : p));
        return [...prev, res.data.product];
      });
      
      // Close the card upon success
      setScannedProduct(null);
      setClosedScannedProduct(true);
      
      showToast("Product updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update product", "error");
    } finally {
      setIsUpdatingScanned(false);
    }
  };

  const handleAddProductAgain = async (product) => {
    setIsAddingStock(true);
    setClosedScannedProduct(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.put(
        `${API_BASE}/api/owner/restore-product/${product._id}`,
        { quantity: reAddQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts((prev) => {
        const exists = prev.find((p) => p._id === product._id);
        if (exists) return prev.map((p) => (p._id === product._id ? res.data.product : p));
        return [...prev, res.data.product];
      });
      setReAddQuantity(1);
      showToast("Stock added successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update stock", "error");
      setClosedScannedProduct(false);
    } finally {
      setIsAddingStock(false);
    }
  };

  // ===================== Derived Stats =====================
  const lowStockProducts = products.filter((p) => p.quantity > 0 && p.quantity < 5);
  const outOfStockProducts = products.filter((p) => p.quantity === 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ordersToday = orders.filter((o) => {
    const d = new Date(o.createdAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const itemsSoldToday = ordersToday.reduce((sum, o) => {
    return (
      sum +
      (o.items || []).reduce((s, item) => s + (item.quantity || 0), 0)
    );
  }, 0);

  const recentOrders = [...orders]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const valA = isNaN(dateA) ? 0 : dateA;
      const valB = isNaN(dateB) ? 0 : dateB;
      return valB - valA;
    })
    .slice(0, 5);

  // ===================== Chart Data =====================
  const buildChartData = () => {
    const labels = [];
    const data = [];

    if (chartFilter === "Today") {
      for (let h = 6; h <= 22; h += 2) {
        labels.push(`${h}:00`);
        const sold = orders
          .filter((o) => {
            const d = new Date(o.createdAt);
            d.setHours(0, 0, 0, 0);
            return (
              d.getTime() === today.getTime() && new Date(o.createdAt).getHours() >= h &&
              new Date(o.createdAt).getHours() < h + 2
            );
          })
          .reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + i.quantity, 0), 0);
        data.push(sold);
      }
    } else if (chartFilter === "This Week") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      weekAgo.setHours(0, 0, 0, 0);
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        labels.push(days[d.getDay()]);
        const sold = orders
          .filter((o) => {
            const od = new Date(o.createdAt);
            od.setHours(0, 0, 0, 0);
            return od.getTime() === d.getTime();
          })
          .reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + i.quantity, 0), 0);
        data.push(sold);
      }
    } else {
      // This Month
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        labels.push(`${d}`);
        const date = new Date(today.getFullYear(), today.getMonth(), d);
        const sold = orders
          .filter((o) => {
            const od = new Date(o.createdAt);
            return (
              od.getDate() === d &&
              od.getMonth() === today.getMonth() &&
              od.getFullYear() === today.getFullYear()
            );
          })
          .reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + i.quantity, 0), 0);
        data.push(sold);
      }
    }

    return { labels, data };
  };

  const { labels: chartLabels, data: chartData } = buildChartData();

  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Items Sold",
        data: chartData,
        backgroundColor: "rgba(59, 130, 246, 0.75)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        borderColor: "#3b82f6",
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: "#94a3b8" },
        grid: { color: "rgba(148,163,184,0.15)" },
      },
      x: {
        ticks: { color: "#94a3b8" },
        grid: { display: false },
      },
    },
  };

  // ===================== Status badge helper =====================
  const statusClass = (status) => {
    if (status === "Pending") return "badge-pending";
    if (status === "Processing") return "badge-processing";
    if (status === "Delivered") return "badge-delivered";
    if (status === "Cancelled") return "badge-cancelled";
    return "";
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ===================== Sidebar nav =====================
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navLinks = [
    { label: "Dashboard", icon: "🏠", path: "/staff-dashboard" },
    { label: "Product Management", icon: "📦", path: "/staff-inventory" },
    { label: "Orders", icon: "🛒", path: "/order-management" },
    { label: "Attendance", icon: "📅", path: "/staff-attendance" },
    { label: "Profile", icon: "👤", path: "/staff-profile" },
  ];

  return (
    <div className="od-shell">
      {/* ══════════════════════ SIDEBAR ══════════════════════ */}
      <StaffSidebar staff={staff} />

      {/* ══════════════════════ MAIN ══════════════════════════ */}
      <div className="od-main">
        {/* ── Top bar ── */}
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">Staff Dashboard</h1>
            <div className="od-topbar__date">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>

          <div className="od-topbar__right">
            {/* Scan Product Button */}
            <button className="od-pill od-pill--active" onClick={() => setScannerOpen(true)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🔍</span> Scan Product
            </button>

            {/* Notification Bell */}
            <div style={{ position: "relative" }} ref={notifRef}>
              <button 
                className="od-topbar__icon-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
              >
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
                    {notifications.length === 0 ? (
                      <p className="od-notif-panel__empty">All caught up! 🎉</p>
                    ) : (
                      notifications.map(noti => (
                        <div key={noti._id} className={`od-notif-item od-notif-item--${noti.type === "low_stock" ? "warn" : "info"}`}>
                          <span>{noti.type === "low_stock" ? "🚨" : "📦"}</span>
                          <div>
                            <p>{noti.message}</p>
                            <small>{new Date(noti.createdAt).toLocaleString()}</small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="od-topbar__profile" onClick={() => navigate("/staff-profile")}>
              <div className="od-topbar__avatar">
                {staff?.profileImage ? (
                  <img src={imgUrl(staff.profileImage)} alt="avatar" />
                ) : (
                  <span>{(staff?.username || "S")[0].toUpperCase()}</span>
                )}
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
              { label: "Total Products",   value: products.length.toLocaleString(),       color: "#8b5cf6", icon: "M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
              { label: "Orders Today",     value: ordersToday.length,                     color: "#3b82f6", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
              { label: "Items Sold Today", value: itemsSoldToday,                         color: "#10b981", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
              { label: "Alerts & Low Stock", value: lowStockProducts.length + outOfStockProducts.length, color: "#ef4444", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
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
          <div className="od-panel" style={{ marginBottom: "16px" }}>
            <div className="od-panel__head" style={{ marginBottom: '16px' }}>
              <div>
                <div className="od-panel__title">Analytics: Items Sold</div>
                <div className="od-panel__sub">Performance metric</div>
              </div>
              <select
                className="od-pill"
                value={chartFilter}
                onChange={(e) => setChartFilter(e.target.value)}
                style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }}
              >
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
              </select>
            </div>
            <div className="od-chart-area" style={{ height: "350px" }}>
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </div>

          {/* ── Recent Orders Table ── */}
          <div className="od-panel od-panel--table" style={{ marginBottom: "40px" }}>
            <div className="od-panel__head">
              <div>
                <div className="od-panel__title">Recent Orders Ledger</div>
                <div className="od-panel__sub">Latest 5 transactions</div>
              </div>
              <button className="od-view-all-btn" onClick={() => navigate("/order-management")}>
                View All History →
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="od-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Quantity</th>
                    <th>Total Amount</th>
                    <th>Transaction Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr><td colSpan={5} className="od-table__empty">No transactions recorded yet.</td></tr>
                  ) : (
                    recentOrders.map((o) => {
                      const st = o.status?.toLowerCase();
                      return (
                        <tr key={o._id}>
                          <td className="od-table__id">#KH-{o._id.slice(-4).toUpperCase()}</td>
                          <td className="od-table__customer">{(o.items || []).length} items</td>
                          <td className="od-table__amount">Rs. {o.totalAmount?.toLocaleString()}</td>
                          <td className="od-table__date">
                            {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td>
                            <span className={`od-badge od-badge--${st === "delivered" ? "green" : st === "pending" ? "amber" : st === "cancelled" ? "red" : "blue"}`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ========== QR SCANNER ========== */}
      {scannerOpen && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {/* ========== SCANNED PRODUCT CARD ========== */}
      {scannedProduct && !closedScannedProduct && (
        <div className="sd-scanned-card">
          <div className="sd-scanned-card__header">
            <h3>
              {scannedProduct.name}
              {scannedProduct.deleted && (
                <span className="sd-scanned-card__deleted-badge">Deleted</span>
              )}
            </h3>
            <button
              onClick={() => {
                setScannedProduct(null);
                setClosedScannedProduct(false);
              }}
            >
              ✕
            </button>
          </div>
          {scannedProduct.image && (
            <img
              src={imgUrl(scannedProduct.image)}
              alt={scannedProduct.name}
              className="sd-scanned-card__img"
            />
          )}
          <div className="sd-scanned-card__details">
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ width: "70px", fontWeight: "600" }}>Price:</span>
              <input 
                type="number" 
                value={editScannedPrice} 
                onChange={(e) => setEditScannedPrice(e.target.value)}
                style={{ width: "100px", padding: "6px", border: "1px solid #ccc", borderRadius: "5px" }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ width: "70px", fontWeight: "600" }}>Stock:</span>
              <input 
                type="number" 
                value={editScannedQuantity} 
                onChange={(e) => setEditScannedQuantity(e.target.value)}
                style={{ width: "100px", padding: "6px", border: "1px solid #ccc", borderRadius: "5px" }}
              />
            </div>
            <p>
              <span style={{ fontWeight: "600" }}>Description:</span> {scannedProduct.description}
            </p>
            <div style={{ marginTop: "12px" }}>
              <button 
                className="si-btn-submit" 
                onClick={handleUpdateScannedProduct}
                disabled={isUpdatingScanned || scannedProduct.deleted}
                style={{ padding: "8px 16px" }}
              >
                {isUpdatingScanned ? "Saving..." : "💾 Update Product"}
              </button>
            </div>
          </div>
          {scannedProduct.deleted && (
            <div className="sd-scanned-card__readd">
              <label>Add Quantity:</label>
              <input
                type="number"
                min="1"
                value={reAddQuantity}
                onChange={(e) => setReAddQuantity(Number(e.target.value))}
                disabled={isAddingStock}
              />
              <button
                onClick={() => handleAddProductAgain(scannedProduct)}
                disabled={isAddingStock}
              >
                {isAddingStock ? "Adding..." : "➕ Add Stock"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========== TOAST ========== */}
      {toast.visible && (
        <div className={`sd-toast sd-toast--${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default StaffDashboard;
