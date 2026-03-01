import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import "../styles/ownerProfile.css";

const OwnerProfile = () => {
  const API_BASE = "http://localhost:8000";
  const token = localStorage.getItem("accessToken");

  // ==================== STATE MANAGEMENT ====================
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    message: "",
    type: "success",
    visible: false,
  });
  const [statistics, setStatistics] = useState({
    totalProducts: 0,
    totalOrders: 0,
    lowStockProducts: 0,
    lowStockDetails: [],
  });

  // Profile Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    username: "",
    phone: "",
  });

  // Shop Info Edit States
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [shopFormData, setShopFormData] = useState({
    shopName: "",
    shopEmail: "",
    shopPhone: "",
    shopAddress: "",
    province: "",
    district: "",
    municipality: "",
    ward: "",
  });

  // Change Password States
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Image Upload States
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [shopLogoPreview, setShopLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Nepal Location Data
  const nepalData = {
    provinces: [
      "Bagmati",
      "Dhawalagiri",
      "gandaki",
      "Karnali",
      "Lumbini",
      "Madhesh",
      "Mechi",
      "Sagarmatha",
    ],
    districts: {
      Bagmati: ["Kathmandu", "Bhaktapur", "Lalitpur", "Kavre", "Sindhuli"],
      Dhawalagiri: ["Baglung", "Myagdi", "Parbat"],
      gandaki: ["Gorkha", "Lamjung", "Manang", "Kaski", "Syangja"],
      Karnali: ["Dailekh", "Jumla", "Dolpa"],
      Lumbini: ["Gulmi", "Palpa", "Nawalparasi", "Rupandehi"],
      Madhesh: ["Parsa", "Bara", "Rautahat", "Saptari"],
      Mechi: ["Ilam", "Jhapa"],
      Sagarmatha: ["Dolakha", "Khotang", "Solukhumbu"],
    },
    municipalities: {
      Kathmandu: ["Kathmandu", "Budhanilkantha", "Naksal"],
      Lalitpur: ["Lalitpur", "Mahalaxmi"],
      Bhaktapur: ["Bhaktapur", "Suryabinayak"],
      Gulmi: ["Gulmi", "Resunga"],
      Ilam: ["Ilam", "Mai"],
    },
  };

  // ==================== TOAST NOTIFICATION ====================
  const showToast = (message, type = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast({ ...toast, visible: false });
    }, 3000);
  };

  // ==================== FETCH PROFILE ====================
  useEffect(() => {
    fetchProfile();
    fetchStatistics();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/owner/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const ownerData = response.data.data;
      setProfile(ownerData);
      setEditFormData({
        username: ownerData.username || "",
        phone: ownerData.phone || "",
      });
      setShopFormData({
        shopName: ownerData.shopName || "",
        shopEmail: ownerData.shopEmail || "",
        shopPhone: ownerData.shopPhone || "",
        shopAddress: ownerData.shopAddress || "",
        province: ownerData.province || "",
        district: ownerData.district || "",
        municipality: ownerData.municipality || "",
        ward: ownerData.ward || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      showToast(
        error.response?.data?.message || "Failed to load profile",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/owner/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setStatistics(response.data.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  // ==================== PROFILE EDIT HANDLERS ====================
  const handleProfileEdit = () => {
    setIsEditingProfile(true);
  };

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      await axios.put(
        `${API_BASE}/api/owner/profile`,
        {
          username: editFormData.username,
          phone: editFormData.phone,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      showToast("Profile updated successfully", "success");
      setIsEditingProfile(false);
      fetchProfile();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to update profile",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProfileCancel = () => {
    setIsEditingProfile(false);
    setEditFormData({
      username: profile?.username || "",
      phone: profile?.phone || "",
    });
  };

  // ==================== SHOP INFO EDIT HANDLERS ====================
  const handleShopEdit = () => {
    setIsEditingShop(true);
  };

  const handleShopSave = async () => {
    try {
      setLoading(true);
      await axios.put(
        `${API_BASE}/api/owner/profile`,
        shopFormData,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      showToast("Shop information updated successfully", "success");
      setIsEditingShop(false);
      fetchProfile();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to update shop info",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShopCancel = () => {
    setIsEditingShop(false);
    setShopFormData({
      shopName: profile?.shopName || "",
      shopEmail: profile?.shopEmail || "",
      shopPhone: profile?.shopPhone || "",
      shopAddress: profile?.shopAddress || "",
      province: profile?.province || "",
      district: profile?.district || "",
      municipality: profile?.municipality || "",
      ward: profile?.ward || "",
    });
  };

  // ==================== PASSWORD CHANGE HANDLER ====================
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      showToast("Current password is required", "error");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast("New password must be at least 6 characters", "error");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    try {
      setLoading(true);
      await axios.put(
        `${API_BASE}/api/owner/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      showToast("Password changed successfully", "success");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to change password",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================== IMAGE UPLOAD HANDLERS ====================
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShopLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImageHandler = async () => {
    const fileInput = document.getElementById("profileImageInput");
    const file = fileInput?.files[0];

    if (!file) {
      showToast("Please select an image", "error");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await axios.post(
        `${API_BASE}/api/owner/upload-profile-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      showToast("Profile image uploaded successfully", "success");
      setProfileImagePreview(null);
      fileInput.value = "";
      fetchProfile();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to upload profile image",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const uploadShopLogoHandler = async () => {
    const fileInput = document.getElementById("shopLogoInput");
    const file = fileInput?.files[0];

    if (!file) {
      showToast("Please select a logo", "error");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("shopLogo", file);

      const response = await axios.post(
        `${API_BASE}/api/owner/upload-shop-logo`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      showToast("Shop logo uploaded successfully", "success");
      setShopLogoPreview(null);
      fileInput.value = "";
      fetchProfile();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to upload shop logo",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="owner-profile-container">
        <Sidebar />
        <div className="profile-content">
          <div className="loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-profile-container">
      <Sidebar />
      <div className="profile-content">
        {/* Toast Notification */}
        {toast.visible && (
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        )}

        {/* ==================== PROFILE OVERVIEW CARD ==================== */}
        <div className="profile-card">
          <h2 className="card-title">Profile Overview</h2>

          <div className="profile-overview">
            <div className="profile-image-section">
              {profile?.profileImage ? (
                <img
                  src={`${API_BASE}/${profile.profileImage}`}
                  alt="Profile"
                  className="profile-image"
                />
              ) : (
                <div className="profile-image-placeholder">
                  <span>📷</span>
                </div>
              )}
            </div>

            <div className="profile-info">
              {!isEditingProfile ? (
                <>
                  <div className="info-row">
                    <label>Name:</label>
                    <span>{profile?.username}</span>
                  </div>
                  <div className="info-row">
                    <label>Email:</label>
                    <span className="read-only">{profile?.email}</span>
                  </div>
                  <div className="info-row">
                    <label>Phone:</label>
                    <span>{profile?.phone || "Not provided"}</span>
                  </div>
                  <div className="info-row">
                    <label>Role:</label>
                    <span>{profile?.role}</span>
                  </div>
                  <div className="info-row">
                    <label>Member Since:</label>
                    <span>
                      {new Date(profile?.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="button-group">
                    <button
                      className="btn btn-primary"
                      onClick={handleProfileEdit}
                    >
                      ✏️ Edit Profile
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={editFormData.username}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          username: e.target.value,
                        })
                      }
                      placeholder="Enter name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profile?.email}
                      readOnly
                      className="read-only-input"
                      placeholder="Email (read-only)"
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          phone: e.target.value,
                        })
                      }
                      placeholder="Enter phone"
                    />
                  </div>

                  <div className="button-group">
                    <button
                      className="btn btn-success"
                      onClick={handleProfileSave}
                      disabled={loading}
                    >
                      ✓ Save
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={handleProfileCancel}
                      disabled={loading}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ==================== SHOP INFORMATION CARD ==================== */}
        <div className="profile-card">
          <h2 className="card-title">Shop Information</h2>

          {!isEditingShop ? (
            <>
              <div className="shop-info">
                <div className="shop-logo-section">
                  {profile?.shopLogo ? (
                    <img
                      src={`${API_BASE}/${profile.shopLogo}`}
                      alt="Shop Logo"
                      className="shop-logo"
                    />
                  ) : (
                    <div className="shop-logo-placeholder">
                      <span>🏪</span>
                    </div>
                  )}
                </div>

                <div className="shop-details">
                  <div className="info-row">
                    <label>Shop Name:</label>
                    <span>{profile?.shopName || "Not provided"}</span>
                  </div>
                  <div className="info-row">
                    <label>Email:</label>
                    <span>{profile?.shopEmail || "Not provided"}</span>
                  </div>
                  <div className="info-row">
                    <label>Phone:</label>
                    <span>{profile?.shopPhone || "Not provided"}</span>
                  </div>
                  <div className="info-row">
                    <label>Address:</label>
                    <span>{profile?.shopAddress || "Not provided"}</span>
                  </div>
                  <div className="location-info">
                    <div className="info-row">
                      <label>Province:</label>
                      <span>{profile?.province || "Not provided"}</span>
                    </div>
                    <div className="info-row">
                      <label>District:</label>
                      <span>{profile?.district || "Not provided"}</span>
                    </div>
                    <div className="info-row">
                      <label>Municipality:</label>
                      <span>{profile?.municipality || "Not provided"}</span>
                    </div>
                    <div className="info-row">
                      <label>Ward:</label>
                      <span>{profile?.ward || "Not provided"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="button-group">
                <button className="btn btn-primary" onClick={handleShopEdit}>
                  ✏️ Edit Shop Info
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="form-grid">
                <div className="form-group">
                  <label>Shop Name</label>
                  <input
                    type="text"
                    value={shopFormData.shopName}
                    onChange={(e) =>
                      setShopFormData({
                        ...shopFormData,
                        shopName: e.target.value,
                      })
                    }
                    placeholder="Enter shop name"
                  />
                </div>

                <div className="form-group">
                  <label>Shop Email</label>
                  <input
                    type="email"
                    value={shopFormData.shopEmail}
                    onChange={(e) =>
                      setShopFormData({
                        ...shopFormData,
                        shopEmail: e.target.value,
                      })
                    }
                    placeholder="Enter shop email"
                  />
                </div>

                <div className="form-group">
                  <label>Shop Phone</label>
                  <input
                    type="tel"
                    value={shopFormData.shopPhone}
                    onChange={(e) =>
                      setShopFormData({
                        ...shopFormData,
                        shopPhone: e.target.value,
                      })
                    }
                    placeholder="Enter shop phone"
                  />
                </div>

                <div className="form-group">
                  <label>Shop Address</label>
                  <input
                    type="text"
                    value={shopFormData.shopAddress}
                    onChange={(e) =>
                      setShopFormData({
                        ...shopFormData,
                        shopAddress: e.target.value,
                      })
                    }
                    placeholder="Enter shop address"
                  />
                </div>

                <div className="form-group">
                  <label>Province</label>
                  <select
                    value={shopFormData.province}
                    onChange={(e) =>
                      setShopFormData({
                        ...shopFormData,
                        province: e.target.value,
                        district: "",
                        municipality: "",
                        ward: "",
                      })
                    }
                  >
                    <option value="">Select Province</option>
                    {nepalData.provinces.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>District</label>
                  <select
                    value={shopFormData.district}
                    onChange={(e) =>
                      setShopFormData({
                        ...shopFormData,
                        district: e.target.value,
                        municipality: "",
                        ward: "",
                      })
                    }
                    disabled={!shopFormData.province}
                  >
                    <option value="">Select District</option>
                    {shopFormData.province &&
                      nepalData.districts[shopFormData.province]?.map(
                        (dist) => (
                          <option key={dist} value={dist}>
                            {dist}
                          </option>
                        )
                      )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Municipality</label>
                  <select
                    value={shopFormData.municipality}
                    onChange={(e) =>
                      setShopFormData({
                        ...shopFormData,
                        municipality: e.target.value,
                        ward: "",
                      })
                    }
                    disabled={!shopFormData.district}
                  >
                    <option value="">Select Municipality</option>
                    {shopFormData.district &&
                      nepalData.municipalities[shopFormData.district]?.map(
                        (mun) => (
                          <option key={mun} value={mun}>
                            {mun}
                          </option>
                        )
                      )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Ward</label>
                  <input
                    type="number"
                    min="1"
                    max="32"
                    value={shopFormData.ward}
                    onChange={(e) =>
                      setShopFormData({
                        ...shopFormData,
                        ward: e.target.value,
                      })
                    }
                    placeholder="Enter ward number"
                  />
                </div>
              </div>

              <div className="button-group">
                <button
                  className="btn btn-success"
                  onClick={handleShopSave}
                  disabled={loading}
                >
                  ✓ Save
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleShopCancel}
                  disabled={loading}
                >
                  ✕ Cancel
                </button>
              </div>
            </>
          )}
        </div>

        {/* ==================== CHANGE PASSWORD CARD ==================== */}
        <div className="profile-card">
          <h2 className="card-title">Change Password</h2>

          <form onSubmit={handlePasswordChange} className="password-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Enter new password (min 6 characters)"
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              🔐 Change Password
            </button>
          </form>
        </div>

        {/* ==================== STATISTICS CARD ==================== */}
        <div className="profile-card">
          <h2 className="card-title">Account Statistics</h2>

          <div className="statistics-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <div className="stat-number">{statistics.totalProducts}</div>
                <div className="stat-label">Total Products</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <div className="stat-number">{statistics.totalOrders}</div>
                <div className="stat-label">Total Orders</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🚨</div>
              <div className="stat-content">
                <div className="stat-number">{statistics.lowStockProducts}</div>
                <div className="stat-label">Low Stock Products</div>
              </div>
            </div>
          </div>

          {statistics.lowStockDetails.length > 0 && (
            <div className="low-stock-section">
              <h3>Low Stock Products</h3>
              <table className="low-stock-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Current Quantity</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.lowStockDetails.map((product) => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td className="quantity-low">{product.quantity}</td>
                      <td>Rs. {product.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ==================== IMAGE UPLOAD CARD ==================== */}
        <div className="profile-card">
          <h2 className="card-title">Upload Images</h2>

          <div className="upload-grid">
            <div className="upload-section">
              <h3>Profile Image</h3>
              <div className="upload-preview">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Preview"
                    className="preview-img"
                  />
                ) : (
                  <div className="preview-placeholder">
                    <span>📷</span>
                    <p>No preview</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="profileImageInput"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="file-input"
              />
              <button
                className="btn btn-primary"
                onClick={uploadProfileImageHandler}
                disabled={uploading || !profileImagePreview}
              >
                {uploading ? "⏳ Uploading..." : "📤 Upload Profile Image"}
              </button>
            </div>

            <div className="upload-section">
              <h3>Shop Logo</h3>
              <div className="upload-preview">
                {shopLogoPreview ? (
                  <img
                    src={shopLogoPreview}
                    alt="Preview"
                    className="preview-img"
                  />
                ) : (
                  <div className="preview-placeholder">
                    <span>🏪</span>
                    <p>No preview</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="shopLogoInput"
                accept="image/*"
                onChange={handleShopLogoChange}
                className="file-input"
              />
              <button
                className="btn btn-primary"
                onClick={uploadShopLogoHandler}
                disabled={uploading || !shopLogoPreview}
              >
                {uploading ? "⏳ Uploading..." : "📤 Upload Shop Logo"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerProfile;
