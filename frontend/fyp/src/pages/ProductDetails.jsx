import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import { trackProductView } from "../utils/interactionTracking";
import nepalLocations from "../data/nepalLocations.json";
import "../styles/productDetails.css";
import { useCart } from "../context/CartContext";
import Rating from "../components/Rating";
import io from "socket.io-client";
import CustomerSidebar from "../components/CustomerSidebar";

import { API_BASE } from "../config/api.js";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, totalQuantity } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // User / Auth
  const [currentUser, setCurrentUser] = useState(null);

  // Delivery State
  const [location, setLocation] = useState("");
  const [locationAdded, setLocationAdded] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [ward, setWard] = useState("");
  const [exactLocation, setExactLocation] = useState("");

  // Review State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Report state
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [myReview, setMyReview] = useState(null);

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [socket, setSocket] = useState(null);
  const chatBodyRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/products/${id}`);
        const p = res.data.product;
        setProduct(p);

        // Track product view for personalized recommendations
        trackProductView(id, p.category);

        // Detect logged-in customer
        const stored = localStorage.getItem("user");
        if (stored) {
          const me = JSON.parse(stored);
          setCurrentUser(me);
          const existing = (p.reviews || []).find(
            (r) => r.user === me._id || r.user?.toString() === me._id?.toString()
          );
          if (existing) setMyReview(existing);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Handle Socket Init
  useEffect(() => {
    if (currentUser) {
      const newSocket = io(API_BASE, {
        transports: ["websocket"],
        withCredentials: true,
      });
      setSocket(newSocket);
      newSocket.emit("register", currentUser._id);

      newSocket.on("receive_message", (msg) => {
        // Only append if it's from the owner of this shop
        if (product && product.shopId && msg.senderId._id === product.shopId.ownerId) {
          setChatMessages((prev) => [...prev, msg]);
        }
      });

      newSocket.on("message_sent", (msg) => {
        setChatMessages((prev) => [...prev, msg]);
      });

      return () => newSocket.close();
    }
  }, [currentUser, product]);

  // Scroll chat down automatically
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatMessages, chatOpen]);

  const loadChatHistory = async () => {
    if (!currentUser || !product?.shopId?.ownerId) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/api/messages/${product.shopId.ownerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMessages(res.data.messages);
      
      // Mark as read over socket
      if (socket) {
        socket.emit("mark_read", { senderId: product.shopId.ownerId, receiverId: currentUser._id });
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  };

  const toggleChat = () => {
    if (!currentUser) {
      alert("Please login to chat with the shop owner.");
      return navigate("/login");
    }
    const willOpen = !chatOpen;
    setChatOpen(willOpen);
    if (willOpen) {
      loadChatHistory();
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    console.log("Chat attempt. Input:", chatInput, "Socket:", !!socket, "Shop:", product?.shopId);

    if (!chatInput.trim()) return;

    if (!socket) {
      alert("Chat connection not ready yet. Please try again or refresh.");
      return;
    }

    if (!product?.shopId) {
      alert("This product is not associated with a valid store.");
      return;
    }

    if (!product.shopId.ownerId) {
      // If shopId populated incorrectly or owner missing
      alert("Store owner information is missing for this product. (OwnerId not found in shop)");
      return;
    }

    socket.emit("send_message", {
      senderId: currentUser._id,
      receiverId: product.shopId.ownerId,
      productId: product._id,
      text: chatInput,
    });
    setChatInput("");
  };

  const handleAddLocation = () => {
    if (navigator.geolocation) {
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
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

  const handleEditClick = (rev) => {
    setEditMode(true);
    setRating(rev.rating);
    setComment(rev.comment);
    setReviewSuccess("");
    setReviewError("");
    document.getElementById("pd-review-form-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const submitReviewHandler = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewError("");
    setReviewSuccess("");

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setReviewError("Please login to write a review");
      setSubmittingReview(false);
      return;
    }

    if (rating === 0) {
      setReviewError("Please select a rating");
      setSubmittingReview(false);
      return;
    }

    if (!comment.trim()) {
      setReviewError("Please enter a comment");
      setSubmittingReview(false);
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editMode) {
        await axios.put(`${API_BASE}/api/products/${id}/reviews`, { rating, comment }, config);
        setReviewSuccess("Review updated successfully!");
      } else {
        await axios.post(`${API_BASE}/api/products/${id}/reviews`, { rating, comment }, config);
        setReviewSuccess("Review submitted successfully!");
      }

      setRating(0);
      setComment("");
      setEditMode(false);

      const res = await axios.get(`${API_BASE}/api/products/${id}`);
      const p = res.data.product;
      setProduct(p);
      if (currentUser) {
        const existing = (p.reviews || []).find(
          (r) => r.user === currentUser._id || r.user?.toString() === currentUser._id?.toString()
        );
        setMyReview(existing || null);
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitReport = async () => {
    if (!reportReason || !product) return;
    try {
      setSubmittingReport(true);
      const token = localStorage.getItem("accessToken");
      await axios.post(`${API_BASE}/api/admin/reports`, {
        targetType: "product",
        targetId: product._id,
        reason: reportReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportSent(true);
    } catch (err) {
      console.error("Failed to submit report", err);
      alert("Failed to submit report. Please try again.");
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) return <div className="pd-page"><div style={{ padding: "100px", textAlign: "center" }}>Loading product...</div></div>;
  if (!product) return <div className="pd-page"><div style={{ padding: "100px", textAlign: "center" }}>Product not found</div></div>;

  const isDropdownComplete = province && district && municipality && ward && exactLocation.trim() !== "";
  const isDeliveryComplete = isDropdownComplete || locationAdded;

  return (
    <div className="od-shell">
      <CustomerSidebar customer={currentUser || {}} />

      <div className="od-main">
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => navigate(-1)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '18px', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>←</button>
              Product Details
            </h1>
          </div>
          <div className="od-topbar__right">
            <button className="pd-cart-btn" onClick={() => navigate("/cart")} style={{ background: '#f1f5f9', border: 'none' }}>
              🛒 Cart {totalQuantity > 0 && <span className="pd-cart-badge">{totalQuantity}</span>}
            </button>
          </div>
        </header>

        <main className="od-content">
          <div className="pd-page">
            <div className="pd-breadcrumb">
              <span onClick={() => navigate("/customer-dashboard")}>Home</span>
              <span style={{ margin: '0 8px' }}>/</span>
              <span className="pd-breadcrumb__current">{product.name}</span>
            </div>

            <main className="pd-product-section" style={{ padding: 0 }}>
              {/* Column 1: Image Card & Gallery */}
              <div className="pd-image-section">
                <div className="pd-image-card">
                  <img src={imgUrl(product.image)} alt={product.name} />
                </div>
                <div className="pd-thumbnails">
                  <div className="pd-thumbnail pd-thumbnail--active">
                    <img src={imgUrl(product.image)} alt="" />
                  </div>
                  <div className="pd-thumbnail">
                    <img src={imgUrl(product.image)} alt="" />
                  </div>
                  <div className="pd-thumbnail">
                    <img src={imgUrl(product.image)} alt="" />
                  </div>
                  <div className="pd-thumbnail">
                    <img src={imgUrl(product.image)} alt="" />
                  </div>
                </div>
              </div>

              {/* Column 2: Product details and CTAs */}
              <div className="pd-details-section">
                <div className="pd-details-card">
                  <div className="pd-details-main-info">
                    <h1 className="pd-product-name">{product.name}</h1>
                    
                    <div className="pd-rating-summary">
                      <div className="pd-rating-stars-gold">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} style={{ color: star <= Math.round(product.rating || 0) ? '#f59e0b' : '#cbd5e1', fontSize: '15px' }}>★</span>
                        ))}
                      </div>
                      <span className="pd-rating-value">{(product.rating || 0).toFixed(1)}</span>
                      <span style={{ color: "var(--pd-secondary)" }}>({product.numReviews || 0} reviews)</span>
                      <span style={{ margin: '0 8px', color: '#e2e8f0' }}>|</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--pd-accent)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        🏪 Store: <span style={{ color: '#4f46e5', textDecoration: 'underline', cursor: 'pointer' }}>{product.shopId?.name || "Verified Store"}</span>
                      </span>
                    </div>
                    
                    <div className="pd-price-row">
                      <span className="pd-price">NPR {product.price?.toLocaleString()}</span>
                      <span className={`pd-stock-badge ${product.quantity > 5 ? "pd-in-stock" : "pd-low-stock"}`}>
                        {product.quantity > 5 ? "✓ In Stock" : `⚠ Only ${product.quantity} left`}
                      </span>
                    </div>

                    <p className="pd-desc">{product.description}</p>

                    <div className="pd-info-chips">
                      <div className="pd-chip pd-chip--cod">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}><path d="M20 6L9 17l-5-5"/></svg>
                        Cash on Delivery
                      </div>
                      <div className="pd-chip pd-chip--return">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                        7 Days Return
                      </div>
                      <div className="pd-chip pd-chip--shipping">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                        Free Shipping
                      </div>
                    </div>
                  </div>

                  <div className="pd-actions">
                    <button
                      onClick={() => setReportModal(true)}
                      className="pd-action-btn-report"
                      title="Report this product"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                      Report
                    </button>
                    <button className="pd-add-to-cart-btn" onClick={() => { addToCart(product); alert("Added to cart!"); }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      Add to Cart
                    </button>
                    <button
                      className="pd-buy-now-btn"
                      disabled={!isDeliveryComplete}
                      onClick={() =>
                        navigate("/checkout", {
                          state: {
                            product,
                            deliveryAddress: locationAdded
                              ? { fullAddress: location }
                              : { province, district, municipality, ward, exactLocation },
                          },
                        })
                      }
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Column 3: Delivery Options */}
              <div className="pd-delivery-section">
                <div className="pd-delivery-card">
                  <div className="pd-delivery-main-fields">
                    <h3 className="pd-delivery-title">📍 Delivery Options</h3>

                    <button
                      className={`pd-geolocation-btn ${locationAdded ? "pd-geolocation-success" : ""}`}
                      onClick={handleAddLocation}
                      disabled={geoLoading || locationAdded}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
                      Auto Detect Address
                    </button>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', textAlign: 'center', fontWeight: 500 }}>Detect your current location automatically</p>

                    {locationAdded && (
                      <div style={{ marginTop: "1rem", display: "flex", gap: "10px", alignItems: "center" }}>
                        <div className="pd-selected-address" style={{ flex: 1, margin: 0 }}>📌 {location}</div>
                        <button onClick={() => { setLocation(""); setLocationAdded(false); }} className="pd-clear-location-btn">✕</button>
                      </div>
                    )}

                    <div className="pd-or-divider">
                      OR SELECT MANUALLY
                    </div>
                  </div>

                  <div className="pd-location-dropdowns">
                    <select value={province} onChange={(e) => { setProvince(e.target.value); setDistrict(""); setMunicipality(""); setWard(""); setExactLocation(""); }} className="pd-select">
                      <option value="">Province State</option>
                      {Object.keys(nepalLocations).map((prov) => <option key={prov} value={prov}>{prov}</option>)}
                    </select>

                    <select value={district} onChange={(e) => { setDistrict(e.target.value); setMunicipality(""); setWard(""); setExactLocation(""); }} className="pd-select" disabled={!province}>
                      <option value="">District/City</option>
                      {province && Object.keys(nepalLocations[province]).map((dist) => <option key={dist} value={dist}>{dist}</option>)}
                    </select>

                    <select value={municipality} onChange={(e) => { setMunicipality(e.target.value); setWard(""); setExactLocation(""); }} className="pd-select" disabled={!district}>
                      <option value="">Municipality</option>
                      {province && district && Object.keys(nepalLocations[province][district]).map((mun) => <option key={mun} value={mun}>{mun}</option>)}
                    </select>

                    <select value={ward} onChange={(e) => setWard(e.target.value)} className="pd-select" disabled={!municipality}>
                      <option value="">Ward No.</option>
                      {province && district && municipality && nepalLocations[province][district][municipality].map((w, i) => <option key={i} value={w}>Ward {w}</option>)}
                    </select>

                    <input type="text" className="pd-select" placeholder="Street / House Number" value={exactLocation} onChange={(e) => setExactLocation(e.target.value)} disabled={!ward} />

                    {isDropdownComplete && (
                      <div className="pd-selected-address">
                        📌 {province}, {district}, {municipality}-{ward}, {exactLocation}
                      </div>
                    )}

                    <div className="pd-delivery-info-card">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                      <span>Select your delivery location for fast and accurate delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            </main>

            {/* ─── Bottom Section: Reviews, Writing Reviews & Chat ─── */}
            <div className="pd-bottom-grid">
              {/* Column 1: Customer Reviews Card */}
              <div className="pd-reviews-card" id="pd-reviews-section-anchor">
                <h2 className="pd-section-title">Customer Reviews</h2>
                
                <div className="pd-reviews-layout">
                  {/* Left Side: Average Box */}
                  <div className="pd-avg-box">
                    <span className="pd-avg-num">{(product.rating || 0).toFixed(1)}</span>
                    <Rating value={product.rating || 0} />
                    <div className="pd-avg-count">Based on {product.numReviews || 0} reviews</div>
                  </div>

                  {/* Right Side: Reviews List Feed */}
                  <div className="pd-reviews-feed-col">
                    {product.reviews?.length === 0 ? (
                      <div className="pd-empty-reviews">
                        <p>No reviews yet. Be the first to share your thoughts!</p>
                      </div>
                    ) : (
                      <div className="pd-reviews-feed">
                        {(product.reviews || []).slice(0, 3).map((rev) => {
                          const isMyReview = currentUser && (rev.user === currentUser._id || rev.user?.toString() === currentUser._id?.toString());
                          return (
                            <div key={rev._id} className="pd-review-item">
                              <div className="pd-rev-user">
                                <div className="pd-user-avatar">
                                  {rev.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="pd-rev-info">
                                  <strong>
                                    {rev.name}
                                    {isMyReview && <span className="pd-user-badge">YOU</span>}
                                  </strong>
                                  <span className="pd-rev-date">{new Date(rev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                </div>
                                <div className="pd-rev-stars">
                                  <div className="pd-rating-stars-gold">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span key={star} style={{ color: star <= rev.rating ? '#f59e0b' : '#cbd5e1', fontSize: '11px' }}>★</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <p className="pd-review-text">{rev.comment}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <button className="pd-view-all-reviews-btn">
                      View All Reviews
                    </button>
                  </div>
                </div>
              </div>

              {/* Column 2: Write a Review Form Card */}
              <div className="pd-write-review-card" id="pd-review-form-section">
                <h2 className="pd-section-title">Write a Review</h2>
                <p className="pd-write-review-subtitle">Share your experience with this product</p>
                
                {editMode && (
                  <div style={{ background: "#eff6ff", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.85rem", color: "#1e3a8a", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Updating your review.</span>
                    <button onClick={() => { setEditMode(false); setRating(0); setComment(""); setReviewError(""); setReviewSuccess(""); }} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
                  </div>
                )}
                
                {reviewSuccess && <div className="pd-alert pd-alert-success">{reviewSuccess}</div>}
                {reviewError && <div className="pd-alert pd-alert-danger">{reviewError}</div>}

                {currentUser ? (
                  <form onSubmit={submitReviewHandler} className="pd-review-form">
                    <div className="pd-form-group">
                      <label>Rating</label>
                      <div className="pd-stars-input">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`pd-star-btn ${star <= (hoverRating || rating) ? "active" : ""}`}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pd-form-group">
                      <label>Your Comment</label>
                      <textarea
                        placeholder="Share your experience with this product..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                      ></textarea>
                    </div>

                    <button type="submit" className="pd-submit-review-btn" disabled={submittingReview}>
                      {submittingReview ? "Submitting..." : editMode ? "Update Review" : "Post Review"}
                    </button>
                  </form>
                ) : (
                  <div className="pd-review-login-prompt">
                    <p>Please <span className="pd-login-link" onClick={() => navigate("/login")}>login</span> to write a review.</p>
                  </div>
                )}
              </div>

              {/* Column 3: Chat Box Card (Embedded Open Window) */}
              <div className="pd-chat-card">
                <div className="pd-chat-header-embedded">
                  <h3>💬 Chat with Shop</h3>
                  <button className="pd-chat-minimize-btn">—</button>
                </div>
                
                <div className="pd-chat-body-embedded" ref={chatBodyRef}>
                  {chatMessages.length === 0 ? (
                    <div className="pd-chat-empty-feed">
                      <div className="pd-chat-welcome-bubble">
                        Welcome! How can we help you today?
                        <span className="pd-chat-time">10:30 AM</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pd-chat-history-wrapper">
                      {chatMessages.map((msg, index) => {
                        const isMine = msg.senderId === currentUser?._id || msg.senderId?._id === currentUser?._id;
                        return (
                          <div key={msg._id || index} className={`pd-message ${isMine ? 'pd-message-outgoing' : 'pd-message-incoming'}`}>
                            {msg.text}
                            <span className="pd-message-time">10:32 AM {isMine && '✓'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <form className="pd-chat-footer-embedded" onSubmit={handleSendMessage}>
                  <input 
                    type="text" 
                    className="pd-chat-input" 
                    placeholder="Type a message..." 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="pd-chat-send-btn" disabled={!chatInput.trim()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                  </button>
                </form>
              </div>
            </div>

            {/* Bottom floating bubble badge */}
            <button className="pd-chat-widget-btn-floating" onClick={toggleChat} title="Chat with Shop Owner">
              💬
              <span className="pd-chat-floating-badge">1</span>
            </button>

            {chatOpen && (
              <div className="pd-chat-window-floating">
                <div className="pd-chat-header-floating">
                  <h3>💬 Chat with Shop</h3>
                  <button className="pd-chat-close-floating" onClick={() => setChatOpen(false)}>✕</button>
                </div>
                
                <div className="pd-chat-body-floating" ref={chatBodyRef}>
                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: '2rem' }}>
                      Start a conversation with the shop owner!
                    </div>
                  ) : (
                    chatMessages.map(msg => {
                      const isMine = msg.senderId === currentUser?._id || msg.senderId?._id === currentUser?._id;
                      return (
                        <div key={msg._id} className={`pd-message ${isMine ? 'pd-message-outgoing' : 'pd-message-incoming'}`}>
                          {msg.text}
                        </div>
                      );
                    })
                  )}
                </div>
                
                <form className="pd-chat-footer-floating" onSubmit={handleSendMessage}>
                  <input 
                    type="text" 
                    className="pd-chat-input-floating" 
                    placeholder="Type a message..." 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="pd-chat-send-floating" disabled={!chatInput.trim()}>
                    ➤
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ─── Report Product Modal ────────────────────────────────── */}
      {reportModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '20px' }}
          onClick={() => { setReportModal(false); setReportSent(false); setReportReason(''); }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(15,23,42,0.25)' }}
          >
            <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                <strong style={{ fontSize: '18px', fontWeight: 800 }}>Report Product</strong>
              </div>
              <button onClick={() => { setReportModal(false); setReportSent(false); setReportReason(''); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            <div style={{ padding: '28px 24px' }}>
              {reportSent ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                  <h3 style={{ color: '#0f172a', fontWeight: 800, margin: '0 0 8px' }}>Report Submitted</h3>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Thank you for helping keep our marketplace safe. We'll review this product shortly.</p>
                  <button onClick={() => { setReportModal(false); setReportSent(false); setReportReason(''); }} style={{ marginTop: '20px', background: '#6366f1', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>Done</button>
                </div>
              ) : (
                <>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px', lineHeight: 1.6 }}>
                    Reporting <strong style={{ color: '#0f172a' }}>{product?.name}</strong>. Please select a reason:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {['Counterfeit product', 'Inappropriate or offensive content', 'Misleading description', 'Defective or broken item', 'Other'].map(reason => (
                      <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', border: `1.5px solid ${reportReason === reason ? '#ef4444' : '#e2e8f0'}`, background: reportReason === reason ? '#fef2f2' : '#f8fafc', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#0f172a', transition: 'all 0.15s' }}>
                        <input type="radio" name="report" value={reason} checked={reportReason === reason} onChange={() => setReportReason(reason)} style={{ accentColor: '#ef4444' }} />
                        {reason}
                      </label>
                    ))}
                  </div>
                  <button
                    disabled={!reportReason || submittingReport}
                    onClick={submitReport}
                    style={{ width: '100%', padding: '13px', background: reportReason ? 'linear-gradient(135deg, #ef4444, #dc2626)' : '#e2e8f0', color: reportReason ? '#fff' : '#94a3b8', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: reportReason ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
                  >
                    {submittingReport ? "Submitting..." : "Submit Report"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetails;
