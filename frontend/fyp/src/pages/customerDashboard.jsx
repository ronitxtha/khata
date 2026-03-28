import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CustomerSidebar from "../components/CustomerSidebar";
import { Search, Bell, User, Star, Store, Smartphone, Shirt, Home, Car, BookOpen, Joystick, Dumbbell } from "lucide-react";
import "../styles/customerLayout.css";
import "../styles/customerDashboard.css";

const CATEGORIES = [
  { name: "Electronics", icon: <Smartphone size={16} />, color: "pill-generic" },
  { name: "Fashion", icon: <Shirt size={16} />, color: "pill-generic" },
  { name: "Home & Kitchen", icon: <Home size={16} />, color: "pill-generic" },
  { name: "Automotive", icon: <Car size={16} />, color: "pill-generic" },
  { name: "Books", icon: <BookOpen size={16} />, color: "pill-generic" },
  { name: "Toys & Games", icon: <Joystick size={16} />, color: "pill-generic" },
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

  const getBadgeType = (price) => {
    if (price < 1000) return { label: "Top Rated", class: "badge-dark", icon: <Star size={12} fill="white" /> };
    if (price > 10000) return { label: "Premium", class: "badge-dark", icon: <Star size={12} fill="white" /> };
    return { label: "Best Seller", class: "badge-light", icon: <Star size={12} fill="#1b2559" /> };
  };

  if (loading) return <p className="loading">Loading stores...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="cd-layout">
      <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`cd-main ${sidebarOpen ? "cd-main--shifted" : ""}`}>
        {/* TOP NAVBAR (Like Reference) */}
        <header className="cd-navbar">
          <div className="cd-navbar__left">
            <h2>Browse Marketplace</h2>
            <p>Discover amazing products from trusted stores</p>
          </div>
          
          <div className="cd-global-search">
            <Search size={18} color="#a3aed1" />
            <input 
              type="text" 
              placeholder="Search products, stores..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="cd-navbar__right">
            <button className="cd-icon-btn">
              <Bell size={20} />
            </button>
            <div className="cd-profile-menu">
              <div className="cd-profile-icon"><User size={20} /></div>
            </div>
          </div>
        </header>

        {/* BODY: content */}
        <div className="cd-body">
          <main className="cd-content">
            
            {/* HERO SECTION */}
            <div className="cd-hero-card">
              <div className="cd-hero-search">
                <Search size={20} color="#8f9bba" />
                <input
                  type="text"
                  placeholder="Search products by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="cd-hero-search-btn">
                  Search
                </button>
              </div>
              <div className="cd-hero-categories">
                <span className="label">Popular categories:</span>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    className={`cd-cat-pill ${cat.color} ${categoryFilter === cat.name ? "active" : ""}`}
                    onClick={() => setCategoryFilter(categoryFilter === cat.name ? "" : cat.name)}
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
                    {displayedProducts.map((p) => {
                      const badge = getBadgeType(p.price);
                      return (
                        <div key={p._id} className="product-card">
                          <div className="product-card-image-wrap">
                            <span className={`card-badge ${badge.class}`}>
                              {badge.icon} {badge.label}
                            </span>
                            <img
                              src={`${API_BASE}/${p.image}`}
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
                                <Store size={14} color="#8f9bba" />
                                {shop.name}
                              </div>
                              <div className="store-rating">
                                <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                4.8 <span className="rating-val"></span>
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
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </main>
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
              ).map((p) => {
                const badge = getBadgeType(p.price);
                return (
                  <div key={p._id} className="product-card">
                    <div className="product-card-image-wrap">
                      <span className={`card-badge ${badge.class}`}>
                        {badge.icon} {badge.label}
                      </span>
                      <img
                        src={`${API_BASE}/${p.image}`}
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
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
