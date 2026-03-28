import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CustomerSidebar from "../components/CustomerSidebar";
import axios from "axios";
import nepalLocations from "../data/nepalLocations.json";
import { User, Bell, Search } from "lucide-react";
import "../styles/customerLayout.css"; // Modern Glassmorphic UI 
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

  const avatarSrc = customerInfo?.profileImage ? `${API_BASE}/${customerInfo.profileImage}` : null;

  return (
    <div className="cd-layout">
      <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className={`cd-main ${sidebarOpen ? "cd-main--shifted" : ""}`}>
        {/* NAVBAR */}
        <header className="cd-navbar">
          <div className="cd-navbar__left">
            <h2>Shopping Cart</h2>
            <p>Review and checkout your selected items</p>
          </div>
          
          <div className="cd-global-search">
            <Search size={18} color="#a3aed1" />
            <input 
              type="text" 
              placeholder="Search products, stores..." 
            />
          </div>

          <div className="cd-navbar__right">
            <button className="cd-icon-btn">
              <Bell size={20} />
            </button>
            <div className="cd-profile-menu">
              {avatarSrc ? (
                <img 
                  src={avatarSrc} 
                  alt="Profile" 
                  className="cd-profile-icon" 
                  style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover" }} 
                />
              ) : (
                <div className="cd-profile-icon"><User size={20} /></div>
              )}
            </div>
          </div>
        </header>

        <main className="cd-content">
          <div className="cd-panel">
            {cart.length === 0 ? (
              <div className="cart-page cart-page-empty">
                <div className="empty-cart">
                  <h2>Your Cart is Empty</h2>
                  <p>Looks like you haven't added anything to your cart yet.</p>
                  <Link to="/" className="shop-now-btn">Start Shopping</Link>
                </div>
              </div>
            ) : (
              <div className="cart-page">
                <div className="cart-header">
                  <h1>Items ({totalQuantity})</h1>
                  <Link to="/" className="continue-shopping">
                    ← Continue Shopping
                  </Link>
                </div>

                <div className="cart-container">
                  <div className="cart-items">
                    {cart.map((item) => (
                      <div key={item._id} className="cart-item">
                        <img 
                          src={item.image ? `${API_BASE}/${item.image}` : "https://via.placeholder.com/100"} 
                          alt={item.name} 
                          className="cart-item-image" 
                        />
                        
                        <div className="cart-item-details">
                          <h3 className="cart-item-title">{item.name}</h3>
                          <p className="cart-item-price">NPR {item.price.toLocaleString()}</p>
                          
                          <div className="cart-item-actions">
                            <div className="quantity-controls">
                              <button 
                                className="quantity-btn" 
                                onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              >
                                -
                              </button>
                              <span className="quantity-value">{item.quantity}</span>
                              <button 
                                className="quantity-btn" 
                                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                            
                            <button 
                              className="remove-btn" 
                              onClick={() => removeFromCart(item._id)}
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="cart-summary">
                    <h2 className="summary-title">Order Summary</h2>
                    
                    <div className="summary-row">
                      <span>Items ({totalQuantity}):</span>
                      <span>NPR {totalPrice.toLocaleString()}</span>
                    </div>
                    
                    <div className="summary-row">
                      <span>Shipping:</span>
                      <span>Calculated at checkout</span>
                    </div>

                    <div className="summary-total">
                      <span>Total:</span>
                      <span>NPR {totalPrice.toLocaleString()}</span>
                    </div>

                    <div className="cart-delivery-picker" style={{ marginTop: '20px', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>📍 Delivery Address <span style={{color: 'red'}}>*</span></h3>
                      
                      <button
                        className={`pd-geolocation-btn ${locationAdded ? "pd-geolocation-success" : ""}`}
                        style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd', background: locationAdded ? '#e6f4ea' : '#fff', cursor: 'pointer' }}
                        onClick={handleAddLocation}
                        disabled={geoLoading || locationAdded}
                      >
                         {geoLoading ? "⏳ Detecting location..." : locationAdded ? "✅ Location detected" : "📍 Use My Location"}
                      </button>
                      
                      {locationAdded && (
                        <div style={{ marginBottom: '10px', background: '#f0fdf4', padding: '10px', borderRadius: '4px', fontSize: '14px' }}>
                          <p>📌 <b>{location}</b></p>
                          <button onClick={() => { setLocation(""); setLocationAdded(false); }} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', marginTop: '5px', padding: 0 }}>✕ Clear</button>
                        </div>
                      )}
                      
                      <div className="pd-location-divider" style={{ textAlign: 'center', margin: '15px 0', color: '#888', fontSize: '14px' }}>
                        <span>OR select manually</span>
                      </div>

                      <select value={province} onChange={(e) => { setProvince(e.target.value); setDistrict(""); setMunicipality(""); setWard(""); setExactLocation(""); }} style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                        <option value="">Select Province</option>
                        {Object.keys(nepalLocations).map((prov) => <option key={prov} value={prov}>{prov}</option>)}
                      </select>

                      <select value={district} onChange={(e) => { setDistrict(e.target.value); setMunicipality(""); setWard(""); setExactLocation(""); }} disabled={!province} style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                        <option value="">Select District</option>
                        {province && Object.keys(nepalLocations[province]).map((dist) => <option key={dist} value={dist}>{dist}</option>)}
                      </select>

                      <select value={municipality} onChange={(e) => { setMunicipality(e.target.value); setWard(""); setExactLocation(""); }} disabled={!district} style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                        <option value="">Select Municipality</option>
                        {province && district && Object.keys(nepalLocations[province][district]).map((mun) => <option key={mun} value={mun}>{mun}</option>)}
                      </select>

                      <select value={ward} onChange={(e) => setWard(e.target.value)} disabled={!municipality} style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                        <option value="">Select Ward</option>
                        {province && district && municipality && nepalLocations[province][district][municipality].map((w, i) => <option key={i} value={w}>{w}</option>)}
                      </select>

                      <input type="text" placeholder="Enter exact location / street" value={exactLocation} onChange={(e) => setExactLocation(e.target.value)} disabled={!ward} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>

                    <button 
                      className="checkout-btn" 
                      disabled={!isDeliveryComplete}
                      style={{ opacity: isDeliveryComplete ? 1 : 0.5, cursor: isDeliveryComplete ? "pointer" : "not-allowed", marginTop: '0px' }}
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
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Cart;
