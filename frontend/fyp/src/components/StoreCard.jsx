import React from "react";
import { useNavigate } from "react-router-dom";
import "./StoreCard.css";

const StoreCard = ({ store }) => {
  const navigate = useNavigate();

  const handleStoreClick = () => {
    navigate(`/store/${store._id}`, { state: { store } });
  };

  const logoUrl = store.logoUrl
    ? store.logoUrl.startsWith("http")
      ? store.logoUrl
      : `http://localhost:8000/uploads/${store.logoUrl}`
    : "https://via.placeholder.com/100?text=Store";

  return (
    <div className="store-card" onClick={handleStoreClick}>
      <div className="store-logo-container">
        <img src={logoUrl} alt={store.name} className="store-logo" />
      </div>

      <div className="store-info">
        <h3 className="store-name">{store.name}</h3>
        {store.owner && (
          <p className="store-owner">By {store.owner}</p>
        )}
      </div>

      <button className="store-visit-button">
        Visit Store →
      </button>
    </div>
  );
};

export default StoreCard;
