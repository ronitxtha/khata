import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CustomerSidebar from "../components/CustomerSidebar";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import nepalLocations from "../data/nepalLocations.json";
import "../styles/ownerDashboard.css";
import { API_BASE } from "../config/api.js";

const Cart = () => {
  const { cart, totalQuantity, totalPrice, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const [customerInfo, setCustomerInfo] = useState(null);

  const [location, setLocation] = useState("");
  const [locationAdded, setLocationAdded] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [ward, setWard] = useState("");
  const [exactLocation, setExactLocation] = useState("");

  const isDropdownComplete = province && district && municipality && ward && exactLocation.trim() !== "";
  const isDeliveryComplete = isDropdownComplete || locationAdded;

  const handleAddLocation = () => {
    if (navigator.geolocation) {
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const addr = res.data.address;
            const city = addr.city || addr.town || addr.village || "Unknown place";
            setLocation(res.data.display_name || city);
            setLocationAdded(true);
          } catch (err) {
            setLocation("Location not available");
          } finally {
            setGeoLoading(false);
          }
        },
        () => { setLocation("Location not available"); setGeoLoading(false); },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    } else {
      setLocation("Geolocation not supported");
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const res = await axios.get(`${API_BASE}/api/customer/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCustomerInfo(res.data.customer);
      } catch (err) {
        console.error("Failed to fetch customer profile", err);
      }
    };
    fetchProfile();
  }, []);

  const sel = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'inherit',
    color: '#0f172a', background: '#fff', marginBottom: '10px',
    outline: 'none', cursor: 'pointer'
  };

  const currentUser = customerInfo || JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="od-shell">
      <CustomerSidebar customer={currentUser} />

      <div className="od-main">
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">Shopping Cart</h1>
            <div className="od-topbar__date">Review and checkout your selected items</div>
          </div>
          <div className="od-topbar__right">
            <div className="od-topbar__profile" onClick={() => navigate("/customer-profile")}>
              <div className="od-topbar__avatar">
                {currentUser?.profileImage
                  ? <img src={imgUrl(currentUser.profileImage)} alt="avatar" />
                  : <span>{(currentUser?.username || "C")[0].toUpperCase()}</span>}
              </div>
            </div>
            <button className="od-topbar__logout" onClick={() => navigate("/customer-dashboard")} title="Continue Shopping">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
          </div>
        </header>

        <main className="od-content" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexShrink: 0 }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>My Cart</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 500 }}>
                {totalQuantity} item{totalQuantity !== 1 ? "s" : ""} in your bag
              </p>
            </div>
            {cart.length > 0 && (
              <Link to="/customer-dashboard" style={{ color: '#6366f1', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
                ← Continue Shopping
              </Link>
            )}
          </div>

          {cart.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '80px 40px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '52px', marginBottom: '16px' }}>🛒</div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Your Cart is Empty</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>Explore our collection to add something special.</p>
              <Link to="/customer-dashboard" style={{ background: '#6366f1', color: '#fff', padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
                Browse Marketplace →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '24px', alignItems: 'start' }}>

              {/* CART ITEMS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '10px 20px', background: '#f8fafc', borderRadius: '10px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', position: 'sticky', top: '24px', zIndex: 1 }}>
                  <span>Product Details</span>
                  <span>Qty & Actions</span>
                </div>

                {cart.map((item) => (
                  <div key={item._id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ width: '72px', height: '72px', borderRadius: '10px', background: '#f8fafc', flexShrink: 0, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                      <img src={item.image ? imgUrl(item.image) : "https://via.placeholder.com/100"} alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'darken' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h3>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#6366f1' }}>NPR {item.price.toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={{ width: '32px', height: '32px', border: 'none', background: '#f8fafc', cursor: 'pointer', fontSize: '16px', fontWeight: 700, color: '#64748b' }}>−</button>
                        <span style={{ padding: '0 14px', fontWeight: 800, fontSize: '14px', color: '#0f172a', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', lineHeight: '32px' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ width: '32px', height: '32px', border: 'none', background: '#f8fafc', cursor: 'pointer', fontSize: '16px', fontWeight: 700, color: '#64748b' }}>+</button>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', minWidth: '90px', textAlign: 'right' }}>
                        NPR {(item.price * item.quantity).toLocaleString()}
                      </div>
                      <button onClick={() => removeFromCart(item._id)} title="Remove"
                        style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ORDER SUMMARY */}
              <div style={{ display: 'flex', flexDirection: 'column', position: 'sticky', top: '24px' }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Order Summary</h2>
                  </div>
                  <div style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
                      <span>Subtotal ({totalQuantity} items)</span>
                      <span style={{ color: '#0f172a', fontWeight: 700 }}>NPR {totalPrice.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: '#64748b', fontWeight: 500, paddingBottom: '16px', borderBottom: '1px dashed #e2e8f0' }}>
                      <span>Shipping</span>
                      <span style={{ color: '#94a3b8' }}>Calculated later</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                      <span>Payable Total</span>
                      <span style={{ color: '#6366f1' }}>NPR {totalPrice.toLocaleString()}</span>
                    </div>

                    {/* Delivery */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        📍 Delivery Address <span style={{ color: '#ef4444' }}>*</span>
                      </div>
                      <button onClick={handleAddLocation} disabled={geoLoading || locationAdded}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', marginBottom: '12px', background: locationAdded ? '#f0fdf4' : '#ede9fe', color: locationAdded ? '#15803d' : '#6366f1', border: `1px solid ${locationAdded ? '#bbf7d0' : '#ddd6fe'}`, fontWeight: 700, fontSize: '13px', cursor: locationAdded ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                        {geoLoading ? "⏳ Detecting..." : locationAdded ? "✅ Location Detected" : "📍 Use My Location"}
                      </button>

                      {locationAdded && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <p style={{ fontSize: '12px', color: '#166534', margin: 0, flex: 1, lineHeight: 1.5 }}>{location}</p>
                          <button onClick={() => { setLocation(""); setLocationAdded(false); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#94a3b8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                        <span>OR SELECT MANUALLY</span>
                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                      </div>

                      <select value={province} onChange={(e) => { setProvince(e.target.value); setDistrict(""); setMunicipality(""); setWard(""); setExactLocation(""); }} style={sel}>
                        <option value="">Select Province</option>
                        {Object.keys(nepalLocations).map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <select value={district} onChange={(e) => { setDistrict(e.target.value); setMunicipality(""); setWard(""); setExactLocation(""); }} disabled={!province} style={sel}>
                        <option value="">Select District</option>
                        {province && Object.keys(nepalLocations[province]).map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select value={municipality} onChange={(e) => { setMunicipality(e.target.value); setWard(""); setExactLocation(""); }} disabled={!district} style={sel}>
                        <option value="">Select Municipality</option>
                        {province && district && Object.keys(nepalLocations[province][district]).map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <select value={ward} onChange={(e) => setWard(e.target.value)} disabled={!municipality} style={{ ...sel, flex: '0 0 90px', marginBottom: 0 }}>
                          <option value="">Ward</option>
                          {province && district && municipality && nepalLocations[province][district][municipality].map((w, i) => <option key={i} value={w}>{w}</option>)}
                        </select>
                        <input type="text" placeholder="Street Address" value={exactLocation} onChange={(e) => setExactLocation(e.target.value)} disabled={!ward}
                          style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'inherit', color: '#0f172a', background: '#fff', outline: 'none' }} />
                      </div>
                    </div>

                    <button disabled={!isDeliveryComplete}
                      onClick={() => navigate("/checkout", { state: { fromCart: true, cartItems: cart, totalAmount: totalPrice, deliveryAddress: locationAdded ? { fullAddress: location } : { province, district, municipality, ward, exactLocation } } })}
                      style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: isDeliveryComplete ? '#6366f1' : '#e2e8f0', color: isDeliveryComplete ? '#fff' : '#94a3b8', fontWeight: 800, fontSize: '14px', cursor: isDeliveryComplete ? 'pointer' : 'not-allowed', fontFamily: 'inherit', letterSpacing: '0.5px', transition: 'all 0.2s', boxShadow: isDeliveryComplete ? '0 4px 14px rgba(99,102,241,0.3)' : 'none', marginTop: '4px' }}>
                      PROCEED TO CHECKOUT →
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Cart;
