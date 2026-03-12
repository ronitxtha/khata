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
      setClosedScannedProduct(false);
    } catch {
      setScannedProduct(null);
    }
    setScannerOpen(false);
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
              className={`sd-sidebar__link ${
                window.location.pathname === link.path ? "active" : ""
              }`}
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

      {/* ========== MAIN AREA ========== */}
      <div className={`sd-main ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        {/* ---- TOP NAVBAR ---- */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button
              className="sd-navbar__hamburger"
              onClick={() => setSidebarOpen((v) => !v)}
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
        <main className="sd-content">

          {/* Welcome Banner */}
          <div className="sd-welcome">
            <div>
              <h2>Welcome back, {staff?.username || "Staff"} 👋</h2>
              <p>Here's what's happening in your store today.</p>
            </div>
            <button className="sd-btn-scan" onClick={() => setScannerOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <path d="M14 14h2v2h-2zM18 14h3M14 18h3M18 18h3M18 21h3"/>
              </svg>
              Scan QR Code
            </button>
          </div>

          {/* ---- SUMMARY CARDS ---- */}
          <div className="sd-cards">
            <div className="sd-card sd-card--blue">
              <div className="sd-card__icon">📦</div>
              <div className="sd-card__body">
                <span className="sd-card__num">{products.length}</span>
                <span className="sd-card__label">Total Products</span>
              </div>
            </div>

            <div className="sd-card sd-card--green">
              <div className="sd-card__icon">🛒</div>
              <div className="sd-card__body">
                <span className="sd-card__num">{ordersToday.length}</span>
                <span className="sd-card__label">Orders Today</span>
              </div>
            </div>

            <div className="sd-card sd-card--purple">
              <div className="sd-card__icon">✅</div>
              <div className="sd-card__body">
                <span className="sd-card__num">{itemsSoldToday}</span>
                <span className="sd-card__label">Items Sold Today</span>
              </div>
            </div>

            <div className="sd-card sd-card--orange">
              <div className="sd-card__icon">⚠️</div>
              <div className="sd-card__body">
                <span className="sd-card__num">{lowStockProducts.length + outOfStockProducts.length}</span>
                <span className="sd-card__label">Low Stock Items</span>
              </div>
            </div>
          </div>

          {/* ---- CHART + LOW STOCK ---- */}
          <div className="sd-row">
            {/* Bar Chart */}
            <div className="sd-panel sd-chart-panel">
              <div className="sd-panel__header">
                <h3>Items Sold</h3>
                <select
                  className="sd-filter-select"
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

            {/* Low Stock */}
            <div className="sd-panel sd-lowstock-panel">
              <div className="sd-panel__header">
                <h3>⚠️ Low Stock Alert</h3>
              </div>
              <div className="sd-lowstock-list">
                {[...lowStockProducts, ...outOfStockProducts].length === 0 ? (
                  <div className="sd-empty">
                    <span>🎉</span>
                    <p>All items well stocked!</p>
                  </div>
                ) : (
                  [...lowStockProducts, ...outOfStockProducts]
                    .slice(0, 8)
                    .map((p) => (
                      <div key={p._id} className="sd-lowstock-item">
                        <div className="sd-lowstock-item__info">
                          {p.image ? (
                            <img
                              src={`${API_BASE}/${p.image}`}
                              alt={p.name}
                              className="sd-lowstock-item__img"
                            />
                          ) : (
                            <div className="sd-lowstock-item__img-placeholder">📷</div>
                          )}
                          <span className="sd-lowstock-item__name">{p.name}</span>
                        </div>
                        <span
                          className={`sd-lowstock-item__qty ${
                            p.quantity === 0 ? "out" : "low"
                          }`}
                        >
                          {p.quantity === 0 ? "Out of stock" : `${p.quantity} left`}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* ---- RECENT ORDERS + QUICK ACTIONS ---- */}
          <div className="sd-row">
            {/* Recent Orders */}
            <div className="sd-panel sd-orders-panel">
              <div className="sd-panel__header">
                <h3>🧾 Recent Orders</h3>
                <button
                  className="sd-link-btn"
                  onClick={() => navigate("/order-management")}
                >
                  View All →
                </button>
              </div>
              {recentOrders.length === 0 ? (
                <div className="sd-empty">
                  <span>📋</span>
                  <p>No orders yet.</p>
                </div>
              ) : (
                <table className="sd-orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o._id}>
                        <td className="sd-order-id">
                          #{o._id.slice(-8).toUpperCase()}
                        </td>
                        <td>{(o.items || []).length} item(s)</td>
                        <td>NPR {o.totalAmount?.toLocaleString()}</td>
                        <td>
                          {new Date(o.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td>
                          <span className={`sd-badge ${statusClass(o.status)}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Quick Actions */}
            <div className="sd-panel sd-quickactions-panel">
              <div className="sd-panel__header">
                <h3>⚡ Quick Actions</h3>
              </div>
              <div className="sd-quickactions">
                <button
                  className="sd-qa-btn sd-qa-btn--primary"
                  onClick={() => navigate("/staff-inventory")}
                >
                  <span className="sd-qa-btn__icon">➕</span>
                  <span>Add Product</span>
                </button>
                <button
                  className="sd-qa-btn sd-qa-btn--secondary"
                  onClick={() => setScannerOpen(true)}
                >
                  <span className="sd-qa-btn__icon">📱</span>
                  <span>Scan Product QR</span>
                </button>
                <button
                  className="sd-qa-btn sd-qa-btn--tertiary"
                  onClick={() => navigate("/order-management")}
                >
                  <span className="sd-qa-btn__icon">📋</span>
                  <span>View Orders</span>
                </button>
              </div>
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
            <p>
              <span>Price:</span> NPR {scannedProduct.price}
            </p>
            <p>
              <span>Quantity:</span> {scannedProduct.quantity ?? "N/A"}
            </p>
            <p>
              <span>Description:</span> {scannedProduct.description}
            </p>
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
