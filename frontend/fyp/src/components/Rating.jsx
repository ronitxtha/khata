import React from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

// A reusable rating component with star icons from react-icons
const Rating = ({ value, text, color = "#ffc107", fontSize = "14px" }) => {
  return (
    <div className="rating">
      <span style={{ fontSize, color }}>
        {value >= 1 ? (
          <FaStar />
        ) : value >= 0.5 ? (
          <FaStarHalfAlt />
        ) : (
          <FaRegStar />
        )}
      </span>
      <span style={{ fontSize, color }}>
        {value >= 2 ? (
          <FaStar />
        ) : value >= 1.5 ? (
          <FaStarHalfAlt />
        ) : (
          <FaRegStar />
        )}
      </span>
      <span style={{ fontSize, color }}>
        {value >= 3 ? (
          <FaStar />
        ) : value >= 2.5 ? (
          <FaStarHalfAlt />
        ) : (
          <FaRegStar />
        )}
      </span>
      <span style={{ fontSize, color }}>
        {value >= 4 ? (
          <FaStar />
        ) : value >= 3.5 ? (
          <FaStarHalfAlt />
        ) : (
          <FaRegStar />
        )}
      </span>
      <span style={{ fontSize, color }}>
        {value >= 5 ? (
          <FaStar />
        ) : value >= 4.5 ? (
          <FaStarHalfAlt />
        ) : (
          <FaRegStar />
        )}
      </span>
      <span className="rating-text" style={{ fontSize, marginLeft: "5px", color: "var(--text-muted, #777)" }}>
        {text && text}
      </span>
    </div>
  );
};

export default Rating;
