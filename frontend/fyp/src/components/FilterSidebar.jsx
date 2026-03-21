import React from "react";

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
  "Others"
];

const FilterSidebar = ({ 
  selectedCategory, 
  setSelectedCategory, 
  minPrice, 
  setMinPrice, 
  maxPrice, 
  setMaxPrice,
  onClear,
  isOpen,
  setIsOpen
}) => {
  return (
    <aside className={`sd-sidebar-right ${isOpen ? "open-mobile" : ""}`}>
      <div className="filter-section">
        <h3 className="filter-title">🔍 Filter Products</h3>
        
        <div className="filter-group">
          <label>Category</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
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
            <span className="price-separator">-</span>
            <input 
              type="number" 
              placeholder="Max" 
              value={maxPrice} 
              onChange={(e) => setMaxPrice(e.target.value)}
              className="filter-input-small"
            />
          </div>
        </div>

        <button className="clear-filter-btn" onClick={onClear}>
          🧹 Clear All Filters
        </button>
      </div>
    </aside>
  );
};

export default FilterSidebar;
