import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { imgUrl } from "../utils/imageUrl";
import Rating from "./Rating";
import "./RecommendedProducts.css";

const API_BASE_URL = "http://localhost:8000";

const RecommendedProducts = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [stores, setStores] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthToken = () => {
    const token = localStorage.getItem("token");
    return token ? `Bearer ${token}` : null;
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const headers = token ? { Authorization: token } : {};

      const response = await axios.get(
        `${API_BASE_URL}/api/recommendations`,
        { headers }
      );

      if (response.data.success) {
        setTitle(response.data.title);
        setRecommendations(response.data.recommendations || []);
        setStores(response.data.stores || []);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const trackInteraction = async (interactionType, productId, category = null) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      await axios.post(
        `${API_BASE_URL}/api/recommendations/track`,
        {
          interactionType,
          productId,
          category
        },
        {
          headers: { Authorization: token }
        }
      );
    } catch (err) {
      console.error("Error tracking interaction:", err);
    }
  };

  const handleProductClick = (productId) => {
    trackInteraction("product_click", productId);
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="shop-container" style={{ textAlign: "center", padding: "40px" }}>
        <p className="loading" style={{ color: "#666" }}>Loading recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shop-container" style={{ textAlign: "center", padding: "40px" }}>
        <p className="error" style={{ color: "#e74c3c" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '32px' }}>
      <div className="shop-container" style={{ marginBottom: 0 }}>
        <div className="shop-header">
          <div>
            <h2>{title || "✨ Recommended for You"}</h2>
            <p>Based on your browsing history</p>
          </div>
        </div>

        {recommendations.length > 0 ? (
          <div 
            className="product-row horizontal-scroll" 
            style={{ 
              display: "flex", 
              overflowX: "auto", 
              gap: "24px", 
              paddingBottom: "16px",
              scrollbarWidth: "none"
            }}
          >
            {recommendations.map((p) => (
              <div 
                key={p._id} 
                className="product-card" 
                style={{ minWidth: "280px", flex: "0 0 auto" }}
              >
                <div 
                  className="product-card-image-wrap"
                  onClick={() => handleProductClick(p._id)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={imgUrl(p.image)}
                    alt={p.name}
                    onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=No+Image"; }}
                  />
                </div>
                <div className="product-card-content">
                  <h3 
                    onClick={() => handleProductClick(p._id)}
                    style={{ cursor: "pointer" }}
                  >
                    {p.name.length > 40 ? p.name.substring(0, 40) + "..." : p.name}
                  </h3>
                  <div className="price-row">
                    <span className="price">NPR {p.price?.toLocaleString()}</span>
                    <span className="stock-pill stock-green">Available</span>
                  </div>
                  <p className="desc" style={{ WebkitLineClamp: 2 }}>{p.category}</p>
                  
                  <div className="store-row">
                    <div className="store-name">
                       {p.shopName || "Store"}
                    </div>
                    <div className="store-rating">
                      <Rating value={p.rating || 0} text={`(${p.numReviews || 0})`} fontSize="12px" />
                    </div>
                  </div>

                  <button
                    className="premium-btn"
                    style={{ width: "100%", marginTop: "4px", padding: "10px" }}
                    onClick={() => handleProductClick(p._id)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            No products available at the moment
          </div>
        )}
      </div>

    </div>
  );
};

export default RecommendedProducts;
