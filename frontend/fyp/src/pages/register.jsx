import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/register.css";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateForm = () => {
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
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
    if (!["customer", "owner"].includes(role)) {
      setError("Please select a valid role");
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
      setError(err.response?.data?.message || "Registration failed");
      setSuccess("");
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
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
          <option value="">Select role</option>
          <option value="customer">Customer</option>
          <option value="owner">Owner</option>
        </select>
        <button type="submit">Sign Up</button>
      </form>
      <p>
        Already have an account?{" "}
        <span onClick={() => navigate("/login")}>Login</span>
      </p>
    </div>
  );
}
