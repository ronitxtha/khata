import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/receipt.css";

const API_BASE = "http://localhost:8000";

/* ── Barcode decoration ────────────────────────── */
const BarcodeDecoration = ({ orderId }) => {
  // Deterministic bar widths from the order ID characters
  const chars = (orderId || "XXXXXXXX").split("").slice(0, 24);
  const bars = chars.map((ch, i) => {
    const code = ch.charCodeAt(0);
    return {
      width: (code % 3) + 1,   // 1, 2, or 3px
      height: 20 + (code % 16), // 20–35px
    };
  });

  return (
    <div className="receipt-barcode">
      <div className="barcode-lines">
        {bars.map((b, i) => (
          <span
            key={i}
            style={{ width: b.width, height: b.height }}
          />
        ))}
      </div>
      <p className="receipt-barcode-number">
        #{(orderId || "").slice(-12).toUpperCase()}
      </p>
    </div>
  );
};

/* ── Main Component ────────────────────────────── */
const OrderReceipt = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [order, setOrder] = useState(state?.order || null);
  const [loading, setLoading] = useState(!state?.order);
  const [error, setError]   = useState(null);

  // If only orderId was passed (eSewa flow), fetch full order
  useEffect(() => {
    if (state?.order) return; // already have full data

    const orderId = state?.orderId;
    if (!orderId) {
      setError("No order information found.");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/orders/${orderId}`);
        setOrder(res.data);
      } catch (err) {
        console.error("Receipt fetch error:", err);
        setError("Could not load order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [state]);

  // ── Loading ─────────────────────────────────────
  if (loading) {
    return (
      <div className="receipt-page">
        <div className="receipt-loading">
          <div className="receipt-spinner" />
          <p>Loading your receipt…</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────
  if (error || !order) {
    return (
      <div className="receipt-page">
        <div className="receipt-loading">
          <p>⚠️ {error || "Something went wrong."}</p>
          <button
            className="receipt-btn primary"
            style={{ marginTop: 24, maxWidth: 200 }}
            onClick={() => navigate("/orders")}
          >
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────
  const user  = JSON.parse(localStorage.getItem("user")) || {};
  const items = order.items || [];
  const total = order.totalAmount || 0;

  const paymentMethod =
    order.paymentMethod === "eSewa" || order.paymentMethod === "ESEWA"
      ? "eSewa"
      : "Cash on Delivery";

  const isEsewa = paymentMethod === "eSewa";

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-NP", {
    year:  "numeric",
    month: "long",
    day:   "numeric",
  });

  const formattedTime = new Date(order.createdAt).toLocaleTimeString("en-NP", {
    hour:   "2-digit",
    minute: "2-digit",
  });

  const shortId = `#${order._id.slice(-8).toUpperCase()}`;

  const handlePrint = () => window.print();

  return (
    <div className="receipt-page">
      {/* ── Animated check ─────────────────── */}
      <div className="receipt-success-icon">✓</div>
      <p className="receipt-confirmed-label">Order Confirmed</p>

      {/* ── Receipt card ───────────────────── */}
      <div className="receipt-card">

        {/* Header */}
        <div className="receipt-header">
          <p className="receipt-shop-name">Smart Khata</p>
          <p className="receipt-shop-tagline">Receipt</p>
        </div>

        <div className="receipt-tear" />

        {/* Body */}
        <div className="receipt-body">

          {/* Meta info */}
          <div className="receipt-meta">
            <div className="receipt-meta-row">
              <span className="receipt-meta-label">Order ID</span>
              <span className="receipt-meta-value order-id">{shortId}</span>
            </div>
            <div className="receipt-meta-row">
              <span className="receipt-meta-label">Date</span>
              <span className="receipt-meta-value">{formattedDate}</span>
            </div>
            <div className="receipt-meta-row">
              <span className="receipt-meta-label">Time</span>
              <span className="receipt-meta-value">{formattedTime}</span>
            </div>
            <div className="receipt-meta-row">
              <span className="receipt-meta-label">Customer</span>
              <span className="receipt-meta-value" style={{ fontFamily: "Inter", fontWeight: 700 }}>
                {user.username || user.name || "Customer"}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="receipt-items">
            <p className="receipt-section-title">Items Ordered</p>

            {items.map((item, idx) => (
              <div className="receipt-item-row" key={idx}>
                <span className="receipt-item-name">{item.name}</span>
                <span className="receipt-item-qty">× {item.quantity}</span>
                <span className="receipt-item-price">
                  Rs. {(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <hr className="receipt-divider" />

          {/* Totals */}
          <div className="receipt-totals">
            <div className="receipt-total-row">
              <span>Subtotal</span>
              <span>Rs. {total.toLocaleString()}</span>
            </div>
            <div className="receipt-total-row">
              <span>Delivery</span>
              <span style={{ color: "#10b981", fontWeight: 700 }}>FREE</span>
            </div>
            <div className="receipt-total-row grand-total">
              <span className="total-label">Total</span>
              <span className="total-amount">Rs. {total.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="receipt-payment-section">
            <p className="receipt-section-title">Payment Method</p>
            <div className={`receipt-payment-badge ${isEsewa ? "esewa" : "cod"}`}>
              <span className="badge-dot" />
              {isEsewa ? "eSewa — Paid Online" : "Cash on Delivery"}
            </div>
          </div>

          {/* Barcode */}
          <BarcodeDecoration orderId={order._id} />
        </div>
      </div>

      {/* ── Action buttons ─────────────────── */}
      <div className="receipt-actions">
        <button
          className="receipt-btn secondary"
          onClick={handlePrint}
        >
          🖨️ Print Receipt
        </button>
        <button
          className="receipt-btn primary"
          onClick={() => navigate("/orders")}
        >
          📦 View My Orders
        </button>
      </div>
    </div>
  );
};

export default OrderReceipt;
