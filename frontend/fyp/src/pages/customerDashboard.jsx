import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/customerDashboard.css";

const CustomerDashboard = () => {
    const navigate = useNavigate()
  const [shops, setShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <div className="customer-container">
      <h1>Stores</h1>

      <input
        type="text"
        placeholder="Search products..."
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

        return (
          <div key={shop._id} className="shop-container">
            <h2>{shop.name}</h2>

            {filteredProducts.length > 0 ? (
              <div className="product-row">
                {filteredProducts.map((p) => (
                  <div key={p._id} className="product-card">
                    <img src={`${API_BASE}/${p.image}`} alt={p.name} />
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
              <p>No products found in this store.</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CustomerDashboard;
