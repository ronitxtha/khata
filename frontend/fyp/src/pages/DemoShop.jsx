import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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

const DemoShop = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedShop, setExpandedShop] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [toast, setToast] = useState(null);

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

  const handleActionClick = () => {
    setToast("Please create an account to view details.");
    setTimeout(() => {
      setToast(null);
      navigate("/register");
    }, 2000);
  };

  if (loading) return <p className="loading">Loading stores...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="sd-layout od-modern-layout" style={{ display: "block" }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
          background: "#0f172a", color: "#fff", padding: "12px 24px",
          borderRadius: "8px", zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          fontWeight: 600, fontSize: "14px"
        }}>
          {toast}
        </div>
      )}

      {/* TOP NAVBAR */}
      <header className="sd-navbar" style={{ padding: "16px 40px" }}>
        <div className="sd-navbar__left" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <div className="sd-navbar__title">
            <h1>SmartKhata Demo</h1>
            <span className="sd-navbar__subtitle">Experience our marketplace</span>
          </div>
        </div>
        
        <div className="sd-navbar__right">
          <button 
            onClick={() => navigate("/login")}
            style={{ marginRight: "12px", background: "transparent", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate("/register")}
            style={{ background: "#0f172a", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
          >
            Create Account
          </button>
        </div>
      </header>

      {/* BODY: content */}
      <main className="sd-content od-content" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
          
        <div className="si-header-section" style={{ marginBottom: '32px' }}>
          <div className="si-header-info">
            <h2>Product Discovery</h2>
            <p>Search over thousands of items from local boutiques and brand stores.</p>
          </div>
        </div>

        {/* HERO SEARCH */}
        <div className="si-ledger-table-wrap" style={{ padding: '32px', marginBottom: '32px' }}>
          <div className="cd-hero-search" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
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
                  transition: 'all 0.2s',
                  marginBottom: '8px'
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
            <div key={shop._id} className="shop-container" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
              <div className="shop-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 24px 8px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>{shop.name}</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Most popular products this week</p>
                </div>
                {hasMore && (
                  <button
                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                    onClick={() => setExpandedShop(shop._id)}
                  >
                    View All Stores →
                  </button>
                )}
              </div>

              <div className="product-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                {displayedProducts.map((p) => (
                  <div key={p._id} className="product-card" style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden', padding: '16px' }}>
                    <div className="product-card-image-wrap" style={{ height: '200px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={`${API_BASE}/${p.image}`}
                        alt={p.name}
                        onError={(e) => { e.target.src = "https://placehold.co/300x300?text=No+Image"; }}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div className="product-card-content">
                      <h3 style={{ fontSize: '16px', margin: '0 0 8px', fontWeight: 700, color: '#0f172a' }}>{p.name}</h3>
                      <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span className="price" style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>NPR {p.price.toLocaleString()}</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '4px', background: p.quantity > 5 ? '#ecfdf5' : '#fef2f2', color: p.quantity > 5 ? '#059669' : '#dc2626' }}>
                          {p.quantity > 5 ? "IN STOCK" : "LOW STOCK"}
                        </span>
                      </div>
                      <p className="desc" style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.description}
                      </p>
                      
                      <div className="store-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                        <div className="store-name" style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                           {shop.name}
                        </div>
                        <div className="store-rating">
                          <Rating value={p.rating || 0} text={`(${p.numReviews || 0})`} fontSize="11px" />
                        </div>
                      </div>

                      <button
                        style={{ width: '100%', background: '#0f172a', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                        onClick={handleActionClick}
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

      {/* Modal for showing all products of a shop */}
      {expandedShop && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setExpandedShop(null)}>
          <div style={{ background: '#fff', width: '90%', maxWidth: '1000px', maxHeight: '90vh', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{shops.find((s) => s._id === expandedShop)?.name || "Products"}</h2>
              <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }} onClick={() => setExpandedShop(null)}>
                ✕
              </button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {getFilteredProducts(
                  shops.find((s) => s._id === expandedShop)?.products
                ).map((p) => (
                  <div key={p._id} className="product-card" style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden', padding: '16px' }}>
                    <div className="product-card-image-wrap" style={{ height: '180px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={`${API_BASE}/${p.image}`}
                        alt={p.name}
                        onError={(e) => { e.target.src = "https://placehold.co/300x300?text=No+Image"; }}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div className="product-card-content">
                      <h3 style={{ fontSize: '15px', margin: '0 0 8px', fontWeight: 700 }}>{p.name}</h3>
                      <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>NPR {p.price.toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>
                      <button
                        style={{ width: '100%', background: '#0f172a', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                        onClick={handleActionClick}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoShop;
