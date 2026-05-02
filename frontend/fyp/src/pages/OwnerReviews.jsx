import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import "../styles/ownerDashboard.css";
import "../styles/orderManagement.css";
import "../styles/ownerReviews.css";

import StaffSidebar from "../components/StaffSidebar";

const API_BASE = "http://localhost:8000";

/* ─── Helpers ─────────────────────────────────────────── */
const StarRow = ({ rating, size = 13 }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="rv-stars">
      {stars.map((s) => (
        <span
          key={s}
          className="rv-star"
          style={{
            fontSize: size,
            color: s <= Math.round(rating) ? "#f59e0b" : "#e2e8f0",
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/* ─── Per-product card ──────────────────────────────────── */
const ProductReviewCard = ({ product }) => {
  const [expanded, setExpanded] = useState(false);
  const reviews = product.reviews || [];
  const visible = expanded ? reviews : reviews.slice(0, 3);

  return (
    <div className="rv-card">
      {/* ── Head ── */}
      <div className="rv-card__head">
        {product.image ? (
          <img
            src={imgUrl(product.image)}
            alt={product.name}
            className="rv-card__img"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="rv-card__img-placeholder">📦</div>
        )}

        <div className="rv-card__meta">
          <p className="rv-card__name">{product.name}</p>
          <p className="rv-card__category">{product.category}</p>
          <div className="rv-card__stars-row">
            <StarRow rating={product.rating} />
            <span className="rv-card__avg">
              {Number(product.rating).toFixed(1)}
            </span>
            <span className="rv-card__count">
              ({product.numReviews}{" "}
              {product.numReviews === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
      </div>

      {/* ── Reviews ── */}
      {reviews.length === 0 ? (
        <div className="rv-card__empty">No reviews yet for this product.</div>
      ) : (
        <>
          <div className="rv-review-list">
            {visible.map((review, idx) => (
              <div className="rv-review-item" key={review._id || idx}>
                <div className="rv-review-item__top">
                  <div className="rv-review-item__avatar">
                    {(review.name || "U")[0].toUpperCase()}
                  </div>
                  <span className="rv-review-item__author">
                    {review.name || review.user?.username || "Anonymous"}
                  </span>
                  <div className="rv-review-item__rating">
                    <StarRow rating={review.rating} size={11} />
                  </div>
                  <span className="rv-review-item__date">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <p className="rv-review-item__comment">{review.comment}</p>
              </div>
            ))}
          </div>

          {reviews.length > 3 && (
            <button
              className="rv-show-more"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded
                ? "▲ Show less"
                : `▼ Show ${reviews.length - 3} more review${
                    reviews.length - 3 !== 1 ? "s" : ""
                  }`}
            </button>
          )}
        </>
      )}
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────── */
const OwnerReviews = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState({});
  const [ownerData, setOwnerData] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState("all"); // all | 5 | 4 | 3 | 2 | 1 | 0
  const [sortBy, setSortBy] = useState("rating_desc"); // rating_desc | rating_asc | reviews_desc | name_asc

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  /* ── Fetch owner info ── */
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (!token || !currentUser || (currentUser.role !== "owner" && currentUser.role !== "staff")) { 
      navigate("/login"); 
      return; 
    }
    setUser(currentUser);

    axios
      .get(`${API_BASE}/api/owner/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setOwnerData(r.data.owner || {}))
      .catch(console.error);
  }, [navigate]);

  /* ── Fetch product reviews ── */
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setLoading(true);
    axios
      .get(`${API_BASE}/api/owner/product-reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        setProducts(r.data.products || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── Derived summary stats ── */
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalReviews = products.reduce((a, p) => a + (p.numReviews || 0), 0);
    const ratedProducts = products.filter((p) => p.numReviews > 0);
    const avgRating =
      ratedProducts.length > 0
        ? ratedProducts.reduce((a, p) => a + p.rating, 0) / ratedProducts.length
        : 0;
    const topProduct = [...products].sort((a, b) => b.rating - a.rating)[0];
    return { totalProducts, totalReviews, avgRating, topProduct };
  }, [products]);

  /* ── Filter + search + sort ── */
  const displayed = useMemo(() => {
    let list = [...products];

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    // rating filter
    if (filterRating !== "all") {
      const star = Number(filterRating);
      if (star === 0) {
        list = list.filter((p) => p.numReviews === 0);
      } else {
        list = list.filter((p) => Math.round(p.rating) === star);
      }
    }

    // sort
    if (sortBy === "rating_desc") list.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "rating_asc") list.sort((a, b) => a.rating - b.rating);
    else if (sortBy === "reviews_desc")
      list.sort((a, b) => b.numReviews - a.numReviews);
    else if (sortBy === "name_asc")
      list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [products, search, filterRating, sortBy]);

  const sideLinks = [
    { label: "Dashboard", path: "/owner-dashboard", d: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10" },
    { label: "Orders", path: "/order-management", d: "M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M8 12h8" },
    { label: "Products", path: "/products", d: "M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
    { label: "Staff", path: "/add-staff", d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" },
    { label: "Suppliers", path: "/supplier-management", d: "M3 3h18v4H3zM3 11h18v4H3zM3 19h18v4H3z" },
    { label: "Attendance", path: "/attendance", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { label: "Messages", path: "/owner-messages", d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
    { label: "Reviews", path: "/owner-reviews", d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
    { label: "Profile", path: "/owner-profile", d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
  ];

  /* ── Render ── */
  return (
    <div className="od-shell">
      {user?.role === "staff" ? (
        <StaffSidebar staff={user} />
      ) : (
        <aside className="od-sidebar">
          <div className="od-sidebar__brand">
            <div className="od-sidebar__logo">
              <span className="od-sidebar__logo-icon">K</span>
              <span className="od-sidebar__logo-text">SmartKhata</span>
            </div>
          </div>
          <nav className="od-sidebar__nav">
            {sideLinks.map(link => (
              <button key={link.path}
                className={`od-sidebar__link ${location.pathname === link.path ? "od-sidebar__link--active" : ""}`}
                onClick={() => navigate(link.path)}>
                <span className="od-sidebar__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={link.d}/></svg>
                </span>
                <span className="od-sidebar__label">{link.label}</span>
              </button>
            ))}
          </nav>
          <div className="od-sidebar__footer">
            <div className="od-sidebar__user" onClick={() => navigate("/owner-profile")}>
              <div className="od-sidebar__avatar">
                {user?.profileImage ? <img src={imgUrl(user.profileImage)} alt="avatar"/> : <span>{(user?.username||"U")[0].toUpperCase()}</span>}
              </div>
              <div>
                <div className="od-sidebar__user-name">{user?.username||"Owner"}</div>
                <div className="od-sidebar__user-role" style={{textTransform:"capitalize"}}>Owner</div>
              </div>
            </div>
          </div>
        </aside>
      )}

      <div className="od-main">
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">Ratings &amp; Reviews</h1>
            <div className="od-topbar__date">Customer feedback across all your products</div>
          </div>
          <div className="od-topbar__right">
            <div className="od-topbar__profile" onClick={() => navigate(user?.role === "staff" ? "/staff-profile" : "/owner-profile")}>
              <div className="od-topbar__avatar">
                {user?.profileImage ? <img src={imgUrl(user.profileImage)} alt="avatar"/> : <span>{(user?.username||"U")[0].toUpperCase()}</span>}
              </div>
            </div>
            <button className="od-topbar__logout" onClick={handleLogout} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          </div>
        </header>

        <main className="od-content">
          <div className="rv-page">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px', letterSpacing: '-0.4px' }}>Product Ratings &amp; Reviews</h2>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>Monitor what your customers are saying about every product in your shop.</p>
              </div>
            </div>

            {/* Summary cards */}
            <div className="om-stat-row">
              {[
                { label:"Total Products", val: stats.totalProducts,                                color:"#6366f1", icon:"M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
                { label:"Total Reviews",  val: stats.totalReviews,                                 color:"#10b981", icon:"M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
                { label:"Avg Rating",     val: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—", color:"#f59e0b", icon:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
                { label:"Top Rated",      val: stats.topProduct?.numReviews > 0 ? stats.topProduct.name : "—", color:"#8b5cf6", icon:"M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
              ].map(c=>(
                <div key={c.label} className="om-stat-card" style={{"--card-color":c.color}}>
                  <div className="om-stat-card__icon" style={{background:c.color+"18",color:c.color}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon}/></svg>
                  </div>
                  <div>
                    <div className="om-stat-card__label">{c.label}</div>
                    <div className="om-stat-card__value" style={{ fontSize: c.label === "Top Rated" && c.val !== "—" ? '1.1rem' : '', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{c.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="rv-controls">
              {/* Search */}
              <div className="rv-search-wrap">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  id="rv-search-input"
                  className="rv-search"
                  placeholder="Search products…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Filter by rating */}
              <select
                id="rv-filter-rating"
                className="rv-filter-select"
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
              >
                <option value="all">All Ratings</option>
                <option value="5">★★★★★ 5 Stars</option>
                <option value="4">★★★★ 4 Stars</option>
                <option value="3">★★★ 3 Stars</option>
                <option value="2">★★ 2 Stars</option>
                <option value="1">★ 1 Star</option>
                <option value="0">No Reviews</option>
              </select>

              {/* Sort */}
              <select
                id="rv-sort-select"
                className="rv-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="rating_desc">Highest Rating</option>
                <option value="rating_asc">Lowest Rating</option>
                <option value="reviews_desc">Most Reviews</option>
                <option value="name_asc">Name A–Z</option>
              </select>
            </div>

            {/* Grid / Loading / Empty */}
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "80px",
                  color: "#94a3b8",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Loading reviews…
              </div>
            ) : displayed.length === 0 ? (
              <div className="rv-empty">
                <div className="rv-empty__icon">⭐</div>
                <p className="rv-empty__title">No products found</p>
                <p className="rv-empty__sub">
                  {search || filterRating !== "all"
                    ? "Try adjusting your search or filter."
                    : "Add products to your shop to start collecting reviews."}
                </p>
              </div>
            ) : (
              <div className="rv-grid">
                {displayed.map((product) => (
                  <ProductReviewCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerReviews;
