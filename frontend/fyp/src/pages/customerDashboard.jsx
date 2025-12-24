import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/customerDashboard.css";

const CustomerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = "http://localhost:8000";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/products`);
        setProducts(res.data.products || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search
 const filteredProducts = products.filter((p) =>
  (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
  (p.description || "").toLowerCase().includes(searchTerm.toLowerCase())
);


  if (loading) return <p className="loading">Loading products...</p>;
  if (error) return <p className="error">{error}</p>;
  

  return (
    <div className="customer-container">
      <h1>Available Products</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search products..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="product-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p) => (
            <div className="product-card" key={p._id}>
              <img
                src={`${API_BASE}/${p.image}`}
                alt={p.name}
              />
              <h3>{p.name}</h3>
              <p className="price">NPR {p.price}</p>
              <p className="desc">{p.description}</p>

              <button className="buy-btn">Buy Now</button>
            </div>
          ))
        ) : (
          <p className="no-results">No products found</p>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
