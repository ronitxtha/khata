import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import nepalLocations from "../data/nepalLocations.json";
import "../styles/productDetails.css";
import { useCart } from "../context/CartContext";
import Rating from "../components/Rating";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, totalQuantity } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState("");
  const [locationAdded, setLocationAdded] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [ward, setWard] = useState("");
  const [exactLocation, setExactLocation] = useState("");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const API_BASE = "http://localhost:8000";

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/products/${id}`);
        setProduct(res.data.product);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

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

  const handleRating = (value) => {
    setRating(value);
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
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.post(
        `${API_BASE}/api/products/${id}/reviews`,
        { rating, comment },
        config
      );

      setReviewSuccess("Review submitted successfully!");
      setRating(0);
      setComment("");
      
      // Refresh product data
      const res = await axios.get(`${API_BASE}/api/products/${id}`);
      setProduct(res.data.product);
    } catch (err) {
      setReviewError(
        err.response && err.response.data.message
          ? err.response.data.message
          : err.message
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="pd-page">
        <div style={{ padding: "100px", textAlign: "center" }}>
          Loading product...
        </div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="pd-page">
        <div style={{ padding: "100px", textAlign: "center" }}>
          Product not found
        </div>
      </div>
    );
  }

  const isDropdownComplete =
    province && district && municipality && ward && exactLocation.trim() !== "";
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
            
            <h2>Khata</h2>
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
        <span className="pd-breadcrumb__sep">/</span>
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
              <Rating value={product.rating || 0} text={`${product.numReviews || 0} reviews`} />
            </div>
            
            <div className="pd-price-row">
              <span className="pd-price">NPR {product.price?.toLocaleString()}</span>
              <span className={`pd-stock-badge ${product.quantity > 5 ? "pd-in-stock" : "pd-low-stock"}`}>
                {product.quantity > 5 ? "✓ In Stock" : `⚠ Only ${product.quantity} left`}
              </span>
            </div>

            <p className="pd-desc">{product.description}</p>


            {/* Info chips */}
            <div className="pd-info-chips">
              <div className="pd-chip">✅ Cash on Delivery</div>
              <div className="pd-chip">🔄 7 Days Return</div>
              <div className="pd-chip">🚚 Free Shipping</div>
            </div>
          </div>

          {/* Delivery Section */}
          <div className="pd-delivery-card">
            <h3 className="pd-delivery-title">📍 Delivery Address</h3>

            <button
              className={`pd-geolocation-btn ${locationAdded ? "pd-geolocation-success" : ""}`}
              onClick={handleAddLocation}
              disabled={geoLoading || locationAdded}
            >
              {geoLoading
                ? "⏳ Detecting location..."
                : locationAdded
                ? "✅ Location detected"
                : "📍 Use My Location"}
            </button>

            {locationAdded && (
              <div className="pd-geolocation-result">
                <p>📌 <b>{location}</b></p>
                <button
                  className="pd-geolocation-reset"
                  onClick={() => {
                    setLocation("");
                    setLocationAdded(false);
                  }}
                >
                  ✕ Clear
                </button>
              </div>
            )}

            <div className="pd-location-divider">
              <span>OR select manually</span>
            </div>

            <div className="pd-location-dropdowns">
              <select
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  setDistrict("");
                  setMunicipality("");
                  setWard("");
                  setExactLocation("");
                }}
                className="pd-select"
              >
                <option value="">Select Province</option>
                {Object.keys(nepalLocations).map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>

              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setMunicipality("");
                  setWard("");
                  setExactLocation("");
                }}
                className="pd-select"
                disabled={!province}
              >
                <option value="">Select District</option>
                {province &&
                  Object.keys(nepalLocations[province]).map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
              </select>

              <select
                value={municipality}
                onChange={(e) => {
                  setMunicipality(e.target.value);
                  setWard("");
                  setExactLocation("");
                }}
                className="pd-select"
                disabled={!district}
              >
                <option value="">Select Municipality</option>
                {province && district &&
                  Object.keys(nepalLocations[province][district]).map((mun) => (
                    <option key={mun} value={mun}>{mun}</option>
                  ))}
              </select>

              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="pd-select"
                disabled={!municipality}
              >
                <option value="">Select Ward</option>
                {province && district && municipality &&
                  nepalLocations[province][district][municipality].map((w, i) => (
                    <option key={i} value={w}>{w}</option>
                  ))}
              </select>

              <input
                type="text"
                className="pd-select"
                placeholder="Enter exact location / street / house number"
                value={exactLocation}
                onChange={(e) => setExactLocation(e.target.value)}
                disabled={!ward}
              />

              {province && district && municipality && ward && (
                <div className="pd-selected-address">
                  📌 {province} / {district} / {municipality} / Ward {ward}
                  {exactLocation && ` / ${exactLocation}`}
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
            <button
              className="pd-add-cart"
              onClick={() => {
                addToCart(product);
                alert("Item added to cart successfully!");
              }}
            >
              🛒 Add to Cart
            </button>
          </div>
        </div>
      </main>

      {/* ===== REVIEWS SECTION ===== */}
      <section className="pd-reviews-section">
        <div className="pd-reviews-container">
          <div className="pd-reviews-header">
            <h2>Customer Reviews</h2>
            <div className="pd-reviews-stats">
              <div className="pd-avg-box">
                <span className="pd-avg-num">{(product.rating || 0).toFixed(1)}</span>
                <Rating value={product.rating || 0} />
                <span className="pd-total-reviews">Based on {product.numReviews || 0} reviews</span>
              </div>
            </div>
          </div>

          <div className="pd-reviews-grid">
            {/* Review List */}
            <div className="pd-reviews-list">
              <h3>Reviews ({product.reviews?.length || 0})</h3>
              {product.reviews?.length === 0 ? (
                <div className="pd-no-reviews">
                  <p>No reviews yet. Be the first to review this product!</p>
                </div>
              ) : (
                <div className="pd-review-items">
                  {(product.reviews || []).map((rev) => (
                    <div key={rev._id} className="pd-review-item">
                      <div className="pd-rev-user">
                        <div className="pd-user-avatar">
                          {rev.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="pd-rev-info">
                          <strong>{rev.name}</strong>
                          <span className="pd-rev-date">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="pd-rev-content">
                        <Rating value={rev.rating} />
                        <p>{rev.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write a Review Section */}
            <div className="pd-write-review">
              <div className="pd-write-card">
                <h3>Write a Review</h3>
                
                {reviewSuccess && <div className="pd-alert pd-alert-success">{reviewSuccess}</div>}
                {reviewError && <div className="pd-alert pd-alert-danger">{reviewError}</div>}

                {localStorage.getItem("accessToken") ? (
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
                        rows="4"
                        placeholder="What did you like or dislike? How's the quality?"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                      ></textarea>
                    </div>

                    <button 
                      type="submit" 
                      className="pd-submit-review"
                      disabled={submittingReview}
                    >
                      {submittingReview ? "Submitting..." : "Post Review"}
                    </button>
                  </form>
                ) : (
                  <div className="pd-login-prompt">
                    <p>Please log in to write a review.</p>
                    <button onClick={() => navigate("/login")} className="pd-login-link">
                      Login Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetails;
