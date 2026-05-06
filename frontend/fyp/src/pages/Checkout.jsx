import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import CustomerSidebar from "../components/CustomerSidebar";
import "../styles/ownerDashboard.css";
import { API_BASE } from "../config/api.js";

const Checkout = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const product = state?.product;
  const cartItems = state?.cartItems;
  const fromCart = state?.fromCart;
  const address = state?.deliveryAddress;

  // 🔹 Get logged-in user safely
  const user = JSON.parse(localStorage.getItem("user")) || null;

  const [quantity, setQuantity] = useState(1);
  const [payment, setPayment] = useState("COD");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!product && !cartItems) {
    return (
      <div className="od-shell">
        <CustomerSidebar customer={user} />
        <div className="od-main">
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>🛒</div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>No items selected for checkout</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>Please select items to proceed with your order.</p>
            <button onClick={() => navigate("/")} style={{ background: '#6366f1', color: '#fff', padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Back to Shop →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleBuyNow = async () => {
    if (!user) {
      alert("Please login to place an order");
      navigate("/login");
      return;
    }

    if (!address) {
      alert("Please select delivery address");
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        userId: user._id,
        items: fromCart 
          ? cartItems.map(item => ({ productId: item._id, quantity: item.quantity }))
          : [
              {
                productId: product._id,
                quantity: quantity
              }
            ],
        deliveryAddress: address,
        paymentMethod: payment
      };

      if (payment === "COD") {
        // Standard COD flow
        const res = await axios.post(`${API_BASE}/api/orders/create`, payload);
        navigate("/order-receipt", { state: { order: res.data } });
      } else if (payment === "ESEWA") {
        // eSewa Flow
        const res = await axios.post(`${API_BASE}/api/orders/initiate-esewa`, payload);
        const esewaParams = res.data;

        // Create a hidden form and submit it to eSewa UAT endpoint
        const form = document.createElement("form");
        form.setAttribute("method", "POST");
        form.setAttribute("action", "https://rc-epay.esewa.com.np/api/epay/main/v2/form");

        for (const key in esewaParams) {
          if (key !== "orderId") {
            const hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", esewaParams[key]);
            form.appendChild(hiddenField);
          }
        }

        document.body.appendChild(form);
        form.submit();
      }

    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "Order failed. Please try again.";
      alert(message);
    } finally {
      setIsProcessing(false);
    }
  };


  const totalPrice = fromCart ? state.totalAmount : product.price * quantity;
  const user_data = JSON.parse(localStorage.getItem("user")) || {};

  return (
    <div className="od-shell">
      <CustomerSidebar customer={user_data} />

      <div className="od-main">
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">Checkout</h1>
            <div className="od-topbar__date">Review and complete your purchase</div>
          </div>
          <div className="od-topbar__right">
            <div className="od-topbar__profile" onClick={() => navigate("/customer-profile")}>
              <div className="od-topbar__avatar">
                {user_data?.profileImage
                  ? <img src={imgUrl(user_data.profileImage)} alt="avatar" />
                  : <span>{(user_data?.username || "C")[0].toUpperCase()}</span>}
              </div>
            </div>
            <button className="od-topbar__logout" onClick={() => navigate(-1)} title="Back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
          </div>
        </header>

        <main className="od-content">
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Order Summary & Payment</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 500 }}>
              Complete your purchase by providing payment and shipping details
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
            {/* LEFT COLUMN: Summary */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 24px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Items in Order</h3>

              {fromCart ? (
                cartItems.map((item) => (
                  <div key={item._id} style={{ display: 'flex', gap: '16px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '10px', background: '#f8fafc', flexShrink: 0, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                      <img src={imgUrl(item.image)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{item.name}</h4>
                      <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>NPR {item.price.toLocaleString()}</p>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#6366f1' }}>Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '10px', background: '#f8fafc', flexShrink: 0, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                    <img src={imgUrl(product.image)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{product.name}</h4>
                    <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>NPR {product.price.toLocaleString()}</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={isProcessing}
                        style={{ width: '32px', height: '32px', border: 'none', background: '#f8fafc', cursor: isProcessing ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 700, color: '#64748b' }}
                      >
                        −
                      </button>
                      <span style={{ padding: '0 12px', fontWeight: 700, color: '#0f172a' }}>{quantity}</span>
                      <button
                        onClick={() => setQuantity(q => Math.min(product.quantity, q + 1))}
                        disabled={isProcessing}
                        style={{ width: '32px', height: '32px', border: 'none', background: '#f8fafc', cursor: isProcessing ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 700, color: '#64748b' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
                  <span>Subtotal</span>
                  <span>NPR {totalPrice.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
                  <span>Shipping</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>FREE</span>
                </div>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#6366f1' }}>
                  <span>Total</span>
                  <span>NPR {totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Payment & Delivery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Delivery Address */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Delivery Address</h3>
                  <button 
                    onClick={() => navigate(-1)}
                    disabled={isProcessing}
                    style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, fontSize: '13px', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                  >
                    Edit
                  </button>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  {address?.fullAddress ? (
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a', lineHeight: '1.5' }}>
                      📌 {address.fullAddress}
                    </p>
                  ) : (
                    <>
                      <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                        {address?.province}, {address?.district}
                      </p>
                      <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#64748b' }}>
                        {address?.municipality}, Ward {address?.ward}
                      </p>
                      {address?.exactLocation && (
                        <p style={{ margin: '8px 0 0', fontSize: '13px', fontStyle: 'italic', color: '#64748b' }}>
                          <strong>Note:</strong> {address.exactLocation}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Payment Method</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {["COD", "ESEWA"].map((method) => (
                    <label
                      key={method}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        border: `2px solid ${payment === method ? '#6366f1' : '#e2e8f0'}`,
                        borderRadius: '12px',
                        background: payment === method ? 'rgba(99, 102, 241, 0.04)' : '#fff',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method}
                        checked={payment === method}
                        onChange={() => setPayment(method)}
                        disabled={isProcessing}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: `2px solid ${payment === method ? '#6366f1' : '#cbd5e1'}`,
                        marginRight: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {payment === method && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#6366f1',
                          }} />
                        )}
                      </div>
                      <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
                        {method === "COD" ? "Cash on Delivery" : "eSewa Payment"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Place Order Button */}
              <button 
                onClick={handleBuyNow}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => !isProcessing && (e.target.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
              >
                {isProcessing ? "Processing..." : "Place Order"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Checkout;
