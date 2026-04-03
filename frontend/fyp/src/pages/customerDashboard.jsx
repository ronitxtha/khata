import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import CustomerSidebar from "../components/CustomerSidebar";
import "../styles/customerLayout.css";
import "../styles/customerDashboard.css";
import Rating from "../components/Rating";

const CATEGORIES = [
  { name: "Electronics", icon: "📱", color: "pill-generic" },
  { name: "Fashion", icon: "👕", color: "pill-generic" },
  { name: "Home & Kitchen", icon: "🏠", color: "pill-generic" },
  { name: "Automotive", icon: "🚗", color: "pill-generic" },
  { name: "Books", icon: "📚", color: "pill-generic" },
  { name: "Toys & Games", icon: "🎮", color: "pill-generic" },
];

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedShop, setExpandedShop] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState("");

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

  const getFilteredProducts = (products) => {
    return (products || []).filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  };

  if (loading) return <p className="loading">Loading stores...</p>;
  if (error) return <p className="error">{error}</p>;

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
              <h1>Marketplace</h1>
              <span className="sd-navbar__subtitle">Discover premium products from verified stores</span>
            </div>
          </div>
          
          <div className="sd-navbar__right">
            <button className="od-nav-icon-btn" style={{ marginRight: '16px' }}>🔔</button>
            <div className="sd-avatar">
              <span>C</span>
            </div>
            <div className="sd-navbar__staff-info">
              <span className="sd-navbar__name">Customer</span>
              <span className="sd-navbar__role">Verified Account</span>
            </div>
          </div>
        </header>

        {/* BODY: content */}
        <main className="sd-content od-content">
            
          <div className="si-header-section" style={{ marginBottom: '32px' }}>
            <div className="si-header-info">
              <h2>Product Discovery</h2>
              <p>Search over thousands of items from local boutiques and brand stores.</p>
            </div>
          </div>

          {/* HERO SEARCH */}
          <div className="si-ledger-table-wrap" style={{ padding: '32px', marginBottom: '32px' }}>
            <div className="cd-hero-search" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '24px', marginBottom: '24px' }}>
              <span style={{ fontSize: '20px' }}>🔍</span>
              <input
                type="text"
                placeholder="What are you looking for today?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '18px', padding: '0 16px', fontWeight: 500 }}
              />
            </div>
            <div className="cd-hero-categories">
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginRight: '16px', letterSpacing: '0.5px' }}>Quick Filters:</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  className={`cd-cat-pill ${categoryFilter === cat.name ? "active" : ""}`}
                  onClick={() => setCategoryFilter(categoryFilter === cat.name ? "" : cat.name)}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '8px', 
                    background: categoryFilter === cat.name ? '#0f172a' : '#f8fafc', 
                    color: categoryFilter === cat.name ? '#fff' : '#475569',
                    border: '1px solid',
                    borderColor: categoryFilter === cat.name ? '#0f172a' : '#e2e8f0',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginRight: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* SHOPS GRID */}
          {(shops || []).map((shop) => {
            const filteredProducts = getFilteredProducts(shop.products);
            const displayedProducts = filteredProducts.slice(0, 4);
            const hasMore = filteredProducts.length > 4;

            if (filteredProducts.length === 0) return null;

            return (
              <div key={shop._id} className="shop-container">
                <div className="shop-header">
                  <div>
                    <h2>{shop.name}</h2>
                    <p>Most popular products this week</p>
                  </div>
                  {hasMore && (
                    <button
                      className="show-all-btn"
                      onClick={() => setExpandedShop(shop._id)}
                    >
                      View All Stores →
                    </button>
                  )}
                </div>

                <div className="product-row">
                  {displayedProducts.map((p) => (
                    <div key={p._id} className="product-card">
                      <div className="product-card-image-wrap">
                        <img
                          src={imgUrl(p.image)}
                          alt={p.name}
                          onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=No+Image"; }}
                        />
                      </div>
                      <div className="product-card-content">
                        <h3>{p.name}</h3>
                        <div className="price-row">
                          <span className="price">NPR {p.price.toLocaleString()}</span>
                          <span className={`stock-pill ${p.quantity > 5 ? "stock-green" : "stock-red"}`}>
                            {p.quantity > 5 ? "In Stock" : "Low Stock"}
                          </span>
                        </div>
                        <p className="desc">{p.description}</p>
                        
                        <div className="store-row">
                          <div className="store-name">
                             {shop.name}
                          </div>
                          <div className="store-rating">
                            <Rating value={p.rating || 0} text={`(${p.numReviews || 0})`} fontSize="12px" />
                          </div>
                        </div>

                        <button
                          className="buy-btn"
                          onClick={() => navigate(`/product/${p._id}`)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </main>
      </div>

      {/* Modal for showing all products of a shop */}
      {expandedShop && (
        <div className="modal-overlay" onClick={() => setExpandedShop(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{shops.find((s) => s._id === expandedShop)?.name || "Products"}</h2>
              <button className="modal-close" onClick={() => setExpandedShop(null)}>
                ✕
              </button>
            </div>
            <div className="modal-products-grid">
              {getFilteredProducts(
                shops.find((s) => s._id === expandedShop)?.products
              ).map((p) => (
                <div key={p._id} className="product-card">
                  <div className="product-card-image-wrap">
                    <img
                      src={imgUrl(p.image)}
                      alt={p.name}
                      onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=No+Image"; }}
                    />
                  </div>
                  <div className="product-card-content">
                    <h3>{p.name}</h3>
                    <div className="price-row">
                      <span className="price">NPR {p.price.toLocaleString()}</span>
                    </div>
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
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
