import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import OwnerSidebar from "../components/OwnerSidebar";
import "../styles/staffDashboard.css";
import "../styles/ownerDashboard.css";
import "../styles/ownerReviews.css";

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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [owner, setOwner] = useState({});
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
    if (!token) { navigate("/login"); return; }

    axios
      .get(`${API_BASE}/api/owner/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setOwner(r.data.owner || {}))
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

  /* ── Render ── */
  return (
    <div className="sd-layout od-modern-layout">
      <OwnerSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        owner={owner}
        handleLogout={handleLogout}
      />

      <div
        className={`sd-main od-main-content ${
          sidebarOpen ? "sd-main--shifted" : ""
        }`}
      >
        {/* ── Navbar ── */}
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
                window.sidebarTimer = setTimeout(
                  () => setSidebarOpen(false),
                  300
                );
              }}
            >
              ☰
            </button>
            <div className="sd-navbar__title">
              <h1>Ratings &amp; Reviews</h1>
              <span className="sd-navbar__subtitle">
                Customer feedback across all your products
              </span>
            </div>
          </div>

          <div className="sd-navbar__right">
            <div
              onClick={() => navigate("/owner-profile")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
              }}
            >
              <div className="sd-avatar">
                {owner?.profileImage ? (
                  <img src={imgUrl(owner.profileImage)} alt="avatar" />
                ) : (
                  <span>{(owner?.username || "O")[0].toUpperCase()}</span>
                )}
              </div>
              <div className="sd-navbar__staff-info">
                <span className="sd-navbar__name">
                  {owner?.username || "Owner"}
                </span>
                <span className="sd-navbar__role">Owner</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="sd-content">
          <div className="rv-page">
            {/* Header */}
            <div className="rv-header">
              <div className="rv-header__info">
                <h2>Product Ratings &amp; Reviews</h2>
                <p>
                  Monitor what your customers are saying about every product in
                  your shop.
                </p>
              </div>
            </div>

            {/* Summary cards */}
            <div className="rv-summary">
              <div className="rv-summary-card">
                <span className="rv-summary-card__label">Total Products</span>
                <span className="rv-summary-card__value">
                  {stats.totalProducts}
                </span>
                <span className="rv-summary-card__sub">in your shop</span>
              </div>

              <div className="rv-summary-card">
                <span className="rv-summary-card__label">Total Reviews</span>
                <span className="rv-summary-card__value">
                  {stats.totalReviews}
                </span>
                <span className="rv-summary-card__sub">from customers</span>
              </div>

              <div className="rv-summary-card">
                <span className="rv-summary-card__label">
                  Shop Avg. Rating
                </span>
                <span
                  className="rv-summary-card__value"
                  style={{ color: "#f59e0b" }}
                >
                  {stats.avgRating > 0
                    ? stats.avgRating.toFixed(1)
                    : "—"}
                </span>
                <span className="rv-summary-card__sub">
                  {stats.avgRating > 0 ? (
                    <StarRow rating={stats.avgRating} size={12} />
                  ) : (
                    "no ratings yet"
                  )}
                </span>
              </div>

              <div className="rv-summary-card">
                <span className="rv-summary-card__label">
                  Top Rated Product
                </span>
                <span
                  className="rv-summary-card__value"
                  style={{ fontSize: "16px", fontWeight: 800 }}
                >
                  {stats.topProduct?.numReviews > 0
                    ? stats.topProduct.name
                    : "—"}
                </span>
                <span className="rv-summary-card__sub">
                  {stats.topProduct?.numReviews > 0
                    ? `${stats.topProduct.rating.toFixed(1)} ★`
                    : "no reviews yet"}
                </span>
              </div>
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
