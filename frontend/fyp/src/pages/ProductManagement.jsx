// ProductManagement.jsx
import React from "react";
import { FaBoxOpen, FaTags, FaSyncAlt, FaEye, FaBarcode, FaBoxes } from "react-icons/fa";

export default function ProductManagement() {
  return (
    <div className="pm-container">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body, html, .pm-container {
          height: 100%;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .pm-container {
          background: linear-gradient(135deg, #007bff, #00c6ff);
          color: white;
          padding: 50px 20px;
        }
        .hero {
          text-align: center;
          margin-bottom: 50px;
        }
        .hero img {
          max-width: 100%;
          height: auto;
          border-radius: 15px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }
        .hero h1 {
          font-size: 3rem;
          margin: 25px 0 15px;
        }
        .hero p {
          font-size: 1.2rem;
          max-width: 800px;
          margin: 0 auto;
          color: #e0f8ff;
          line-height: 1.5;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .feature-card {
          background: rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: start;
          transition: transform 0.3s, background 0.3s;
          box-shadow: 0 6px 18px rgba(0,0,0,0.15);
        }
        .feature-card:hover {
          background: rgba(255,255,255,0.25);
          transform: translateY(-8px);
        }
        .icon {
          font-size: 2.2rem;
          margin-bottom: 14px;
          color: #fff;
        }
        .feature-title {
          font-size: 1.3rem;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .feature-text {
          font-size: 1rem;
          color: #e8f8ff;
          line-height: 1.4;
        }
        .footer-note {
          text-align: center;
          margin-top: 60px;
          font-size: 0.95rem;
          color: #cceeff;
        }
      `}</style>

      <div className="hero">
        <img src="https://images.unsplash.com/photo-1591907899841-9c396da04f0a?auto=format&fit=crop&w=1350&q=80"
             alt="Warehouse inventory" />
        <h1>🛒 Product Management</h1>
        <p>
          Manage your entire product catalog with ease. Add new items, update existing details, track inventory levels,
          and organize products — all in real time. Empower your staff and owners to keep your store up-to-date and
          customers always informed.
        </p>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <FaBoxOpen className="icon" />
          <div className="feature-title">Add & Update Products</div>
          <div className="feature-text">
            Quickly create new products or modify price, description, and stock — with no hassle.
          </div>
        </div>

        <div className="feature-card">
          <FaSyncAlt className="icon" />
          <div className="feature-title">Real-Time Inventory</div>
          <div className="feature-text">
            Stock levels update instantly when sales or restocks happen — avoid overselling or stockouts.
          </div>
        </div>

        <div className="feature-card">
          <FaTags className="icon" />
          <div className="feature-title">Categorization & Tags</div>
          <div className="feature-text">
            Organize products with categories & tags for easy filtering and browsing.
          </div>
        </div>

        <div className="feature-card">
          <FaBoxes className="icon" />
          <div className="feature-title">Bulk Actions</div>
          <div className="feature-text">
            Update multiple products at once — ideal for seasonal sales or stock adjustments.
          </div>
        </div>

        <div className="feature-card">
          <FaEye className="icon" />
          <div className="feature-title">Product Visibility Control</div>
          <div className="feature-text">
            Choose which products are visible to customers or staff — perfect for limited items or internal stock.
          </div>
        </div>

        <div className="feature-card">
          <FaBarcode className="icon" />
          <div className="feature-title">Barcode / QR Integration</div>
          <div className="feature-text">
            Scan items quickly for updates, stock checks, or adding to order — saves time and reduces errors.
          </div>
        </div>
      </div>

      <div className="footer-note">
        Manage smarter, sell faster — let your products shine with clarity and precision.
      </div>
    </div>
  );
}
