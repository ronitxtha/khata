import React, { useState, useEffect } from "react";
import axios from "axios";
import QRScanner from "./QRScanner"; 
import "../styles/ownerDashboard.css";

const OwnerDashboard = () => {
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });

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

  const [scannerOpen, setScannerOpen] = useState(false);
  const [productCategory, setProductCategory] = useState("");
  const [productQuantity, setProductQuantity] = useState("");

const [editingProduct, setEditingProduct] = useState(null);
const [editName, setEditName] = useState("");
const [editPrice, setEditPrice] = useState("");
const [editQuantity, setEditQuantity] = useState("");
const [editCategory, setEditCategory] = useState("");
const [editDescription, setEditDescription] = useState("");
const [attendanceList, setAttendanceList] = useState([]);



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

        const resAttendance = await axios.get(
  `${API_BASE}/api/owner/today-attendance`,
  { headers: { Authorization: `Bearer ${token}` } }
);

setAttendanceList(resAttendance.data.attendance || []);


        const resProducts = await axios.get(`${API_BASE}/api/owner/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(resProducts.data.products || []);
      } catch (err) {
        console.error(err);
        showToast(err.response?.data?.message || "Error loading data");
      }
    };
    fetchOwnerData();
  }, []);

  const showToast = (message, type = "success", duration = 3000) => {
  setToast({ message, type, visible: true });
  setTimeout(() => {
    setToast({ ...toast, visible: false });
  }, duration);
};


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

const handleEditClick = (product) => {
  setEditingProduct(product._id);
  setEditName(product.name || "");
  setEditPrice(product.price || "");
  setEditQuantity(product.quantity || "");
  setEditCategory(product.category || "Others");
  setEditDescription(product.description || "");
};


const handleUpdateProduct = async (e, productId) => {
  e.preventDefault(); // ⚠ THIS IS CRITICAL
  try {
    const token = localStorage.getItem("accessToken");

    const res = await axios.put(
  `${API_BASE}/api/owner/update-product/${productId}`,
  {
    name: editName,
    price: editPrice,
    quantity: editQuantity,
    category: editCategory,
    description: editDescription,
  },
  { headers: { Authorization: `Bearer ${token}` } }
);

// ✅ Update products state
setProducts((prev) =>
  prev.map((p) => (p._id === productId ? res.data.product : p))
);

setEditingProduct(null);
showToast("Product added successfully!", "success");


  } catch (err) {
    console.error(err);
    showToast(err.response?.data?.message || "Update failed");
  }
};


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

      showToast(`Staff added: ${staffName}, password: ${password}`);
      setStaffList([...staffList, res.data.staff]);
      setStaffName("");
      setStaffEmail("");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Error adding staff");
    }
  };

  // Add product
  const handleAddProduct = async (e) => {
  e.preventDefault();

  if (!productCategory) {
    showToast("Please select a product category");
    return;
  }

  try {
    const token = localStorage.getItem("accessToken");
    const formData = new FormData();
    formData.append("name", productName);
    formData.append("price", productPrice);
    formData.append("quantity", productQuantity);

    formData.append("description", productDescription);
    formData.append("image", productImage);
    formData.append("category", productCategory); // ✅ already added

    const res = await axios.post(`${API_BASE}/api/owner/add-product`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    showToast("Product added successfully!");
    setProducts([...products, res.data.product]);
    setProductName("");
    setProductPrice("");
    setProductQuantity("");

    setProductDescription("");
    setProductCategory(""); // reset after submission
    setProductImage(null);
  } catch (err) {
    console.error(err);
    showToast(err.response?.data?.message || "Error adding product");
  }
};


  // Re-add deleted product

const handleAddProductAgain = async (product) => {
  try {
    const token = localStorage.getItem("accessToken");
    const formData = new FormData();

    // Use defaults to avoid backend 500 errors
    formData.append("name", product.name || "Unnamed Product");
    formData.append("price", product.price ?? 0);
    formData.append("quantity", product.quantity ?? 1); // make sure quantity is included
    formData.append("description", product.description || "");
    formData.append("category", product.category || "Others");

    // Append existing image if available
    if (product.imageFile) {
      try {
        const imageResponse = await fetch(`${API_BASE}/${product.imageFile}`);
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          const fileName = product.imageFile.split("/").pop() || "product.png";
          const imageFile = new File([imageBlob], fileName, { type: imageBlob.type });
          formData.append("image", imageFile);
        }
      } catch (imgErr) {
        console.warn("Failed to fetch product image, skipping image.", imgErr);
      }
    }

    const res = await axios.post(`${API_BASE}/api/owner/add-product`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Update products list
    setProducts((prevProducts) => [...prevProducts, res.data.product]);

    // Clear scanned product immediately
    setScannedProduct(null);

    // Show toast notification
    showToast("Product added again successfully!");
  } catch (err) {
    console.error("Re-add product failed:", err.response?.data || err.message);
    showToast(err.response?.data?.message || "Error adding product again");
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
    showToast("Staff deleted successfully");
  } catch (err) {
    console.error(err);
    showToast(err.response?.data?.message || "Error deleting staff");
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
      showToast("Product deleted successfully");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Delete failed");
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
<section className="attendance-section">
  <h2>Today's Staff Attendance</h2>

  {attendanceList.length === 0 ? (
    <p className="no-attendance">No attendance recorded today</p>
  ) : (
    <div className="attendance-grid">
      {attendanceList.map((a) => {
        const isWorking = !a.lastLogoutClick;
        const statusColor = isWorking ? "#28a745" : "#6c757d"; // green for working, gray for logged out
        const statusIcon = isWorking ? "🟢" : "✔️"; // green dot or check
        const statusText = isWorking ? "Present" : "Logged out";

        return (
          <div
            key={a._id}
            className="attendance-card"
            style={{ borderLeft: `5px solid ${statusColor}` }}
          >
            <h4>{a.staffId?.username}</h4>
            <p className="email">{a.staffId?.email}</p>

            <p className="status">
              Status:{" "}
              <strong style={{ color: statusColor }}>
                {statusIcon} {statusText}
              </strong>
            </p>

            {a.checkInTime && (
              <p className="login">
                Login: {new Date(a.checkInTime).toLocaleTimeString()}
              </p>
            )}

            {a.lastLogoutClick && (
              <p className="logout">
                Logout: {new Date(a.lastLogoutClick).toLocaleTimeString()}
              </p>
            )}
          </div>
        );
      })}
    </div>
  )}
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
      products.map((p) => 
        p ? ( // ✅ check product exists
          <li key={p._id || Math.random()} style={{ marginBottom: "15px" }}>
            {p.name || "Unnamed"} - NPR {p.price ?? 0} | Qty: {p.quantity ?? 0} ({p.category || "Others"})

            <button
              onClick={() => toggleQR(p._id)}
              style={{ marginLeft: "10px" }}
            >
              {qrVisible[p._id] ? "Hide QR" : "Show QR"}
            </button>

            <button
              onClick={() => handleEditClick(p)}
              style={{
                marginLeft: "10px",
                backgroundColor: "#4caf50",
                color: "white",
              }}
            >
              Edit
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

            {/* Edit Form */}
            {editingProduct === p._id && (
              <form
                onSubmit={(e) => handleUpdateProduct(e, p._id)}
                style={{
                  marginTop: "10px",
                  padding: "10px",
                  border: "1px solid #ccc",
                }}
              >
                <input
                  type="text"
                  value={editName || ""}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Product Name"
                  required
                />

                <input
                  type="number"
                  value={editPrice ?? ""}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="Price"
                  required
                />

                <input
                  type="number"
                  value={editQuantity ?? ""}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  placeholder="Quantity"
                  required
                />

                <select
                  value={editCategory || "Others"}
                  onChange={(e) => setEditCategory(e.target.value)}
                  required
                >
                  {CATEGORY_LIST.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <textarea
                  value={editDescription || ""}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description"
                  required
                />

                <button type="submit">Save</button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{ marginLeft: "10px" }}
                >
                  Cancel
                </button>
              </form>
            )}

            {/* QR Code */}
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
        ) : null // skip undefined products
      )
    ) : (
      <li>No products found</li>
    )}
  </ul>
</section>


      {toast.visible && (
  <div className={`toast ${toast.type}`}>
    {toast.message}
  </div>
)}
    </div>
  );
};

export default OwnerDashboard;
