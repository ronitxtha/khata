import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import CustomerSidebar from "../components/CustomerSidebar";
import RecommendedProducts from "../components/RecommendedProducts";
import "../styles/ownerDashboard.css";
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
  const [user, setUser] = useState({});
  const [shops, setShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedShop, setExpandedShop] = useState(null);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState("");

  const API_BASE = "http://localhost:8000";

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!currentUser || currentUser.role !== "customer") {
      // Allow browsing without login if needed, or redirect. 
      // Based on original code, it doesn't force redirect, but we can set user.
    }
    setUser(currentUser);

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

  const isSearchActive = searchTerm.trim() !== "" || categoryFilter !== "";

  const shopMatchesSearch = (shop) => {
    if (!searchTerm.trim()) return true;
    return shop.name.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const getFilteredProducts = (products, shop) => {
    return (products || []).filter((p) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm.trim() ||
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (shop && shop.name.toLowerCase().includes(term));
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${API_BASE}/api/customer/logout-click`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="od-shell">
        <CustomerSidebar customer={user} />
        <div className="od-main">
          <main className="od-content">
            <div className="si-ledger-table-wrap" style={{ padding: '80px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 24px' }} />
              <p style={{ fontWeight: 600, color: '#64748b' }}>Loading marketplace...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="od-shell">
      <CustomerSidebar customer={user} />

      <div className="od-main">
        {/* TOP NAVBAR */}
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">Marketplace</h1>
            <div className="od-topbar__date">Discover premium products from verified stores</div>
          </div>
          
          <div className="od-topbar__right">
            <div className="od-topbar__profile" onClick={() => navigate("/customer-profile")}>
              <div className="od-topbar__avatar">
                {user?.profileImage ? <img src={imgUrl(user.profileImage)} alt="avatar" /> : <span>{(user?.username || "C")[0].toUpperCase()}</span>}
              </div>
            </div>
            <button className="od-topbar__logout" onClick={handleLogout} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          </div>
        </header>

        {/* BODY: content */}
        <main className="od-content">
            
          {/* SEARCH BAR WIDGET */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {/* Search Input Row */}
            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: '38px', height: '38px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search products, store names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', fontWeight: 500, color: '#0f172a', background: 'transparent', fontFamily: 'Inter, system-ui, sans-serif' }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ background: '#f1f5f9', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: '13px', flexShrink: 0, lineHeight: 1 }}>✕</button>
              )}
            </div>
            {/* Category Pills Row */}
            <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', background: '#fafafa', borderRadius: '0 0 14px 14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0, marginRight: '4px' }}>Filter:</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setCategoryFilter(categoryFilter === cat.name ? "" : cat.name)}
                  style={{ 
                    padding: '5px 13px', 
                    borderRadius: '20px', 
                    background: categoryFilter === cat.name ? '#6366f1' : '#ffffff', 
                    color: categoryFilter === cat.name ? '#fff' : '#475569',
                    border: `1px solid ${categoryFilter === cat.name ? '#6366f1' : '#e2e8f0'}`,
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontFamily: 'inherit'
                  }}
                >
                  <span style={{ fontSize: '13px' }}>{cat.icon}</span> {cat.name}
                </button>
              ))}
              {categoryFilter && (
                <button onClick={() => setCategoryFilter('')} style={{ marginLeft: 'auto', padding: '5px 12px', border: 'none', background: 'none', color: '#6366f1', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Clear ✕</button>
              )}
            </div>
          </div>

          {/* RECOMMENDED PRODUCTS SECTION — hidden when searching */}
          {!isSearchActive && <RecommendedProducts />}

          {/* SHOPS GRID */}
          {(shops || []).map((shop) => {
            const filteredProducts = getFilteredProducts(shop.products, shop);
            const displayedProducts = filteredProducts.slice(0, 4);
            const hasMore = filteredProducts.length > 4;

            if (filteredProducts.length === 0 && !shopMatchesSearch(shop)) return null;
            if (filteredProducts.length === 0) return null;

            return (
              <div key={shop._id} style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>{shop.name}</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 500 }}>Trending products from this verified store</p>
                  </div>
                  {hasMore && (
                    <button
                      onClick={() => setExpandedShop(shop._id)}
                      style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      View All {filteredProducts.length} Items →
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                  {displayedProducts.map((p) => (
                    <div key={p._id} className="od-panel" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => navigate(`/product/${p._id}`)}>
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
                          <span style={{ fontSize: '18px', fontWeight: 800, color: '#6366f1' }}>NPR {p.price.toLocaleString()}</span>
                          <span className={`od-badge od-badge--${p.quantity > 5 ? "green" : "red"}`}>
                            {p.quantity > 5 ? "In Stock" : "Low Stock"}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>🏪 {shop.name}</span>
                          <Rating value={p.rating || 0} text={`(${p.numReviews || 0})`} fontSize="11px" />
                        </div>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }} onClick={() => setExpandedShop(null)}>
          <div className="od-panel" style={{ width: '100%', maxWidth: '1100px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>{shops.find((s) => s._id === expandedShop)?.name || "Store Products"}</h2>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: 500 }}>All items available in this store</p>
              </div>
              <button onClick={() => setExpandedShop(null)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                ✕
              </button>
            </div>
            
            <div style={{ padding: '32px', overflowY: 'auto', background: '#f8fafc', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                {getFilteredProducts(shops.find((s) => s._id === expandedShop)?.products).map((p) => (
                  <div key={p._id} className="od-panel" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => { navigate(`/product/${p._id}`); setExpandedShop(null); }}>
                    <div style={{ height: '200px', background: '#fff', padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                      <img src={imgUrl(p.image)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'darken' }} onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=No+Image"; }} />
                    </div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#0f172a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</h3>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#6366f1', marginTop: 'auto' }}>NPR {p.price.toLocaleString()}</span>
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

export default CustomerDashboard;
