import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/productDetails.css"; // we'll update class names in CSS

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE = "http://localhost:8000";

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/products/${id}`);
        setProduct(res.data.product);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <p className="pd-loading">Loading product...</p>;
  if (!product) return <p className="pd-error">Product not found</p>;

  return (
    <div className="pd-page">
      {/* ===== HEADER ===== */}
      <header className="pd-header">
        <div className="pd-logo" onClick={() => navigate("/")}>
          <h2>MyEcommerce</h2>
        </div>
        <div className="pd-search-bar">
          <input type="text" placeholder="Search products..." />
          <button>Search</button>
        </div>
        <div className="pd-cart-btn">
          <button onClick={() => navigate("/cart")}>Cart</button>
        </div>
      </header>

      {/* ===== PRODUCT SECTION ===== */}
      <main className="pd-product-section">
        <div className="pd-image-section">
          <img src={`${API_BASE}/${product.image}`} alt={product.name} />
        </div>
        <div className="pd-details-section">
          <h1 className="pd-product-name">{product.name}</h1>
          <p className="pd-price">NPR {product.price}</p>
          <p className="pd-desc">{product.description}</p>
          

          <div className="pd-actions">
            <button className="pd-buy-now">Buy Now</button>
            <button className="pd-add-cart">Add to Cart</button>
            <button className="pd-wishlist">Add to Wishlist</button>
          </div>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="pd-footer">
        <p>&copy; 2026 MyEcommerce. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ProductDetails;
