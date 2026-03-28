import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/checkout.css";

const API_BASE = "http://localhost:8000";

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
      <div className="error-container">
        <h2>No items selected for checkout.</h2>
        <button onClick={() => navigate("/")}>Go back to shop</button>
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
        alert("Order placed successfully");
        navigate("/orders");
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

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Secure Checkout</h1>
        <p>Complete your purchase by providing payment and shipping details.</p>
      </div>

      <div className="checkout-container">
        {/* LEFT COLUMN: Summary */}
        <div className="checkout-section summary-card">
          <h3>Order Summary</h3>

          {fromCart ? (
            cartItems.map((item) => (
              <div key={item._id} className="product-item">
                <div className="product-img-wrapper">
                  <img src={`${API_BASE}/${item.image}`} alt={item.name} />
                </div>
                <div className="product-info">
                  <h4>{item.name}</h4>
                  <p className="unit-price">
                    NPR {item.price.toLocaleString()}
                  </p>
                  <p style={{ marginTop: "10px", fontSize: "14px", color: "#555" }}>
                    Qty: {item.quantity}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="product-item">
              <div className="product-img-wrapper">
                <img src={`${API_BASE}/${product.image}`} alt={product.name} />
              </div>

              <div className="product-info">
                <h4>{product.name}</h4>
                <p className="unit-price">
                  NPR {product.price.toLocaleString()}
                </p>

                <div className="qty-picker">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={isProcessing}
                  >
                    −
                  </button>

                  <span>{quantity}</span>

                  <button
                    onClick={() =>
                      setQuantity(q =>
                        Math.min(product.quantity, q + 1)
                      )
                    }
                    disabled={isProcessing}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="price-breakdown">
            <div className="price-row">
              <span>Subtotal</span>
              <span>NPR {totalPrice.toLocaleString()}</span>
            </div>

            <div className="price-row">
              <span>Shipping</span>
              <span className="free">FREE</span>
            </div>

            <hr />

            <div className="price-row total">
              <span>Total</span>
              <span>NPR {totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Delivery & Payment */}
        <div className="checkout-section details-form">
          <div className="delivery-info">
            <div className="section-header">
              <h3>Delivery Address</h3>
              <button className="text-btn" onClick={() => navigate(-1)} disabled={isProcessing}>
                Edit
              </button>
            </div>

            <div className="address-display">
              {address?.fullAddress ? (
                <p className="address-main">
                  📌 {address.fullAddress}
                </p>
              ) : (
                <>
                  <p className="address-main">
                    {address?.province}, {address?.district}
                  </p>

                  <p className="address-sub">
                    {address?.municipality}, Ward {address?.ward}
                  </p>

                  {address?.exactLocation && (
                    <p className="address-exact">
                      <span>Note:</span> {address.exactLocation}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="payment-method">
            <h3>Payment Method</h3>

            <div className="payment-options">
              {["COD", "ESEWA"].map((method) => (
                <label
                  key={method}
                  className={`payment-card ${
                    payment === method ? "active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method}
                    checked={payment === method}
                    onChange={() => setPayment(method)}
                    disabled={isProcessing}
                  />
                  <div className="custom-radio"></div>
                  <span className="method-label">
                    {method === "COD" ? "Cash on Delivery" : "eSewa"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button 
            className="confirm-btn" 
            onClick={handleBuyNow}
            disabled={isProcessing}
            style={{ opacity: isProcessing ? 0.7 : 1, cursor: isProcessing ? "not-allowed" : "pointer" }}
          >
            {isProcessing ? "Processing..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
