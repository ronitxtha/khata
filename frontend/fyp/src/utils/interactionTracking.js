import axios from "axios";
import { API_BASE } from "../config/api.js";

const API_BASE_URL = API_BASE;

export const trackInteraction = async (interactionType, productId = null, category = null, searchQuery = null) => {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) return;

    await axios.post(
      `${API_BASE_URL}/api/recommendations/track`,
      {
        interactionType,
        productId,
        category,
        searchQuery
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  } catch (error) {
    console.error("Error tracking interaction:", error);
  }
};

export const trackProductView = (productId, category) => {
  trackInteraction("product_view", productId, category);
};

export const trackProductClick = (productId) => {
  trackInteraction("product_click", productId);
};

export const trackCategoryView = (category) => {
  trackInteraction("category_view", null, category);
};

export const trackSearch = (searchQuery) => {
  trackInteraction("search", null, null, searchQuery);
};
