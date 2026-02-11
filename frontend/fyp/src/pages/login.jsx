import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Enter a valid email");
      return false;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return false;
    }
    setError("");
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await axios.post(
        "http://localhost:8000/user/login",
        { email, password }
      );

      if (res.data.success) {
  const user = res.data.user;

  // Store both accessToken and user in localStorage
  localStorage.setItem("accessToken", res.data.accessToken);
  localStorage.setItem("user", JSON.stringify(user)); // <-- ADD THIS

  if (user.role === "owner") navigate("/owner-dashboard");
  else if (user.role === "staff") navigate("/staff-dashboard");
  else navigate("/customer-dashboard");
      } else {
        setError(res.data.message);
      }
    } catch {
      setError("Login failed");
    }
  };

  return (
    <div className="login-wrapper">
      {/* LEFT IMAGE SECTION */}
      <div className="login-image">
        <h1>Smart Khata</h1>
        <p>Manage your accounts smarter & faster</p>
        <img
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f"
          alt="Business"
        />
      </div>

      {/* RIGHT FORM SECTION */}
      <div className="login-form">
        <h2>Welcome Back</h2>
        <p className="form-subtitle">Login to your account</p>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Login</button>
        </form>

        <div className="form-links">
          <span onClick={() => navigate("/forgot-password")}>
            Forgot password?
          </span>
          <span onClick={() => navigate("/register")}>
            Create account
          </span>
        </div>
      </div>
    </div>
  );
}
