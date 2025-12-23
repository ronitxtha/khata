import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/register.css";

export default function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("customer");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateForm = () => {
    if (!["customer", "owner"].includes(role)) {
      setError("Please select a valid role");
      return false;
    }
    if (username.trim().length < 3) {
      setError("Full Name must be at least 3 characters");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format");
      return false;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return false;
    }
    setError("");
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await axios.post("http://localhost:8000/user/register", {
        username,
        email,
        password,
        role,
      });

      if (res.data.success) {
        setSuccess(
          "Registered successfully! Please check your email to verify your account."
        );
        setError("");
      } else {
        setError(res.data.message);
        setSuccess("");
      }
    } catch (err) {
      const backend = err.response?.data;

      if (backend?.message) {
        setError(backend.message);
      } else if (backend?.errors) {
        setError(backend.errors[0]);
      } else {
        setError("Registration failed");
      }
      setSuccess("");
    }
  };

  return (
    <div className="register-wrapper">
      {/* LEFT IMAGE SECTION */}
      <div className="register-image">
        <h1>Smart Khata</h1>
        <p>Create your account and manage business with confidence</p>

        <img
          src="https://images.unsplash.com/photo-1523958203904-cdcb402031fd"
          alt="Business registration"
        />
      </div>

      {/* RIGHT FORM SECTION */}
      <div className="register-form">
        <h2>Create Account</h2>
        <p className="form-subtitle">Start using Smart Khata</p>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Full Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

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

          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="customer">Customer</option>
            <option value="owner">Owner</option>
          </select>

          <button type="submit">Create Account</button>
        </form>

        <div className="form-links">
          <span onClick={() => navigate("/login")}>
            Already have an account? Login
          </span>
        </div>
      </div>
    </div>
  );
}
