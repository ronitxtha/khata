// ============================================================
//  src/config/api.js  —  Central API configuration
//  Import API_BASE or the pre-configured axios instance from
//  here in EVERY file that talks to the backend.
// ============================================================

import axios from "axios";

// Vite exposes env vars via import.meta.env.
// In development the fallback keeps things working without a .env file.
export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// Pre-configured axios instance with base URL + credentials
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // required when backend uses cookies / sessions
});

// Attach the JWT token from localStorage to every request automatically
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
