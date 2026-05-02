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
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>{title || "✨ Recommended for You"}</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 500 }}>Based on your browsing history</p>
          </div>
        </div>

        {recommendations.length > 0 ? (
          <div 
            className="horizontal-scroll" 
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
                className="od-panel" 
                style={{ minWidth: "280px", flex: "0 0 auto", display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onClick={() => handleProductClick(p._id)}
              >
                <div style={{ height: '220px', background: '#f8fafc', padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                  <img
                    src={imgUrl(p.image)}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'darken' }}
                    onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=No+Image"; }}
                  />
                </div>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#0f172a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#6366f1' }}>NPR {p.price?.toLocaleString()}</span>
                    <span className="od-badge od-badge--green">
                      Available
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>🏪 {p.shopName || "Store"}</span>
                    <Rating value={p.rating || 0} text={`(${p.numReviews || 0})`} fontSize="11px" />
                  </div>
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
