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
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);

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
        setSelectedImgIdx(0);
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

  // Auto-load chat history when user and product are both ready (for embedded panel)
  useEffect(() => {
    if (currentUser?._id && product?.shopId?.ownerId) {
      loadChatHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id, product?.shopId?.ownerId]);

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
            <div className="pd-breadcrumb" style={{ padding: '0 0 1rem 0' }}>
              <span onClick={() => navigate("/customer-dashboard")}>Home</span>
              <span style={{ margin: '0 8px' }}>/</span>
              <span className="pd-breadcrumb__current">{product.name}</span>
            </div>

            <main className="pd-product-section" style={{ padding: 0 }}>
              {/* ── Col 1: Product Image ── */}
              <div className="pd-image-section">
                {(() => {
                  const images = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
                  const activeImage = images[selectedImgIdx] || product.image;
                  return (
                    <>
                      <div className="pd-image-card">
                        <img src={imgUrl(activeImage)} alt={product.name} />
                      </div>
                      {images.length > 1 && (
                        <div className="pd-image-thumbnails-gallery">
                          {images.map((img, idx) => (
                            <div 
                              key={idx} 
                              className={`pd-image-thumbnail-item ${idx === selectedImgIdx ? "active" : ""}`}
                              onClick={() => setSelectedImgIdx(idx)}
                            >
                              <img src={imgUrl(img)} alt={`Thumbnail ${idx + 1}`} />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* ── Col 2: Product Details + Action Buttons ── */}
              <div className="pd-details-section">
                <div className="pd-details-card">
                  <h1 className="pd-product-name">{product.name}</h1>

                  <div className="pd-rating-summary">
                    <Rating value={product.rating || 0} />
                    <span style={{ color: "var(--pd-secondary)", fontSize: "0.85rem" }}>({product.numReviews || 0} reviews)</span>
                    {product.shopId?.name && (
                      <>
                        <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--pd-secondary)' }}>
                          🏪 Store: <strong style={{ color: 'var(--pd-primary)' }}>{product.shopId.name}</strong>
                        </span>
                      </>
                    )}
                  </div>

                  <div className="pd-price-row">
                    <span className="pd-price">NPR {product.price?.toLocaleString()}</span>
                    <span className={`pd-stock-badge ${product.quantity > 5 ? "pd-in-stock" : "pd-low-stock"}`}>
                      {product.quantity > 5 ? "✓ In Stock" : `⚠ Only ${product.quantity} left`}
                    </span>
                  </div>

                  <p className="pd-desc">{product.description}</p>

                  <div className="pd-info-chips">
                    <div className="pd-chip">✅ Cash on Delivery</div>
                    <div className="pd-chip">🔄 7 Days Return</div>
                    <div className="pd-chip">🚚 Free Shipping</div>
                  </div>
                </div>

                {/* Action row: Report | Add to Cart | Buy Now */}
                <div className="pd-actions">
                  <button onClick={() => setReportModal(true)} className="pd-report-btn" title="Report this product">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                    Report
                  </button>
                  <button className="pd-add-cart" onClick={() => { addToCart(product); alert("Added to cart!"); }}>
                    🛒 Add to Cart
                  </button>
                  <button
                    className="pd-buy-now"
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
                    ⚡ Buy Now
                  </button>
                </div>
              </div>

              {/* ── Col 3: Delivery Options ── */}
              <div className="pd-delivery-card pd-delivery-sticky">
                <h3 className="pd-delivery-title">📍 Delivery Options</h3>

                <button
                  className={`pd-geolocation-btn ${locationAdded ? "pd-geolocation-success" : ""}`}
                  onClick={handleAddLocation}
                  disabled={geoLoading || locationAdded}
                >
                  {geoLoading ? "⏳ Detecting..." : locationAdded ? "✅ Location detected" : "📍 Auto Detect Address"}
                </button>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', margin: '0.4rem 0 0' }}>
                  Detect your current location automatically
                </p>

                {locationAdded && (
                  <div style={{ marginTop: "0.75rem", display: "flex", gap: "8px", alignItems: "center" }}>
                    <div className="pd-selected-address" style={{ flex: 1, margin: 0, fontSize: '0.75rem' }}>📌 {location}</div>
                    <button onClick={() => { setLocation(""); setLocationAdded(false); }} style={{ padding: "6px 8px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "8px", cursor: "pointer", flexShrink: 0 }}>✕</button>
                  </div>
                )}

                <div style={{ textAlign: "center", margin: "0.9rem 0 0.6rem", color: "#94a3b8", fontSize: "0.7rem", fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  — OR SELECT MANUALLY —
                </div>

                <div className="pd-delivery-dropdowns">
                  <select value={province} onChange={(e) => { setProvince(e.target.value); setDistrict(""); setMunicipality(""); setWard(""); setExactLocation(""); }} className="pd-select">
                    <option value="">Province State</option>
                    {Object.keys(nepalLocations).map((prov) => <option key={prov} value={prov}>{prov}</option>)}
                  </select>
                  <select value={district} onChange={(e) => { setDistrict(e.target.value); setMunicipality(""); setWard(""); setExactLocation(""); }} className="pd-select" disabled={!province}>
                    <option value="">District / City</option>
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
                </div>

                {!isDeliveryComplete && (
                  <div style={{ marginTop: '0.75rem', padding: '0.55rem 0.85rem', background: 'linear-gradient(135deg, #ede9fe, #dbeafe)', borderRadius: '8px', fontSize: '0.72rem', color: 'var(--pd-accent)', fontWeight: 600, border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📍 Select your delivery location for fast and accurate delivery
                  </div>
                )}
              </div>
            </main>

            <section className="pd-reviews-section" style={{ padding: '0 0 2rem 0' }}>
              <div className="pd-reviews-header">
                <h2>Customer Reviews</h2>
              </div>

              <div className="pd-reviews-grid">
                {/* ── Col 1: Customer Reviews List ── */}
                <div className="pd-reviews-list">
                  <div className="pd-avg-box" style={{ marginBottom: "1.5rem" }}>
                    <span className="pd-avg-num">{(product.rating || 0).toFixed(1)}</span>
                    <div>
                      <Rating value={product.rating || 0} />
                      <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "4px" }}>Based on {product.numReviews || 0} reviews</div>
                    </div>
                  </div>

                  {product.reviews?.length === 0 ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "12px" }}>
                      <p>No reviews yet. Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    <div>
                      {(product.reviews || []).map((rev) => {
                        const isMyReview = currentUser && (rev.user === currentUser._id || rev.user?.toString() === currentUser._id?.toString());
                        return (
                          <div key={rev._id} className="pd-review-item" style={isMyReview ? { background: "#eff6ff", padding: "1rem", borderRadius: "12px", border: "none" } : {}}>
                            <div className="pd-rev-user">
                              <div className="pd-user-avatar" style={isMyReview ? { background: "var(--pd-accent)", color: "white" } : {}}>
                                {rev.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="pd-rev-info">
                                <strong>{rev.name} {isMyReview && <span style={{ background: "var(--pd-accent)", color: "white", padding: "2px 6px", fontSize: "10px", borderRadius: "10px", marginLeft: "6px" }}>YOU</span>}</strong>
                                <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{new Date(rev.createdAt).toLocaleDateString()}</span>
                              </div>
                              {isMyReview && (
                                <button onClick={() => handleEditClick(rev)} style={{ marginLeft: "auto", background: "white", border: "1px solid var(--pd-accent)", color: "var(--pd-accent)", padding: "3px 10px", borderRadius: "8px", fontSize: "0.78rem", cursor: "pointer", fontWeight: "600" }}>
                                  Edit
                                </button>
                              )}
                            </div>
                            <div style={{ marginTop: "0.4rem" }}>
                              <Rating value={rev.rating} />
                              <p style={{ margin: "0.4rem 0 0", fontSize: "0.88rem", color: "#334155", lineHeight: "1.5" }}>{rev.comment}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Col 2: Write a Review ── */}
                <div className="pd-write-review" id="pd-review-form-section">
                  <div className="pd-write-card">
                    <h3 style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "0.4rem" }}>
                      {editMode ? "Edit Your Review" : myReview ? "Your Review" : "Write a Review"}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--pd-secondary)', marginBottom: '1.1rem' }}>Share your experience with this product</p>

                    {editMode && (
                      <div style={{ background: "#eff6ff", padding: "0.75rem", borderRadius: "10px", fontSize: "0.82rem", color: "#1e3a8a", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Updating your review.</span>
                        <button onClick={() => { setEditMode(false); setRating(0); setComment(""); setReviewError(""); setReviewSuccess(""); }} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
                      </div>
                    )}

                    {reviewSuccess && <div style={{ background: "#dcfce7", color: "#166534", padding: "0.75rem", borderRadius: "10px", marginBottom: "0.75rem", fontSize: "0.85rem" }}>{reviewSuccess}</div>}
                    {reviewError && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem", borderRadius: "10px", marginBottom: "0.75rem", fontSize: "0.85rem" }}>{reviewError}</div>}

                    {currentUser ? (
                      <form onSubmit={submitReviewHandler} className="pd-review-form">
                        <div style={{ marginBottom: "1.1rem" }}>
                          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "600", fontSize: "0.85rem" }}>Rating</label>
                          <div className="pd-stars-input">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={`pd-star-btn ${star <= (hoverRating || rating) ? "active" : ""}`} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)}>★</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginBottom: "1.1rem" }}>
                          <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "600", fontSize: "0.85rem" }}>Your Comment</label>
                          <textarea placeholder="Share your experience with this product..." value={comment} onChange={(e) => setComment(e.target.value)} required></textarea>
                        </div>
                        <button type="submit" className="pd-submit-review" disabled={submittingReview} style={{ width: "100%" }}>
                          {submittingReview ? "Submitting..." : editMode ? "Update Review" : "Post Review"}
                        </button>
                      </form>
                    ) : (
                      <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                        <p style={{ color: "#64748b", fontSize: '0.9rem' }}>
                          Please <button onClick={() => navigate("/login")} style={{ background: 'none', border: 'none', color: 'var(--pd-accent)', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: '0.9rem' }}>login</button> to write a review.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Col 3: Embedded Chat Panel ── */}
                <div className="pd-chat-panel">
                  <div className="pd-chat-header" style={{ borderRadius: '14px 14px 0 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>💬</span>
                      <h3>Chat with Shop</h3>
                    </div>
                    <span style={{ opacity: 0.7, fontSize: '1.1rem' }}>—</span>
                  </div>

                  <div className="pd-chat-body" ref={chatBodyRef}>
                    {!currentUser ? (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Login to chat with the shop owner</p>
                        <button onClick={() => navigate('/login')} className="pd-buy-now" style={{ padding: '0.55rem 1.25rem', fontSize: '0.82rem' }}>Login</button>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem', marginTop: '2rem' }}>
                        Start a conversation with the shop owner!
                      </div>
                    ) : (
                      chatMessages.map(msg => {
                        const isMine = msg.senderId === currentUser._id || msg.senderId?._id === currentUser._id;
                        return (
                          <div key={msg._id} className={`pd-message ${isMine ? 'pd-message-outgoing' : 'pd-message-incoming'}`}>
                            {msg.text}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {currentUser && (
                    <form className="pd-chat-footer" onSubmit={handleSendMessage} style={{ borderRadius: '0 0 14px 14px' }}>
                      <input
                        type="text"
                        className="pd-chat-input"
                        placeholder="Type a message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                      />
                      <button type="submit" className="pd-chat-send" disabled={!chatInput.trim()}>➤</button>
                    </form>
                  )}
                </div>
              </div>
            </section>
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
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
