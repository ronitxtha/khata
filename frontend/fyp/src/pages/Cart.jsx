import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CustomerSidebar from "../components/CustomerSidebar";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import nepalLocations from "../data/nepalLocations.json";
import "../styles/customerLayout.css";
import "../styles/cart.css";

const API_BASE = "http://localhost:8000";

const Cart = () => {
  const { cart, totalQuantity, totalPrice, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);

  // Geographic state
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

  // Get user's location if not already added
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
            const fullAddress = res.data.display_name || city;
            setLocation(fullAddress);
            setLocationAdded(true);
          } catch (err) {
            console.error(err);
            setLocation("Location not available");
          } finally {
            setGeoLoading(false);
          }
        },
        (err) => {
          console.error(err);
          setLocation("Location not available");
          setGeoLoading(false);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    } else {
      setLocation("Geolocation not supported");
    }
  };

  // Fetch customer info for navbar
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

  const avatarSrc = customerInfo?.profileImage ? imgUrl(customerInfo.profileImage) : null;

  return (
    <div className="sd-layout od-modern-layout">
      <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className={`sd-main od-main-content ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        {/* TOP NAVBAR */}
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
              <h1>Shopping Cart</h1>
              <span className="sd-navbar__subtitle">Review and checkout your selected items</span>
            </div>
          </div>
          
          <div className="sd-navbar__right">
            <button className="od-nav-icon-btn" style={{ marginRight: '16px' }}>🔔</button>
            <div className="sd-avatar">
              {avatarSrc ? (
                <img 
                  src={avatarSrc} 
                  alt="Profile" 
                  style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} 
                />
              ) : (
                <span>C</span>
              )}
            </div>
            <div className="sd-navbar__staff-info">
              <span className="sd-navbar__name">{customerInfo?.user?.name || "Customer"}</span>
              <span className="sd-navbar__role">Verified Account</span>
            </div>
          </div>
        </header>

        <main className="sd-content od-content">
          <div className="si-header-section" style={{ marginBottom: '32px' }}>
            <div className="si-header-info">
              <h2>My Cart</h2>
              <p>You have {totalQuantity} item{totalQuantity !== 1 ? "s" : ""} in your bag.</p>
            </div>
            {cart.length > 0 && (
              <Link to="/customer-dashboard" className="show-all-btn" style={{ textDecoration: 'none' }}>
                ← Continue Shopping
              </Link>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="si-ledger-table-wrap" style={{ padding: '80px 40px', textAlign: 'center', marginBottom: '32px' }}>
              <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Your Cart is Empty</h2>
              <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '32px' }}>Explore our collection to add something special.</p>
              <Link to="/customer-dashboard" className="buy-btn" style={{ maxWidth: '240px', margin: '0 auto', display: 'block', textDecoration: 'none' }}>Start Shopping</Link>
            </div>
          ) : (
            <div className="cart-grid-system">
              <div className="cart-items-column">
                <div className="cart-list-header">
                  <span>Product Details</span>
                  <span>Quantity & Actions</span>
                </div>
                
                {cart.map((item) => (
                  <div key={item._id} className="cart-item-card">
                    <div className="cart-item-image-wrap">
                      <img 
                        src={item.image ? imgUrl(item.image) : "https://via.placeholder.com/100"} 
                        alt={item.name} 
                      />
                    </div>
                    
                    <div className="cart-item-info">
                      <div className="item-main-details">
                        <h3>{item.name}</h3>
                        <div className="price-tag">NPR {item.price.toLocaleString()}</div>
                      </div>
                      
                      <div className="cart-item-bottom-actions">
                        <div className="si-ledger-qty-wrap">
                          <button 
                            className="qty-control-btn" 
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="qty-count">{item.quantity}</span>
                          <button 
                            className="qty-control-btn" 
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        
                        <button 
                          className="remove-link-btn" 
                          onClick={() => removeFromCart(item._id)}
                        >
                          🗑️ REMOVE
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary-column">
                <div className="si-ledger-table-wrap" style={{ padding: '24px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>Order Summary</h2>
                  
                  <div className="summary-data-row">
                    <span>Subtotal:</span>
                    <span>NPR {totalPrice.toLocaleString()}</span>
                  </div>
                  
                  <div className="summary-data-row" style={{ paddingBottom: '20px', borderBottom: '1px solid #f8fafc' }}>
                    <span>Shipping:</span>
                    <span style={{ color: '#94a3b8' }}>Calculated later</span>
                  </div>

                  <div className="total-data-row">
                    <span>Payable Total:</span>
                    <span>NPR {totalPrice.toLocaleString()}</span>
                  </div>

                  <div className="delivery-step-box">
                    <h3 className="section-mini-title">📍 Delivery Address <span style={{ color: '#ef4444' }}>*</span></h3>
                    
                    <button
                      className={`geo-modern-btn ${locationAdded ? "selected" : ""}`}
                      onClick={handleAddLocation}
                      disabled={geoLoading || locationAdded}
                    >
                       {geoLoading ? "⏳ DETECTING..." : locationAdded ? "✅ LOCATION DETECTED" : "📍 USE MY LOCATION"}
                    </button>
                    
                    {locationAdded && (
                      <div className="detected-location-badge">
                        <p>{location}</p>
                        <button onClick={() => { setLocation(""); setLocationAdded(false); }}>✕</button>
                      </div>
                    )}
                    
                    <div className="selection-divider">
                      <span>OR SELECT MANUALLY</span>
                    </div>

                    <select value={province} onChange={(e) => { setProvince(e.target.value); setDistrict(""); setMunicipality(""); setWard(""); setExactLocation(""); }} className="modern-select">
                      <option value="">Select Province</option>
                      {Object.keys(nepalLocations).map((prov) => <option key={prov} value={prov}>{prov}</option>)}
                    </select>

                    <select value={district} onChange={(e) => { setDistrict(e.target.value); setMunicipality(""); setWard(""); setExactLocation(""); }} disabled={!province} className="modern-select">
                      <option value="">Select District</option>
                      {province && Object.keys(nepalLocations[province]).map((dist) => <option key={dist} value={dist}>{dist}</option>)}
                    </select>

                    <select value={municipality} onChange={(e) => { setMunicipality(e.target.value); setWard(""); setExactLocation(""); }} disabled={!district} className="modern-select">
                      <option value="">Select Municipality</option>
                      {province && district && Object.keys(nepalLocations[province][district]).map((mun) => <option key={mun} value={mun}>{mun}</option>)}
                    </select>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <select value={ward} onChange={(e) => setWard(e.target.value)} disabled={!municipality} className="modern-select" style={{ flex: '0 0 90px', marginBottom: 0 }}>
                        <option value="">Ward</option>
                        {province && district && municipality && nepalLocations[province][district][municipality].map((w, i) => <option key={i} value={w}>{w}</option>)}
                      </select>
                      <input type="text" placeholder="Street Address" value={exactLocation} onChange={(e) => setExactLocation(e.target.value)} disabled={!ward} className="modern-input" style={{ flex: 1 }} />
                    </div>
                  </div>

                  <button 
                    className="premium-btn" 
                    disabled={!isDeliveryComplete}
                    style={{ width: '100%', opacity: isDeliveryComplete ? 1 : 0.4 }}
                    onClick={() => {
                      navigate("/checkout", { 
                        state: { 
                          fromCart: true, 
                          cartItems: cart, 
                          totalAmount: totalPrice,
                          deliveryAddress: locationAdded
                            ? { fullAddress: location }
                            : { province, district, municipality, ward, exactLocation }
                        } 
                      });
                    }}
                  >
                    PROCEED TO CHECKOUT
                  </button>
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
