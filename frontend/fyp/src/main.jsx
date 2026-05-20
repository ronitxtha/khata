import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

import App from "./App.jsx"; // we will define routes in App.jsx
import { CartProvider } from "./context/CartContext.jsx";

// Global response interceptor to handle disabled accounts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      const msg = error.response.data?.message || "";
      if (
        msg.toLowerCase().includes("disabled") ||
        msg.toLowerCase().includes("deactivated")
      ) {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user && user._id) {
          user.isActive = false;
          localStorage.setItem("user", JSON.stringify(user));

          // Redirect to their dashboard to show the DisabledAccountPopup
          if (user.role === "owner") {
            window.location.href = "/owner-dashboard";
          } else if (user.role === "staff") {
            window.location.href = "/staff-dashboard";
          } else if (user.role === "customer") {
            window.location.href = "/customer-dashboard";
          } else {
            window.location.href = "/login";
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </StrictMode>
);

