import React, { useState, useEffect } from "react";
import axios from "axios";
import QRScanner from "./QRScanner"; 
import "../styles/ownerDashboard.css";

const OwnerDashboard = () => {
  const [owner, setOwner] = useState({});
  const [staffList, setStaffList] = useState([]);
  const [products, setProducts] = useState([]);
  const [scannedProduct, setScannedProduct] = useState(null);

  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImage, setProductImage] = useState(null);

  const [qrVisible, setQrVisible] = useState({});
  const [message, setMessage] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [productCategory, setProductCategory] = useState("");


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

  //Catagory fetch
  const CATEGORY_LIST = [
  "Electronics",
  "Fashion",
  "Beauty & Personal Care",
  "Home & Kitchen",
  "Books & Stationery",
  "Toys & Games",
  "Sports & Fitness",
  "Automotive",
  "Others",
];


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

  if (!productCategory) {
    setMessage("Please select a product category");
    return;
  }

  try {
    const token = localStorage.getItem("accessToken");
    const formData = new FormData();
    formData.append("name", productName);
    formData.append("price", productPrice);
    formData.append("description", productDescription);
    formData.append("image", productImage);
    formData.append("category", productCategory); // ✅ already added

    const res = await axios.post(`${API_BASE}/api/owner/add-product`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setMessage("Product added successfully!");
    setProducts([...products, res.data.product]);
    setProductName("");
    setProductPrice("");
    setProductDescription("");
    setProductCategory(""); // reset after submission
    setProductImage(null);
  } catch (err) {
    console.error(err);
    setMessage(err.response?.data?.message || "Error adding product");
  }
};


  // Re-add deleted product

const handleAddProductAgain = async (product) => {
  try {
    const token = localStorage.getItem("accessToken");
    const formData = new FormData();

    formData.append("name", product.name);
    formData.append("price", product.price);
    formData.append("description", product.description);
    formData.append("category", product.category || "Others"); // make sure category is included

    // Append existing image if available
    if (product.imageFile) {
      const imageResponse = await fetch(`http://localhost:8000/${product.imageFile}`);
      const imageBlob = await imageResponse.blob();
      const fileName = product.imageFile.split("/").pop();
      const imageFile = new File([imageBlob], fileName, { type: imageBlob.type });
      formData.append("image", imageFile);
    }

    const res = await axios.post(`${API_BASE}/api/owner/add-product`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Update products list
    setProducts((prevProducts) => [...prevProducts, res.data.product]);

    // Clear scanned product immediately to prevent multiple clicks
    setScannedProduct(null);

    setMessage("Product added again successfully!");
  } catch (err) {
    console.error(err);
    setMessage(err.response?.data?.message || "Error adding product again");
  }
};

// Delete staff
const handleDeleteStaff = async (staffId) => {
  try {
    const token = localStorage.getItem("accessToken");
    await axios.delete(`${API_BASE}/api/owner/delete-staff/${staffId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setStaffList(staffList.filter((s) => s._id !== staffId));
    setMessage("Staff deleted successfully");
  } catch (err) {
    console.error(err);
    setMessage(err.response?.data?.message || "Error deleting staff");
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

  // Delete product (soft delete)
  const handleDeleteProduct = async (productId) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_BASE}/api/owner/delete-product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(products.filter((p) => p._id !== productId));
      setMessage("Product deleted successfully");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Delete failed");
    }
  };

  // Handle QR scan success
  const handleScanSuccess = async (productId) => {
  try {
    const token = localStorage.getItem("accessToken");
    const res = await axios.get(`${API_BASE}/api/owner/product/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data.success && res.data.product) {
      const product = res.data.product;
      setScannedProduct({
        ...product,
        deleted: !!product.deleted,
        imageFile: product.image ? product.image : null, // store image reference
      });
    } else {
      setScannedProduct({
        name: "Product not found",
        price: "-",
        description: "-",
        deleted: true,
        imageFile: null,
      });
    }

    setScannerOpen(false);
  } catch (err) {
    console.error("Product fetch failed:", err.response?.data || err.message);
    setScannedProduct({
      name: "Product not found",
      price: "-",
      description: "-",
      deleted: true,
      imageFile: null,
    });
    setScannerOpen(false);
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

      {/* Display Scanned Product */}
      {scannedProduct && (
        <div className="scanned-product" style={{ marginTop: "15px" }}>
          <h3>
            {scannedProduct.name}
            {scannedProduct.deleted ? " (Deleted)" : ""}
          </h3>
          <p>Price: NPR {scannedProduct.price}</p>
          <p>{scannedProduct.description}</p>

          {scannedProduct.deleted && (
            <button
              onClick={() => handleAddProductAgain(scannedProduct)}
              style={{ marginTop: "10px" }}
            >
              Add Product Again
            </button>
          )}
        </div>
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
      <li key={staff._id} className="staff-item">
        <span>{staff.username} ({staff.email})</span>
        <button
          className="delete-staff-btn"
          onClick={() => handleDeleteStaff(staff._id)}
        >
          Delete
        </button>
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
          <select
  value={productCategory}
  onChange={(e) => setProductCategory(e.target.value)}
  required
>
  <option value="">Select Category</option>
  {CATEGORY_LIST.map((cat) => (
    <option key={cat} value={cat}>
      {cat}
    </option>
  ))}
</select>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProductImage(e.target.files[0])}
          />
          <button type="submit">Add Product</button>
        </form>
      </section>

      {/* Product List */}
      <section className="product-list">
        <h2>Products</h2>
        <ul>
          {Array.isArray(products) && products.length > 0 ? (
            products.map((p) => (
              <li key={p._id} style={{ marginBottom: "15px" }}>
                {p.name} - NPR {p.price} ({p.category})


                <button
                  onClick={() => toggleQR(p._id)}
                  style={{ marginLeft: "10px" }}
                >
                  {qrVisible[p._id] ? "Hide QR" : "Show QR"}
                </button>

                <button
                  onClick={() => handleDeleteProduct(p._id)}
                  style={{
                    marginLeft: "10px",
                    backgroundColor: "red",
                    color: "white",
                  }}
                >
                  Delete
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
            ))
          ) : (
            <li>No products found</li>
          )}
        </ul>
      </section>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default OwnerDashboard;
