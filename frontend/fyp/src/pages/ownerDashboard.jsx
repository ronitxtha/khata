import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/ownerDashboard.css";

const OwnerDashboard = () => {
  const [owner, setOwner] = useState({});
  const [staffList, setStaffList] = useState([]);
  const [products, setProducts] = useState([]);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [message, setMessage] = useState("");

  const API_BASE = "http://localhost:8000"; // Backend base URL

  // Load owner info, staff, and products
  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        // Owner info
        const resOwner = await axios.get(`${API_BASE}/api/owner/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOwner(resOwner.data.owner);

        // Staff list
        const resStaff = await axios.get(`${API_BASE}/api/owner/staff`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStaffList(resStaff.data.staff || []);

        // Products list
        const resProducts = await axios.get(`${API_BASE}/api/owner/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(resProducts.data.products || []);

      } catch (err) {
        console.error(err);
        setMessage(err.response?.data?.message || "Error loading data");
      }
    };

    fetchOwnerData();
  }, []);

  // Add staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      const password = Math.random().toString(36).slice(-8);

      const res = await axios.post(
        `${API_BASE}/api/owner/add-staff`,
        { name: staffName, email: staffEmail, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(`Staff added: ${staffName}, password: ${password}`);
      setStaffList([...staffList, res.data.staff]);
      setStaffName("");
      setStaffEmail("");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error adding staff");
    }
  };

  // Add product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");

      const res = await axios.post(
        `${API_BASE}/api/owner/add-product`,
        { name: productName, price: productPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(`Product added: ${productName}`);
      setProducts([...products, res.data.product]);
      setProductName("");
      setProductPrice("");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error adding product");
    }
  };

  return (
    <div className="dashboard-container">
      <header>
        <h1>Welcome, {owner?.username || "Owner"}</h1>
      </header>

      {/* Add Staff */}
      <section className="add-staff-section">
        <h2>Add Staff</h2>
        <form onSubmit={handleAddStaff}>
          <input
            type="text"
            placeholder="Staff Name"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Staff Email"
            value={staffEmail}
            onChange={(e) => setStaffEmail(e.target.value)}
            required
          />
          <button type="submit">Add Staff</button>
        </form>
      </section>

      {/* Staff List */}
      <section className="staff-list">
        <h2>Staff List</h2>
        <ul>
          {staffList.map((staff) => (
            <li key={staff._id}>{staff.username} ({staff.email})</li>
          ))}
        </ul>
      </section>

      {/* Add Product */}
      <section className="add-product-section">
        <h2>Add Product</h2>
        <form onSubmit={handleAddProduct}>
          <input
            type="text"
            placeholder="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            required
          />
          <button type="submit">Add Product</button>
        </form>
      </section>

      {/* Product List */}
      <section className="product-list">
        <h2>Products</h2>
        <ul>
          {products.map((p) => (
            <li key={p._id}>{p.name} - ${p.price}</li>
          ))}
        </ul>
      </section>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default OwnerDashboard;
