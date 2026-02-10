import React, { useState, useEffect } from "react";
import axios from "axios";
import StaffSidebar from "../components/StaffSidebar";
import "../styles/staffDashboard.css";

const StaffInventory = () => {
  const [products, setProducts] = useState([]);
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const [searchTerm, setSearchTerm] = useState("");

  const API_BASE = "http://localhost:8000";

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast({ ...toast, visible: false });
    }, duration);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const res = await axios.get(`${API_BASE}/api/owner/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProducts(res.data.products || []);
      } catch (err) {
        console.error(err);
        showToast("Failed to load inventory", "error");
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="staff-layout">
      <StaffSidebar />

      <div className="dashboard-container">
        {/* Header Section */}
        <div className="dashboard-header">
          <header>
            <h1>📦 Inventory Management</h1>
            <p className="subtitle">View and manage product inventory</p>
          </header>
        </div>

        {/* Search Section */}
        <section className="add-product-section">
          <div className="section-header">
            <h2>Search Products</h2>
          </div>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by product name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </section>

        {/* Product List */}
        <section className="product-list">
          <div className="section-header">
            <h2>📋 Products ({filteredProducts.length})</h2>
          </div>

          {filteredProducts && filteredProducts.length > 0 ? (
            <div className="inventory-table-wrapper">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price (NPR)</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id}>
                      <td className="product-name-cell">
                        {product.image && (
                          <img
                            src={`http://localhost:8000/${product.image}`}
                            alt={product.name}
                            className="product-thumbnail"
                          />
                        )}
                        {product.name || "Unnamed"}
                      </td>
                      <td>{product.category || "Others"}</td>
                      <td className="price-cell">NPR {product.price ?? 0}</td>
                      <td className="quantity-cell">{product.quantity ?? 0}</td>
                      <td>
                        <span
                          className={`stock-badge ${
                            product.quantity > 0 ? "in-stock" : "out-stock"
                          }`}
                        >
                          {product.quantity > 0 ? "✔️ In Stock" : "❌ Out of Stock"}
                        </span>
                      </td>
                      <td className="description-cell">
                        {product.description?.substring(0, 50)}
                        {product.description?.length > 50 ? "..." : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>📦 {searchTerm ? "No products match your search." : "No products available."}</p>
            </div>
          )}
        </section>

        {toast.visible && (
          <div className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffInventory;
