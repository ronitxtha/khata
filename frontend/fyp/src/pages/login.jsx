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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await axios.post("http://localhost:8000/user/login", {
        email,
        password,
      });
      if (res.data.success) {
        setSuccess(res.data.message);
        setError("");
        // optionally save tokens and navigate
        localStorage.setItem("accessToken", res.data.accessToken);
        navigate("/home");
      } else {
        setError(res.data.message);
        setSuccess("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      setSuccess("");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleLogin}>
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
        <button type="submit">Login</button>
      </form>
      <p>
        Forgot password?{" "}
        <span onClick={() => navigate("/forgot-password")}>Click here</span>
      </p>
      <p>
        Don’t have an account?{" "}
        <span onClick={() => navigate("/register")}>Sign Up</span>
      </p>
    </div>
  );
}
