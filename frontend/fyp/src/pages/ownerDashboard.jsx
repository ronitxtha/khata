import React, { useState, useEffect } from "react";
import axios from "axios";
import QRScanner from "./QRScanner"; 
import "../styles/ownerDashboard.css";

const OwnerDashboard = () => {
  const [owner, setOwner] = useState({});
  const [staffList, setStaffList] = useState([]);
  const [products, setProducts] = useState([]);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImage, setProductImage] = useState(null);

  const [qrVisible, setQrVisible] = useState({});
  const [message, setMessage] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const API_BASE = "http://localhost:8000";

  // Load owner, staff, products
  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const resOwner = await axios.get(`${API_BASE}/api/owner/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOwner(resOwner.data.owner);

        const resStaff = await axios.get(`${API_BASE}/api/owner/staff`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStaffList(resStaff.data.staff || []);

        const resProducts = await axios.get(`${API_BASE}/api/owner/products`, {
          headers: { Authorization: `Bearer ${token}` },
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
      const formData = new FormData();
      formData.append("name", productName);
      formData.append("price", productPrice);
      formData.append("description", productDescription);
      formData.append("image", productImage);

      const res = await axios.post(`${API_BASE}/api/owner/add-product`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage("Product added successfully!");
      setProducts([...products, res.data.product]);
      setProductName("");
      setProductPrice("");
      setProductDescription("");
      setProductImage(null);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error adding product");
    }
  };

  // Toggle QR visibility
  const toggleQR = (productId) => {
    setQrVisible((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  // Download QR
  const downloadQR = async (productId) => {
    try {
      const token = localStorage.getItem("accessToken");

      const res = await axios.get(`${API_BASE}/api/owner/download-qr/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `product-${productId}-qr.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed", err);
      alert("Download failed");
    }
  };

  // Handle QR scan success
  const handleScanSuccess = async (decodedText) => {
    try {
      const productId = decodedText;
      const token = localStorage.getItem("accessToken");

      const res = await axios.get(`${API_BASE}/api/owner/product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const scannedProduct = res.data.product;

      setProducts((prev) => [...prev, scannedProduct]);
      setMessage(`Scanned & added: ${scannedProduct.name}`);

      setScannerOpen(false); // close scanner after scan
    } catch (err) {
      console.error(err);
      setMessage("Invalid or unknown QR code");
    }
  };

  return (
    <div className="dashboard-container">
      <header>
        <h1>Welcome, {owner?.username || "Owner"}</h1>
      </header>

      {/* Scan Product QR */}
      <button className="scan-btn" onClick={() => setScannerOpen(true)}>
        Scan Product QR
      </button>

      {/* QR Scanner */}
      {scannerOpen && (
  <QRScanner
    onScanSuccess={handleScanSuccess}
    onClose={() => setScannerOpen(false)}
  />
)}


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
            <li key={staff._id}>
              {staff.username} ({staff.email})
            </li>
          ))}
        </ul>
      </section>

      {/* Add Product */}
      <section className="add-product-section">
        <h2>Add Product</h2>
        <form onSubmit={handleAddProduct} encType="multipart/form-data">
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
          <textarea
            placeholder="Description"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            required
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProductImage(e.target.files[0])}
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
            <li key={p._id} style={{ marginBottom: "15px" }}>
              {p.name} - NPR {p.price}
              <button onClick={() => toggleQR(p._id)} style={{ marginLeft: "10px" }}>
                {qrVisible[p._id] ? "Hide QR" : "Show QR"}
              </button>
              {qrVisible[p._id] && p.qrCode && (
                <div className="qr-code-section" style={{ marginTop: "10px" }}>
                  <img
                    src={`http://localhost:8000/${p.qrCode}`}
                    alt="QR Code"
                    width="150"
                    style={{ display: "block", marginBottom: "5px" }}
                  />
                  <button onClick={() => downloadQR(p._id)}>Download QR</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default OwnerDashboard;
