import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CustomerSidebar from "../components/CustomerSidebar";
import "../styles/staffDashboard.css";
import "../styles/customerDashboard.css";

const CATEGORIES = [
  "All Categories",
  "Electronics",
  "Fashion",
  "Beauty & Personal Care",
  "Home & Kitchen",
  "Books & Stationery",
  "Toys & Games",
  "Sports & Fitness",
  "Automotive",
  "Others",
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
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

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

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setMinPrice("");
    setMaxPrice("");
  };

  const getFilteredProducts = (products) => {
    return (products || []).filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const matchesMinPrice = !minPrice || p.price >= Number(minPrice);
      const matchesMaxPrice = !maxPrice || p.price <= Number(maxPrice);
      return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
    });
  };

  if (loading) return <p className="loading">Loading stores...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="sd-layout">
      <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`sd-main ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        {/* NAVBAR */}
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <h2>🛍️ Browse Marketplace</h2>
          </div>
          <div className="sd-navbar__right">
            <div className="sd-profile-menu">
              <div className="sd-profile-icon">👤</div>
              <span className="sd-profile-name">Customer</span>
            </div>
          </div>
        </header>

        {/* BODY: content + filter sidebar side by side */}
        <div className="cd-body">
          {/* MAIN CONTENT */}
          <main className="cd-content">
            <div className="sd-panel">
              <input
                type="text"
                placeholder="🔍 Search products by name or description..."
                className="search-bar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {(shops || []).map((shop) => {
                const filteredProducts = getFilteredProducts(shop.products);
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
                              onError={(e) => { e.target.src = ""; }}
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
            </div>
          </main>

          {/* FILTER SIDEBAR */}
          <aside className="cd-filter-panel">
            <h3 className="filter-title">🔍 Filter Products</h3>

            <div className="filter-group">
              <label>Category</label>
              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value === "All Categories" ? "" : e.target.value)
                }
                className="filter-input"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat === "All Categories" ? "" : cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Price Range (NPR)</label>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="filter-input-small"
                />
                <span className="price-separator">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="filter-input-small"
                />
              </div>
            </div>

            <button className="clear-filter-btn" onClick={clearFilters}>
              🧹 Clear All Filters
            </button>
          </aside>
        </div>
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
                  <img
                    src={`${API_BASE}/${p.image}`}
                    alt={p.name}
                    onError={(e) => { e.target.src = ""; }}
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
  );
};

export default CustomerDashboard;
