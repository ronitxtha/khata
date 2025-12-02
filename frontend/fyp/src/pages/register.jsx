import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/register.css";

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("customer"); // default customer
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

  // handle user exists message
  if (backend?.message) {
    setError(backend.message);
  }
  // handle yup validation errors
  else if (backend?.errors) {
    setError(backend.errors[0]);
  }
  else {
    setError("Registration failed");
  }

  setSuccess("");
}

  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleRegister}>
       

        <label>Full Name</label>
        <input
          type="text"
          placeholder="Full Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label>Enter your email</label>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
         <label>Select Role</label>
         
        <select value={role} onChange={(e) => setRole(e.target.value)}>
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
