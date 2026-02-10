import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/checkout.css";

const API_BASE = "http://localhost:8000";

const Checkout = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const product = state?.product;
  const address = state?.deliveryAddress;

  const [quantity, setQuantity] = useState(1);
  const [payment, setPayment] = useState("COD");

  if (!product) {
    return (
      <div className="error-container">
        <h2>No product selected.</h2>
        <button onClick={() => navigate("/")}>Go back to shop</button>
      </div>
    );
  }

  const totalPrice = product.price * quantity;

  const handleConfirmOrder = async () => {
    const orderData = {
      productId: product._id,
      quantity,
      totalPrice,
      deliveryAddress: address,
      paymentMethod: payment,
    };
    console.log("Order data:", orderData);
    navigate("/order-success", { state: { order: orderData } });
  };

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
          <div className="product-item">
            <div className="product-img-wrapper">
              <img src={`${API_BASE}/${product.image}`} alt={product.name} />
            </div>
            <div className="product-info">
              <h4>{product.name}</h4>
              <p className="unit-price">NPR {product.price.toLocaleString()}</p>
              
              <div className="qty-picker">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)}>+</button>
              </div>
            </div>
          </div>

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
              <button className="text-btn" onClick={() => navigate(-1)}>Edit</button>
            </div>
            <div className="address-display">
              <p className="address-main">
                {address?.province}, {address?.district}
              </p>
              <p className="address-sub">
                {address?.municipality}, Ward {address?.ward}
              </p>
              {address?.exactLocation && (
                <p className="address-exact"><span>Note:</span> {address.exactLocation}</p>
              )}
            </div>
          </div>

          <div className="payment-method">
            <h3>Payment Method</h3>
            <div className="payment-options">
              {["COD", "ESEWA", "KHALTI"].map((method) => (
                <label key={method} className={`payment-card ${payment === method ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="payment"
                    value={method}
                    checked={payment === method}
                    onChange={() => setPayment(method)}
                  />
                  <div className="custom-radio"></div>
                  <span className="method-label">
                    {method === "COD" ? "Cash on Delivery" : method}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button className="confirm-btn" onClick={handleConfirmOrder}>
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;