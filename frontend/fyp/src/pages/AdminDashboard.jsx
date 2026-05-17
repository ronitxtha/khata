import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { imgUrl } from "../utils/imageUrl";
import DisabledAccountPopup from "../components/DisabledAccountPopup";
import "../styles/ownerDashboard.css";
import { API_BASE } from "../config/api.js";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDisabledPopup, setShowDisabledPopup] = useState(false);
  const [confirmDisableModal, setConfirmDisableModal] = useState({ visible: false, userId: null, username: "" });
  const [searchShopTerm, setSearchShopTerm] = useState("");
  const [searchProductTerm, setSearchProductTerm] = useState("");

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setUsers(res.data.users);
    } catch (err) { console.error(err); }
  };

  const fetchShops = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/shops`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setShops(res.data.shops);
    } catch (err) { console.error(err); }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/products`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setProducts(res.data.products);
    } catch (err) { console.error(err); }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/reports`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setReports(res.data.reports);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }
    
    // Check if user is disabled
    if (user && !user.isActive) {
      setShowDisabledPopup(true);
      return;
    }

    Promise.all([fetchStats(), fetchUsers(), fetchShops(), fetchProducts(), fetchReports()])
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleDisabledAccountClose = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleUserStatus = async (id) => {
    try {
      await axios.patch(`${API_BASE}/api/admin/users/${id}/toggle-active`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const handleDisableClick = (user) => {
    if (!user.isActive) {
      // Re-enabling — no confirmation needed
      toggleUserStatus(user._id);
    } else {
      setConfirmDisableModal({ visible: true, userId: user._id, username: user.username });
    }
  };

  const confirmDisableUser = async () => {
    await toggleUserStatus(confirmDisableModal.userId);
    setConfirmDisableModal({ visible: false, userId: null, username: "" });
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const toggleShopStatus = async (id, currentStatus) => {
    try {
      if (currentStatus === "active") {
        const reason = prompt("Reason for suspension:");
        if (!reason) return;
        await axios.patch(`${API_BASE}/api/admin/shops/${id}/suspend`, { reason }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
      } else {
        await axios.patch(`${API_BASE}/api/admin/shops/${id}/reactivate`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
      }
      fetchShops();
    } catch (err) { console.error(err); }
  };

  const deleteShop = async (id) => {
    if (!window.confirm("Delete this shop and all its products permanently?")) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/shops/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      fetchShops();
      fetchProducts();
    } catch (err) { console.error(err); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product permanently?")) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      fetchProducts();
    } catch (err) { console.error(err); }
  };

  const resolveReport = async (id) => {
    const adminNote = prompt("Resolution note:");
    try {
      await axios.patch(`${API_BASE}/api/admin/reports/${id}/resolve`, { adminNote }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      fetchReports();
    } catch (err) { console.error(err); }
  };

  const dismissReport = async (id) => {
    try {
      await axios.patch(`${API_BASE}/api/admin/reports/${id}/dismiss`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      fetchReports();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div>Loading Admin Dashboard...</div>;

  return (
    <div className="od-shell">
      <DisabledAccountPopup visible={showDisabledPopup} onClose={handleDisabledAccountClose} />

      {/* ── Confirm Disable User Popup ── */}
      {confirmDisableModal.visible && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.97)',
            padding: '2.5rem',
            borderRadius: '24px',
            width: '90%',
            maxWidth: '460px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)'
          }}>
            {/* Icon */}
            <div style={{
              width: 72, height: 72,
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '20px'
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>
              Disable Account?
            </h2>

            <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: '1rem', margin: 0 }}>
              You are about to disable the account of{' '}
              <strong style={{ color: '#0f172a' }}>{confirmDisableModal.username}</strong>.
              They will be locked out and shown a suspension notice.
            </p>

            <div style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '12px',
              padding: '0.85rem 1.25rem',
              width: '100%',
              fontSize: '0.9rem',
              color: '#9a3412',
              fontWeight: 500,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              This action can be reversed by clicking <strong>&nbsp;"Enable"&nbsp;</strong> anytime.
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '0.25rem' }}>
              <button
                onClick={() => setConfirmDisableModal({ visible: false, userId: null, username: "" })}
                style={{
                  flex: 1, padding: '0.85rem', borderRadius: '12px',
                  border: '1.5px solid #e2e8f0', background: '#f8fafc',
                  color: '#475569', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDisableUser}
                style={{
                  flex: 1, padding: '0.85rem', borderRadius: '12px',
                  border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 14px rgba(239,68,68,0.35)'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(239,68,68,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(239,68,68,0.35)'; }}
              >
                Yes, Disable
              </button>
            </div>
          </div>
        </div>
      )}
      <aside className="od-sidebar">
        <div className="od-sidebar__brand">
          <div className="od-sidebar__logo">SK</div>
          <span>SmartKhata Admin</span>
        </div>
        <nav className="od-sidebar__nav">
          {[
            { id: "overview", label: "Overview", icon: "📊" },
            { id: "users", label: "Users", icon: "👥" },
            { id: "shops", label: "Shops", icon: "🏪" },
            { id: "products", label: "Products", icon: "📦" },
            { id: "reports", label: "Reports", icon: "🚩" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`od-sidebar__link ${activeTab === tab.id ? "od-sidebar__link--active" : ""}`}
            >
              <span className="od-sidebar__icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="od-sidebar__footer">
          <div className="od-sidebar__user">
            <div className="od-sidebar__avatar">
              <span>A</span>
            </div>
            <div>
              <div className="od-sidebar__user-name">Admin</div>
              <div className="od-sidebar__user-role">Super Admin</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="od-main">
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title" style={{textTransform: 'capitalize'}}>{activeTab}</h1>
            <div className="od-topbar__date">System Administration</div>
          </div>
          
          <div className="od-topbar__right">
            <div className="od-topbar__profile">
              <div className="od-topbar__avatar">
                <span>A</span>
              </div>
            </div>
            <button className="od-topbar__logout" onClick={() => { localStorage.clear(); navigate("/login"); }} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </header>

        <main className="od-content">
          {activeTab === "overview" && stats && (
            <>
              <div className="od-stat-grid">
                {[
                  { label: "Total Users", value: stats.stats.totalUsers, color: "#6366f1", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" },
                  { label: "Total Shops", value: stats.stats.totalShops, color: "#10b981", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10" },
                  { label: "Total Products", value: stats.stats.totalProducts, color: "#f59e0b", icon: "M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
                  { label: "Pending Reports", value: stats.stats.pendingReports, color: "#ef4444", icon: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7" }
                ].map(card => (
                  <div className="od-stat-card" key={card.label} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                    <div className="od-stat-card__icon" style={{ background: card.color + "15", color: card.color, width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={card.icon} />
                      </svg>
                    </div>
                    <div>
                      <div className="od-stat-card__label" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>{card.label}</div>
                      <div className="od-stat-card__value" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{card.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="od-panel" style={{ flexShrink: 0, padding: '24px' }}>
                <div className="od-panel__header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="od-panel__title" style={{ fontSize: '1.2rem', fontWeight: 800 }}>Recent Registrations</h2>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Latest 5 users</span>
                </div>
                <div className="od-table-wrapper">
                  <table className="od-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentUsers.map(u => (
                        <tr key={u._id}>
                          <td>{u.username}<br/><small>{u.email}</small></td>
                          <td><span className="od-badge">{u.role}</span></td>
                          <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`od-badge od-badge--${u.isActive ? "green" : "red"}`}>
                              {u.isActive ? "Active" : "Disabled"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === "users" && (
            <div className="od-panel" style={{ flexShrink: 0, padding: '24px' }}>
              <div className="od-panel__header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="od-panel__title" style={{ fontSize: '1.2rem', fontWeight: 800 }}>Platform Users</h2>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{users.length} total users</span>
              </div>
              <div className="od-table-wrapper" style={{ overflowX: "auto", width: "100%" }}>
                <table className="od-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td>{u.username}<br/><small>{u.email}</small></td>
                        <td><span className="od-badge">{u.role}</span></td>
                        <td>
                          <span className={`od-badge od-badge--${u.isActive ? "green" : "red"}`}>
                            {u.isActive ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td>
                          <button className="od-btn od-btn--secondary od-btn--sm" onClick={() => handleDisableClick(u)} style={{marginRight: '8px'}}>
                            {u.isActive ? "Disable" : "Enable"}
                          </button>
                          <button className="od-btn od-btn--danger od-btn--sm" onClick={() => deleteUser(u._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "shops" && (
            <div className="od-panel" style={{ flexShrink: 0, padding: '24px' }}>
              <div className="od-panel__header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="od-panel__title" style={{ fontSize: '1.2rem', fontWeight: 800 }}>Active Shops</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <input
                    type="text"
                    placeholder="Search shops..."
                    value={searchShopTerm}
                    onChange={(e) => setSearchShopTerm(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{shops.length} total shops</span>
                </div>
              </div>
              <div className="od-table-wrapper" style={{ overflowX: "auto", width: "100%" }}>
                <table className="od-table">
                  <thead>
                    <tr>
                      <th>Shop Name</th>
                      <th>Owner</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shops.filter(s => s.name.toLowerCase().includes(searchShopTerm.toLowerCase())).map(s => (
                      <tr key={s._id}>
                        <td>{s.name}</td>
                        <td>{s.ownerId?.username || "Unknown"}<br/><small>{s.ownerId?.email}</small></td>
                        <td>
                          <span className={`od-badge od-badge--${s.status === "active" ? "green" : "red"}`}>
                            {s.status}
                          </span>
                          {s.status === "suspended" && <div style={{fontSize: "11px", color: "red"}}>{s.suspendedReason}</div>}
                        </td>
                        <td>
                          <button className="od-btn od-btn--secondary od-btn--sm" onClick={() => toggleShopStatus(s._id, s.status)} style={{marginRight: '8px'}}>
                            {s.status === "active" ? "Suspend" : "Reactivate"}
                          </button>
                          <button className="od-btn od-btn--danger od-btn--sm" onClick={() => deleteShop(s._id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="od-panel" style={{ flexShrink: 0, padding: '24px' }}>
              <div className="od-panel__header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="od-panel__title" style={{ fontSize: '1.2rem', fontWeight: 800 }}>Platform Products</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <input
                    type="text"
                    placeholder="Search products or stores..."
                    value={searchProductTerm}
                    onChange={(e) => setSearchProductTerm(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', width: '220px' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{products.length} total products</span>
                </div>
              </div>
              <div className="od-table-wrapper" style={{ overflowX: "auto", width: "100%" }}>
                <table className="od-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Shop / Owner</th>
                      <th>Price / Qty</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter(p => {
                      const pName = p.name ? p.name.toLowerCase() : '';
                      const sName = p.shopId && p.shopId.name ? p.shopId.name.toLowerCase() : '';
                      const term = searchProductTerm.toLowerCase();
                      return pName.includes(term) || sName.includes(term);
                    }).map(p => (
                      <tr key={p._id}>
                        <td>
                          <div style={{display: "flex", gap: "10px", alignItems: "center"}}>
                            <img src={imgUrl(p.image)} alt="" style={{width: 40, height: 40, objectFit: "cover", borderRadius: 4}} />
                            <div>{p.name}<br/><small>{p.category}</small></div>
                          </div>
                        </td>
                        <td>{p.shopId?.name || "Unknown Shop"}<br/><small>{p.shopId?.ownerId?.username || "Unknown"}</small></td>
                        <td>Rs. {p.price}<br/><small>Qty: {p.quantity}</small></td>
                        <td>
                          <button className="od-btn od-btn--danger od-btn--sm" onClick={() => deleteProduct(p._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="od-panel" style={{ flexShrink: 0, padding: '24px' }}>
              <div className="od-panel__header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="od-panel__title" style={{ fontSize: '1.2rem', fontWeight: 800 }}>Moderation Reports</h2>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{reports.length} total reports</span>
              </div>
              <div className="od-table-wrapper" style={{ overflowX: "auto", width: "100%" }}>
                <table className="od-table">
                  <thead>
                    <tr>
                      <th>Target</th>
                      <th>Reported By</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r._id}>
                        <td>
                          <span className="od-badge">{r.targetType}</span><br/>
                          <strong>{r.targetName}</strong>
                        </td>
                        <td>{r.reportedBy?.username || "Unknown"}<br/><small>{r.reportedBy?.email}</small></td>
                        <td>{r.reason}</td>
                        <td>
                          <span className={`od-badge od-badge--${r.status === "pending" ? "warn" : r.status === "resolved" ? "green" : "secondary"}`}>
                            {r.status}
                          </span>
                          {r.adminNote && <div style={{fontSize: "11px", marginTop: 4}}>Note: {r.adminNote}</div>}
                        </td>
                        <td>
                          {r.status === "pending" && (
                            <>
                              <button className="od-btn od-btn--primary od-btn--sm" onClick={() => resolveReport(r._id)} style={{marginRight: 8}}>Resolve</button>
                              <button className="od-btn od-btn--secondary od-btn--sm" onClick={() => dismissReport(r._id)}>Dismiss</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
