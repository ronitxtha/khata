import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import nepalLocations from "../data/nepalLocations.json";
import "../styles/productDetails.css";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState("");
  const [locationAdded, setLocationAdded] = useState(false);

  const [province, setProvince] = useState("");
const [district, setDistrict] = useState("");
const [municipality, setMunicipality] = useState("");
const [ward, setWard] = useState("");
const [exactLocation, setExactLocation] = useState("");



  const [rating, setRating] = useState(0); // user rating
  const [hoverRating, setHoverRating] = useState(0); // hover effect
  const API_BASE = "http://localhost:8000";

  // Fetch product
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

  // Get user's location if not already added
  const handleAddLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;

          try {
            // Reverse geocode using OpenStreetMap Nominatim API
            const res = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const city = res.data.address.city || res.data.address.town || res.data.address.village || "Unknown place";
            setLocation(city);
            setLocationAdded(true);

            // TODO: Save location to user account using backend API
          } catch (err) {
            console.error(err);
            setLocation("Location not available");
          }
        },
        (err) => {
          console.error(err);
          setLocation("Location not available");
        }
      );
    } else {
      setLocation("Geolocation not supported");
    }
  };

  // Rating handler
  const handleRating = (value) => {
    setRating(value);
    // TODO: Send rating to backend API for product
  };

  if (loading) return <p className="pd-loading">Loading product...</p>;
  if (!product) return <p className="pd-error">Product not found</p>;

  return (
    <div className="pd-page">
      {/* ===== HEADER ===== */}
      <header className="pd-header">
        <div className="pd-logo" onClick={() => navigate("/")}>
          <h2>MyEcommerce</h2>
        </div>
        <div className="pd-search-bar">
          <input type="text" placeholder="Search products..." />
          <button>Search</button>
        </div>
        <div className="pd-cart-btn">
          <button onClick={() => navigate("/cart")}>Cart</button>
        </div>
      </header>

      {/* ===== PRODUCT SECTION ===== */}
      <main className="pd-product-section">
        <div className="pd-image-section">
          <img src={`${API_BASE}/${product.image}`} alt={product.name} />
        </div>

        <div className="pd-details-section">
          <h1 className="pd-product-name">{product.name}</h1>
          <p className="pd-price">NPR {product.price}</p>
          <p className="pd-desc">{product.description}</p>
          

          {/* ===== INFO PANEL ===== */}
          <div className="pd-info-panel">
            <p>✅ Cash on Delivery available</p>
            <p>🔄 7 Days Return Facility</p>

            {/* ===== RATING ===== */}
            <div className="pd-rating">
              <span>⭐ Rate this product: </span>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`pd-star ${star <= (hoverRating || rating) ? "pd-star-filled" : ""}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRating(star)}
                >
                  ★
                </span>
              ))}
            </div>

           
            {/* ===== DELIVERY LOCATION DROPDOWNS ===== */}
{/* ===== DELIVERY LOCATION DROPDOWNS + EXACT LOCATION ===== */}
<div className="pd-location-dropdowns">
  <h4>📍 Select Delivery Location:</h4>

  {/* Province */}
  <select
    value={province}
    onChange={(e) => {
      setProvince(e.target.value);
      setDistrict("");
      setMunicipality("");
      setWard("");
      setExactLocation(""); // reset exact location
    }}
    className="pd-select"
  >
    <option value="">Select Province</option>
    {Object.keys(nepalLocations).map((prov) => (
      <option key={prov} value={prov}>{prov}</option>
    ))}
  </select>

  {/* District */}
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

  {/* Municipality */}
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

  {/* Ward */}
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

  {/* Exact location input */}
  {ward && (
    <input
      type="text"
      className="pd-exact-location"
      placeholder="Enter exact location / street / house number"
      value={exactLocation}
      onChange={(e) => setExactLocation(e.target.value)}
    />
  )}

  {/* Display selected full address */}
  {province && district && municipality && ward && (
    <p>
      Selected: <b>
        {province} / {district} / {municipality} / {ward} {exactLocation && `/ ${exactLocation}`}
      </b>
    </p>
  )}
</div>


          </div>

          <div className="pd-actions">
            <button className="pd-buy-now">Buy Now</button>
            <button className="pd-add-cart">Add to Cart</button>
            <button className="pd-wishlist">Add to Wishlist</button>
          </div>
        </div>
      </main>

      <footer className="pd-footer">
        <p>&copy; 2026 MyEcommerce. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ProductDetails;
