import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("staff_notifications");
    return saved ? JSON.parse(saved) : [];
  });
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

    // Socket listeners
    socket.on("lowStockAlert", (data) => {
      const newNotif = {
        id: Date.now(),
        ...data,
        type: "low_stock",
        read: false,
        createdAt: new Date(),
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        localStorage.setItem("staff_notifications", JSON.stringify(updated));
        return updated;
      });
      showToast(data.message, "error");
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p._id === data.productId ? { ...p, quantity: data.quantity } : p
        )
      );
    });

    socket.on("newOrder", (data) => {
      const newNotif = {
        id: data.orderId + "_" + Date.now(),
        message: data.message,
        type: "new_order",
        read: false,
        createdAt: new Date(),
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        localStorage.setItem("staff_notifications", JSON.stringify(updated));
        return updated;
      });
      showToast(data.message, "success");
    });

    return () => {
      socket.off("lowStockAlert");
      socket.off("newOrder");
    };
  }, []);

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
        headers: { Authorization: `Bearer ${token}` },
      });
      const clearedIds = JSON.parse(
        localStorage.getItem("staff_cleared_notifications") || "[]"
      );
      const backendNotifications = res.data
        .filter((n) => !n.isRead && !clearedIds.includes(n._id))
        .map((n) => ({
          id: n._id,
          message: n.message,
          type: n.type,
          read: n.isRead,
          createdAt: n.createdAt,
        }));
      setNotifications(backendNotifications);
      localStorage.setItem("staff_notifications", JSON.stringify(backendNotifications));
    } catch (err) {
      console.error("Failed to load notifications", err);
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
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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
    <div className="sd-layout od-modern-layout">
      {/* ========== SIDEBAR ========== */}
      <StaffSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        staff={staff} 
        handleLogout={handleLogout} 
      />

      {/* ========== MAIN AREA ========== */}
      <div className={`sd-main od-main-content ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        {/* ---- TOP NAVBAR ---- */}
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
              <h1>Staff Dashboard</h1>
              <span className="sd-navbar__subtitle">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="sd-navbar__right">
            {/* Notification Bell */}
            <div className="sd-notif" ref={notifRef}>
              <button
                className="sd-notif__btn"
                onClick={() => setShowNotifications((v) => !v)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="sd-notif__badge">{unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="sd-notif__dropdown">
                  <div className="sd-notif__header">
                    <span>Notifications</span>
                    <button
                      className="sd-notif__clear"
                      onClick={() => {
                        const clearedIds = JSON.parse(
                          localStorage.getItem("staff_cleared_notifications") || "[]"
                        );
                        const newCleared = [
                          ...clearedIds,
                          ...notifications.map((n) => n.id),
                        ];
                        localStorage.setItem(
                          "staff_cleared_notifications",
                          JSON.stringify(newCleared)
                        );
                        setNotifications([]);
                        localStorage.setItem("staff_notifications", JSON.stringify([]));
                      }}
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="sd-notif__list">
                    {notifications.length === 0 ? (
                      <div className="sd-notif__empty">
                        <span>📭</span>
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`sd-notif__item ${n.read ? "" : "unread"}`}
                          onClick={() => {
                            const updated = notifications.map((notif) =>
                              notif.id === n.id ? { ...notif, read: true } : notif
                            );
                            setNotifications(updated);
                            localStorage.setItem(
                              "staff_notifications",
                              JSON.stringify(updated)
                            );
                          }}
                        >
                          <span className="sd-notif__item-icon">
                            {n.type === "new_order" ? "📦" : n.type === "low_stock" ? "⚠️" : "🔔"}
                          </span>
                          <div>
                            <p className="sd-notif__item-msg">{n.message}</p>
                            <span className="sd-notif__item-time">
                              {n.createdAt
                                ? new Date(n.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="sd-avatar">
              {staff?.profileImage ? (
                <img src={`${API_BASE}/${staff.profileImage}`} alt="avatar" />
              ) : (
                <span>{(staff?.username || "S")[0].toUpperCase()}</span>
              )}
            </div>
            <div className="sd-navbar__staff-info">
              <span className="sd-navbar__name">{staff?.username || "Staff"}</span>
              <span className="sd-navbar__role">Staff</span>
            </div>
          </div>
        </header>

        {/* ---- DASHBOARD CONTENT ---- */}
        <main className="sd-content od-content">

          {/* 1. Header Section */}
          <div className="si-header-section">
            <div className="si-header-info">
              <h2>Staff Dashboard</h2>
              <p>Welcome back, {staff?.username || "Staff"}. Here's your store overview for today.</p>
            </div>
            <div className="si-header-actions">
              <button className="si-btn-primary si-btn-primary--light" onClick={() => setScannerOpen(true)}>
                <span>🔍</span> Scan Product
              </button>
            </div>
          </div>

          {/* 2. Summary Metrics */}
          <div className="si-ledger-cards">
            <div className="si-ledger-card">
              <span className="si-ledger-card__label">Total Products</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num">{products.length.toLocaleString()}</span>
              </div>
            </div>

            <div className="si-ledger-card">
              <span className="si-ledger-card__label">Orders Today</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num" style={{ color: '#3b82f6' }}>{ordersToday.length}</span>
              </div>
            </div>

            <div className="si-ledger-card">
              <span className="si-ledger-card__label">Items Sold Today</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num" style={{ color: '#10b981' }}>{itemsSoldToday}</span>
              </div>
            </div>

            <div className="si-ledger-card">
              <span className="si-ledger-card__label">Alerts & Low Stock</span>
              <div className="si-ledger-card__content">
                <span className="si-ledger-card__num" style={{ color: (lowStockProducts.length + outOfStockProducts.length) > 0 ? '#ef4444' : '#0f172a' }}>
                  {lowStockProducts.length + outOfStockProducts.length}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Data Panels */}
          <div className="sd-row--full">
            {/* Items Sold Chart */}
            <div className="si-ledger-table-wrap sd-chart-panel" style={{ padding: '24px' }}>
              <div className="sd-panel__header" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800 }}>Analytics: Items Sold</h3>
                <select
                  className="si-ledger-select"
                  value={chartFilter}
                  onChange={(e) => setChartFilter(e.target.value)}
                >
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
              </div>
              <div className="sd-chart-wrap">
                <Bar data={barChartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* 4. The Recent Ledger Table */}
          <div className="sd-row--full" style={{ marginBottom: '40px' }}>
            {/* Recent Orders Ledger */}
            <div className="si-ledger-table-wrap sd-orders-panel">
              <div className="sd-panel__header" style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800 }}>Recent Orders Ledger</h3>
                <button
                  className="si-btn-primary si-btn-primary--light"
                  onClick={() => navigate("/order-management")}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  View All History →
                </button>
              </div>
              {recentOrders.length === 0 ? (
                <div className="sd-empty" style={{ padding: '40px' }}>
                  <span>📋</span>
                  <p>No transactions recorded yet.</p>
                </div>
              ) : (
                <table className="si-ledger-table">
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
                    {recentOrders.map((o) => (
                      <tr key={o._id}>
                        <td className="si-ledger-name">
                          #KH-{o._id.slice(-4).toUpperCase()}
                        </td>
                        <td style={{ fontWeight: 600 }}>{(o.items || []).length} items</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>Rs. {o.totalAmount?.toLocaleString()}</td>
                        <td style={{ color: '#64748b' }}>
                          {new Date(o.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </td>
                        <td>
                          <div className="si-status-wrap">
                            <span className={`si-dot ${o.status === 'Pending' ? 'si-dot--orange' : o.status === 'Cancelled' ? 'si-dot--red' : 'si-dot--green'}`}></span>
                            <span className="si-status-text" style={{ fontWeight: 600 }}>
                              {o.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
              src={`${API_BASE}/${scannedProduct.image}`}
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
