import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import CustomerSidebar from "../components/CustomerSidebar";
import RecommendedProducts from "../components/RecommendedProducts";
import DisabledAccountPopup from "../components/DisabledAccountPopup";
import socket from "../socket.js";
import "../styles/ownerDashboard.css";
import Rating from "../components/Rating";
import { API_BASE } from "../config/api.js";

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
  const [modalSearch, setModalSearch] = useState("");
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [showDisabledPopup, setShowDisabledPopup] = useState(false);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(currentUser);

    // ── Fast path: localStorage already knows the account is disabled ──
    if (currentUser && currentUser._id && !currentUser.isActive) {
      setLoading(false);
      setShowDisabledPopup(true);
      return;
    }

    // ── Live check: verify isActive directly from the server ──────────
    // This catches the case where admin disabled the account mid-session
    // (localStorage is stale but the DB already has isActive: false).
    const checkAccountStatus = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const res = await axios.get(`${API_BASE}/api/customer/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success && !res.data.user.isActive) {
          setLoading(false);
          setShowDisabledPopup(true);
          return; // stop — don't load the marketplace
        }
      } catch (err) {
        // 401 = token expired/invalid (let normal auth handle it)
        console.error("Status check error:", err);
      }
      // Account is active — load the marketplace
      fetchMarketplace();
    };

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

    checkAccountStatus();
  }, []);

  // Socket listener for real-time account status changes
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    // Register this user's socket
    if (currentUser?._id) {
      socket.emit("register", currentUser._id);
    }

    // Listen for status changes
    socket.on("user-status-changed", (data) => {
      if (currentUser._id === data.userId && !data.isActive) {
        localStorage.setItem("user", JSON.stringify({ ...currentUser, isActive: false }));
        setShowDisabledPopup(true);
      }
    });

    return () => {
      socket.off("user-status-changed");
    };
  }, []);

  const handleDisabledAccountClose = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isSearchActive = searchTerm.trim() !== "" || categoryFilter !== "";

  const shopMatchesSearch = (shop) => {
    if (!searchTerm.trim()) return true;
    return shop.name.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const submitReport = async () => {
    if (!reportReason || !expandedShop) return;
    try {
      setSubmittingReport(true);
      const token = localStorage.getItem("accessToken");
      await axios.post(`${API_BASE}/api/admin/reports`, {
        targetType: "shop",
        targetId: expandedShop,
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
      <DisabledAccountPopup visible={showDisabledPopup} onClose={handleDisabledAccountClose} />
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
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
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
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
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {hasMore && (
                      <button
                        onClick={() => setExpandedShop(shop._id)}
                        style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        View All {filteredProducts.length} Items →
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setExpandedShop(shop._id);
                        setReportModal(true);
                      }}
                      style={{ background: '#fee2e2', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 700, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                      Report Store
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                  {displayedProducts.map((p) => (
                    <div key={p._id} className="od-panel" style={{ width: '260px', flex: '0 0 auto', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => navigate(`/product/${p._id}`)}>
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

      {/* ─── Shop Products Modal ─────────────────────────────── */}
      {expandedShop && (() => {
        const activeShop = shops.find((s) => s._id === expandedShop);
        const allProducts = getFilteredProducts(activeShop?.products);
        const modalFiltered = modalSearch.trim()
          ? allProducts.filter(p =>
            p.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
            (p.category || "").toLowerCase().includes(modalSearch.toLowerCase())
          )
          : allProducts;

        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}
            onClick={() => { setExpandedShop(null); setModalSearch(""); }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '1140px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(15,23,42,0.25)' }}
            >
              {/* ── Header ── */}
              <div style={{ padding: '24px 32px 20px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {/* Shop avatar */}
                <div style={{ width: 52, height: 52, borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🏪</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeShop?.name || "Store Products"}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                    {allProducts.length} item{allProducts.length !== 1 ? 's' : ''} available
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                  {/* Report shop button */}
                  <button
                    onClick={() => setReportModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                    Report Shop
                  </button>
                  {/* Close */}
                  <button
                    onClick={() => { setExpandedShop(null); setModalSearch(""); }}
                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* ── Search bar ── */}
              <div style={{ padding: '16px 32px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                  <input
                    type="text"
                    placeholder={`Search products in ${activeShop?.name || 'this store'}...`}
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    autoFocus
                    style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#fff', outline: 'none', boxSizing: 'border-box', color: '#0f172a' }}
                  />
                  {modalSearch && (
                    <button onClick={() => setModalSearch('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}>✕</button>
                  )}
                </div>
                <span style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {modalFiltered.length} result{modalFiltered.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* ── Product grid ── */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#f8fafc' }}>
                {modalFiltered.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                    <p style={{ color: '#64748b', fontWeight: 600, fontSize: '16px' }}>No products match "{modalSearch}"</p>
                    <button onClick={() => setModalSearch('')} style={{ marginTop: '12px', background: '#6366f1', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Clear search</button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                    {modalFiltered.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => { navigate(`/product/${p._id}`); setExpandedShop(null); setModalSearch(''); }}
                        style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ height: '180px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                          <img
                            src={imgUrl(p.image)}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'darken' }}
                            onError={e => { e.target.src = "https://via.placeholder.com/300?text=No+Image"; }}
                          />
                        </div>
                        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{p.name}</h3>
                          {p.category && <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600, background: '#eef2ff', padding: '2px 8px', borderRadius: '6px', alignSelf: 'flex-start' }}>{p.category}</span>}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#6366f1' }}>NPR {p.price.toLocaleString()}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: p.quantity > 5 ? '#ecfdf5' : '#fef2f2', color: p.quantity > 5 ? '#059669' : '#dc2626' }}>
                              {p.quantity > 5 ? 'In Stock' : p.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Report Shop Modal ────────────────────────────────── */}
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
                <strong style={{ fontSize: '18px', fontWeight: 800 }}>Report Shop</strong>
              </div>
              <button onClick={() => { setReportModal(false); setReportSent(false); setReportReason(''); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            <div style={{ padding: '28px 24px' }}>
              {reportSent ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                  <h3 style={{ color: '#0f172a', fontWeight: 800, margin: '0 0 8px' }}>Report Submitted</h3>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Thank you for helping keep our marketplace safe. We'll review this shop shortly.</p>
                  <button onClick={() => { setReportModal(false); setReportSent(false); setReportReason(''); }} style={{ marginTop: '20px', background: '#6366f1', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>Done</button>
                </div>
              ) : (
                <>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px', lineHeight: 1.6 }}>
                    Reporting <strong style={{ color: '#0f172a' }}>{shops.find(s => s._id === expandedShop)?.name}</strong>. Please select a reason:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {['Selling counterfeit products', 'Fraudulent activity', 'Inappropriate content', 'Price gouging', 'Poor product quality', 'Other'].map(reason => (
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

export default CustomerDashboard;
