import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CustomerSidebar from "../components/CustomerSidebar";
import "../styles/customerDashboard.css";

const CustomerDashboard = () => {
    const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedShop, setExpandedShop] = useState(null); // Track which shop's modal is open

  const API_BASE = "http://localhost:8000";

  useEffect(() => {
    const fetchMarketplace = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/marketplace`);
        setShops(res.data.shops || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load stores");
      } finally {
        setLoading(false);
      }
    };

    fetchMarketplace();
  }, []);

  if (loading) return <p className="loading">Loading stores...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="staff-layout">
      <CustomerSidebar />

      <div className="dashboard-container">
      <h1>Browse Available Stores</h1>

      <input
        type="text"
        placeholder="🔍 Search products by name or description..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {(shops || []).map((shop) => {
        // Filter products based on search
        const filteredProducts = (shop.products || []).filter(
          (p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Show only first 5 products in horizontal view
        const displayedProducts = filteredProducts.slice(0, 5);
        const hasMore = filteredProducts.length > 5;

        return (
          <div key={shop._id} className="shop-container">
            <div className="shop-header">
              <h2>{shop.name}</h2>
              {hasMore && (
                <button 
                  className="show-all-btn"
                  onClick={() => setExpandedShop(shop._id)}
                >
                  📦 Show All ({filteredProducts.length})
                </button>
              )}
            </div>

            {filteredProducts.length > 0 ? (
              <div className="product-row">
                {displayedProducts.map((p) => (
                  <div key={p._id} className="product-card">
                    <img 
                      src={`${API_BASE}/${p.image}`} 
                      alt={p.name}
                      onError={(e) => {
                        e.target.src = '📷';
                      }}
                    />
                    <h3>{p.name}</h3>
                    <p className="price">NPR {p.price}</p>
                    <p className="desc">{p.description}</p>
                    <button 
                      className="buy-btn"
                      onClick={() => navigate(`/product/${p._id}`)}
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-results">No products found in this store.</p>
            )}
          </div>
        );
      })}

      {/* Modal for showing all products of a shop */}
      {expandedShop && (
        <div className="modal-overlay" onClick={() => setExpandedShop(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {shops.find(s => s._id === expandedShop)?.name || "Products"}
              </h2>
              <button 
                className="modal-close"
                onClick={() => setExpandedShop(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-products-grid">
              {(shops.find(s => s._id === expandedShop)?.products || [])
                .filter(
                  (p) =>
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.description.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((p) => (
                  <div key={p._id} className="product-card">
                    <img 
                      src={`${API_BASE}/${p.image}`} 
                      alt={p.name}
                      onError={(e) => {
                        e.target.src = '📷';
                      }}
                    />
                    <h3>{p.name}</h3>
                    <p className="price">NPR {p.price}</p>
                    <p className="desc">{p.description}</p>
                    <button 
                      className="buy-btn"
                      onClick={() => {
                        navigate(`/product/${p._id}`);
                        setExpandedShop(null);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
