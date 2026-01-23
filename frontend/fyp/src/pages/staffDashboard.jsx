import React, { useState, useEffect } from "react";
import axios from "axios";
import QRScanner from "./QRScanner";
import "../styles/ownerDashboard.css"; // reuse same CSS

const StaffDashboard = () => {
  const [staff, setStaff] = useState({});
  const [products, setProducts] = useState([]);
  const [scannedProduct, setScannedProduct] = useState(null);

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [productCategory, setProductCategory] = useState("");

  const [qrVisible, setQrVisible] = useState({});
  const [scannerOpen, setScannerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [productQuantity, setProductQuantity] = useState(""); // NEW


  const API_BASE = "http://localhost:8000";

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

  // Load staff + products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const resStaff = await axios.get(`${API_BASE}/api/owner/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStaff(resStaff.data.staff);

        const resProducts = await axios.get(`${API_BASE}/api/owner/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(resProducts.data.products || []);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load staff data");
      }
    };

    fetchData();
  }, []);

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
    formData.append("quantity", productQuantity); // ✅ fixed
    formData.append("description", productDescription);
    formData.append("category", productCategory);
    formData.append("image", productImage);

    const res = await axios.post(`${API_BASE}/api/owner/add-product`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setProducts((prev) => [...prev, res.data.product]);
    setMessage("Product added successfully!");

    setProductName("");
    setProductPrice("");
    setProductQuantity(""); // reset
    setProductDescription("");
    setProductCategory("");
    setProductImage(null);
  } catch (err) {
    console.error(err);
    setMessage("Error adding product");
  }
};


  // Re-add deleted product
  const handleAddProductAgain = async (product) => {
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();

      formData.append("name", product.name);
      formData.append("price", product.price);
      formData.append("quantity", productQuantity);
      formData.append("description", product.description);
      formData.append("category", product.category || "Others");

      if (product.imageFile) {
        const imgRes = await fetch(`${API_BASE}/${product.imageFile}`);
        const blob = await imgRes.blob();
        formData.append("image", new File([blob], "product.png"));
      }

      const res = await axios.post("http://localhost:8000/api/owner/add-product", formData, {
  headers: { Authorization: `Bearer ${token}` },
});

      setProducts((prev) => [...prev, res.data.product]);
      setScannedProduct(null);
      setMessage("Product added again!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to re-add product");
    }
  };

  // QR scan success
  const handleScanSuccess = async (productId) => {
  try {
    const token = localStorage.getItem("accessToken");
    const res = await axios.get(`${API_BASE}/api/owner/product/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const product = res.data.product;
    setScannedProduct({
      ...product,
      deleted: !!product.deleted,
      imageFile: product.image || null,
    });

    setScannerOpen(false);
  } catch {
    setScannedProduct(null);
    setScannerOpen(false);
  }
};

//For loggingout
const handleLogoutClick = async () => {
  try {
    const token = localStorage.getItem("accessToken");

    const res = await axios.post(
      `${API_BASE}/api/staff/logout-click`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setMessage(res.data.message); // "Logout recorded (will be finalized at end of day)"
  } catch (err) {
    console.error(err);
    setMessage("Failed to record logout");
  }
};



  const toggleQR = (id) => {
    setQrVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="dashboard-container">
      <header>
        <h1>Welcome, {staff?.username || "Staff"}</h1>
      </header>

      <button className="scan-btn" onClick={() => setScannerOpen(true)}>
        Scan Product QR
      </button>

      {scannerOpen && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {scannedProduct && (
        <div className="scanned-product">
          <h3>
            {scannedProduct.name}
            {scannedProduct.deleted ? " (Deleted)" : ""}
          </h3>
          <p>NPR {scannedProduct.price}</p>
          <p>{scannedProduct.description}</p>

          {scannedProduct.deleted && (
            <button onClick={() => handleAddProductAgain(scannedProduct)}>
              Add Product Again
            </button>
          )}
        </div>
      )}

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
          <input
  type="number"
  placeholder="Quantity"
  value={productQuantity}
  onChange={(e) => setProductQuantity(e.target.value)}
  min="1"
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
              <option key={cat}>{cat}</option>
            ))}
          </select>

          <input type="file" onChange={(e) => setProductImage(e.target.files[0])} />
          <button type="submit">Add Product</button>
        </form>
      </section>

      <button className="logout-btn" onClick={handleLogoutClick}>
  Logout
</button>


      {/* Product List */}
      <section className="product-list">
        <h2>Products</h2>
        <ul>
          {products.map((p) => (
            <li key={p._id}>
              {p.name} - NPR {p.price} | Qty: {p.quantity} ({p.category})
              <button onClick={() => toggleQR(p._id)}>QR</button>
              {qrVisible[p._id] && p.qrCode && (
                <img src={`${API_BASE}/${p.qrCode}`} width="120" />
              )}
            </li>
          ))}
        </ul>
      </section>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default StaffDashboard;
