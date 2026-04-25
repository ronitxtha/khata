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

const API_BASE = "http://localhost:8000";

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
      const newSocket = io(API_BASE);
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

  if (loading) return <div className="pd-page"><div style={{ padding: "100px", textAlign: "center" }}>Loading product...</div></div>;
  if (!product) return <div className="pd-page"><div style={{ padding: "100px", textAlign: "center" }}>Product not found</div></div>;

  const isDropdownComplete = province && district && municipality && ward && exactLocation.trim() !== "";
  const isDeliveryComplete = isDropdownComplete || locationAdded;

  return (
    <div className="pd-page">
      {/* ===== HEADER ===== */}
      <header className="pd-header">
        <div className="pd-header__left">
          <button className="pd-back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div className="pd-logo" onClick={() => navigate("/customer-dashboard")}>
            Khata<span>.</span>
          </div>
        </div>
        <div className="pd-header__right">
          <button className="pd-cart-btn" onClick={() => navigate("/cart")}>
            🛒 Cart {totalQuantity > 0 && <span className="pd-cart-badge">{totalQuantity}</span>}
          </button>
        </div>
      </header>

      {/* ===== BREADCRUMB ===== */}
      <div className="pd-breadcrumb">
        <span onClick={() => navigate("/customer-dashboard")}>Home</span>
        <span style={{ margin: '0 8px' }}>/</span>
        <span className="pd-breadcrumb__current">{product.name}</span>
      </div>

      {/* ===== PRODUCT SECTION ===== */}
      <main className="pd-product-section">
        <div className="pd-image-section">
          <div className="pd-image-card">
            <img src={imgUrl(product.image)} alt={product.name} />
          </div>
        </div>

        <div className="pd-details-section">
          <div className="pd-details-card">
            <h1 className="pd-product-name">{product.name}</h1>
            
            <div className="pd-rating-summary">
              <Rating value={product.rating || 0} />
              <span style={{ color: "var(--pd-secondary)", fontSize: "0.9rem" }}>({product.numReviews || 0} reviews)</span>
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

          {/* Delivery Section */}
          <div className="pd-delivery-card" style={{ marginTop: '1.5rem' }}>
            <h3 className="pd-delivery-title">📍 Delivery Address</h3>

            <button
              className={`pd-geolocation-btn ${locationAdded ? "pd-geolocation-success" : ""}`}
              onClick={handleAddLocation}
              disabled={geoLoading || locationAdded}
            >
              {geoLoading ? "⏳ Detecting location..." : locationAdded ? "✅ Location detected" : "📍 Auto Detect Address"}
            </button>

            {locationAdded && (
              <div style={{ marginTop: "1rem", display: "flex", gap: "10px", alignItems: "center" }}>
                <div className="pd-selected-address" style={{ flex: 1, margin: 0 }}>📌 {location}</div>
                <button onClick={() => { setLocation(""); setLocationAdded(false); }} style={{ padding: "10px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "12px", cursor: "pointer" }}>✕</button>
              </div>
            )}

            <div style={{ textAlign: "center", margin: "1.5rem 0", color: "#94a3b8", fontSize: "0.85rem" }}>
              — OR SELECT MANUALLY —
            </div>

            <div className="pd-location-dropdowns">
              <select value={province} onChange={(e) => { setProvince(e.target.value); setDistrict(""); setMunicipality(""); setWard(""); setExactLocation(""); }} className="pd-select">
                <option value="">Provience State</option>
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

              <input type="text" className="pd-select" placeholder="Street name / House Number" value={exactLocation} onChange={(e) => setExactLocation(e.target.value)} disabled={!ward} />

              {isDropdownComplete && (
                <div className="pd-selected-address">
                  📌 {province}, {district}, {municipality}-{ward}, {exactLocation}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pd-actions">
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
              Buy Now
            </button>
            <button className="pd-add-cart" onClick={() => { addToCart(product); alert("Added to cart!"); }}>
              🛒 Add to Cart
            </button>
          </div>
        </div>
      </main>

      {/* ===== REVIEWS SECTION ===== */}
      <section className="pd-reviews-section">
        <div className="pd-reviews-header">
          <h2>Customer Reviews</h2>
        </div>
        
        <div className="pd-reviews-grid">
          {/* Review List */}
          <div className="pd-reviews-list">
            <div className="pd-avg-box" style={{ marginBottom: "2rem" }}>
              <span className="pd-avg-num">{(product.rating || 0).toFixed(1)}</span>
              <div>
                <Rating value={product.rating || 0} />
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>Based on {product.numReviews || 0} reviews</div>
              </div>
            </div>

            {product.reviews?.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "12px" }}>
                <p>No reviews yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div>
                {(product.reviews || []).map((rev) => {
                  const isMyReview = currentUser && (rev.user === currentUser._id || rev.user?.toString() === currentUser._id?.toString());
                  return (
                    <div key={rev._id} className="pd-review-item" style={isMyReview ? { background: "#eff6ff", padding: "1.5rem", borderRadius: "12px", border: "none" } : {}}>
                      <div className="pd-rev-user">
                        <div className="pd-user-avatar" style={isMyReview ? { background: "var(--pd-accent)", color: "white" } : {}}>
                          {rev.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="pd-rev-info">
                          <strong>{rev.name} {isMyReview && <span style={{ background: "var(--pd-accent)", color: "white", padding: "2px 6px", fontSize: "10px", borderRadius: "10px", marginLeft: "6px" }}>YOU</span>}</strong>
                          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        {isMyReview && (
                          <button onClick={() => handleEditClick(rev)} style={{ marginLeft: "auto", background: "white", border: "1px solid var(--pd-accent)", color: "var(--pd-accent)", padding: "4px 12px", borderRadius: "8px", fontSize: "0.8rem", cursor: "pointer", fontWeight: "600" }}>
                            Edit
                          </button>
                        )}
                      </div>
                      <div style={{ marginTop: "0.5rem" }}>
                        <Rating value={rev.rating} />
                        <p style={{ margin: "0.5rem 0 0", fontSize: "0.95rem", color: "#334155", lineHeight: "1.5" }}>{rev.comment}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Write Review Section */}
          <div className="pd-write-review" id="pd-review-form-section">
            <div className="pd-write-card">
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "1.5rem" }}>
                {editMode ? "Edit Your Review" : myReview ? "Your Review" : "Write a Review"}
              </h3>

              {editMode && (
                <div style={{ background: "#eff6ff", padding: "1rem", borderRadius: "12px", fontSize: "0.85rem", color: "#1e3a8a", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Updating your review.</span>
                  <button onClick={() => { setEditMode(false); setRating(0); setComment(""); setReviewError(""); setReviewSuccess(""); }} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
                </div>
              )}
              
              {reviewSuccess && <div style={{ background: "#dcfce7", color: "#166534", padding: "1rem", borderRadius: "12px", marginBottom: "1rem", fontSize: "0.9rem" }}>{reviewSuccess}</div>}
              {reviewError && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "1rem", borderRadius: "12px", marginBottom: "1rem", fontSize: "0.9rem" }}>{reviewError}</div>}

              {currentUser ? (
                <form onSubmit={submitReviewHandler} className="pd-review-form">
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.9rem" }}>Rating</label>
                    <div className="pd-stars-input">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`pd-star-btn ${star <= (hoverRating || rating) ? "active" : ""}`} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)}>★</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.9rem" }}>Your Comment</label>
                    <textarea placeholder="Share your experience with this product..." value={comment} onChange={(e) => setComment(e.target.value)} required></textarea>
                  </div>

                  <button type="submit" className="pd-submit-review" disabled={submittingReview} style={{ width: "100%" }}>
                    {submittingReview ? "Submitting..." : editMode ? "Update Review" : "Post Review"}
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <p style={{ color: "#64748b", marginBottom: "1rem" }}>Please log in to share your review.</p>
                  <button onClick={() => navigate("/login")} className="pd-buy-now" style={{ padding: "0.75rem 2rem" }}>Login to Review</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FLOATING CHAT WIDGET ===== */}
      <button className="pd-chat-widget-btn" onClick={toggleChat} title="Chat with Shop Owner">
        💬
      </button>

      {chatOpen && (
        <div className="pd-chat-window">
          <div className="pd-chat-header">
            <h3>💬 Chat with Shop</h3>
            <button className="pd-chat-close" onClick={() => setChatOpen(false)}>✕</button>
          </div>
          
          <div className="pd-chat-body" ref={chatBodyRef}>
            {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: '2rem' }}>
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
          
          <form className="pd-chat-footer" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              className="pd-chat-input" 
              placeholder="Type a message..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="pd-chat-send" disabled={!chatInput.trim()}>
              ➤
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default ProductDetails;
