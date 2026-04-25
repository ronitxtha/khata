import React from "react";
import { useNavigate } from "react-router-dom";
import "./ProductCard.css";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/product/${product._id}`, { state: { product } });
  };

  const imageUrl = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `http://localhost:8000/uploads/${product.image}`
    : "https://via.placeholder.com/200?text=No+Image";

  return (
    <div className="product-card">
      <div className="product-image-container" onClick={handleNavigate}>
        <img src={imageUrl} alt={product.name} className="product-image" />
        {product.totalSold > 0 && (
          <span className="sales-badge">{product.totalSold} sold</span>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name" onClick={handleNavigate}>
          {product.name.length > 40
            ? product.name.substring(0, 40) + "..."
            : product.name}
        </h3>

        <p className="product-store">🏪 {product.shopName}</p>

        <div className="product-rating">
          <span className="rating-stars">
            {"⭐".repeat(Math.round(product.rating))}
          </span>
          <span className="rating-count">
            {product.numReviews > 0 ? `(${product.numReviews})` : "No reviews"}
          </span>
        </div>

        <div className="product-footer">
          <span className="product-price">Rs. {product.price}</span>
          <button className="view-button" onClick={handleNavigate}>
            View
          </button>
        </div>

        {product.views > 0 && (
          <p className="product-views">👁️ {product.views} views</p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
