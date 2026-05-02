import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { imgUrl } from "../utils/imageUrl";
import "../styles/ownerDashboard.css";

import StaffSidebar from "../components/StaffSidebar";

const API_BASE = "http://localhost:8000";

const OwnerMessages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({});
  const [effectiveOwnerId, setEffectiveOwnerId] = useState(null);
  
  // Chat Data
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [socket, setSocket] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("accessToken");
    if (!currentUser || !token || (currentUser.role !== "owner" && currentUser.role !== "staff")) {
      navigate("/login");
      return;
    }
    setUser(currentUser);

    // Fetch effective owner id from backend
    axios.get(`${API_BASE}/api/owner/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      setEffectiveOwnerId(res.data.ownerId || currentUser._id);
      fetchConversations();
    })
    .catch((err) => {
      console.error("Failed to get effective owner ID", err);
    });

  }, [navigate]);

  useEffect(() => {
    if (effectiveOwnerId) {
      const newSocket = io(API_BASE);
      setSocket(newSocket);
      newSocket.emit("register", effectiveOwnerId);

      newSocket.on("receive_message", (msg) => {
        // Update current chat if it's open
        setActiveChat(prevActiveChat => {
          if (prevActiveChat && msg.senderId._id === prevActiveChat._id) {
            setMessages(prevMsgs => [...prevMsgs, msg]);
            // Tell server we read it immediately
            newSocket.emit("mark_read", { senderId: msg.senderId._id, receiverId: effectiveOwnerId });
          }
          return prevActiveChat;
        });

        // Always refresh conversations list to update lastMessage and unread counts
        fetchConversations();
      });

      newSocket.on("message_sent", (msg) => {
        setMessages(prev => [...prev, msg]);
        fetchConversations();
      });

      return () => newSocket.close();
    }
  }, [effectiveOwnerId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  const openConversation = async (user) => {
    setActiveChat(user);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/api/messages/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages || []);
      
      // Update unread count locally just to verify
      setConversations(prev => prev.map(c => 
        c.user._id === user._id ? { ...c, unreadCount: 0 } : c
      ));

      if (socket) {
        socket.emit("mark_read", { senderId: user._id, receiverId: effectiveOwnerId });
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChat || !socket) return;
    
    socket.emit("send_message", {
      senderId: effectiveOwnerId,
      receiverId: activeChat._id,
      text: chatInput,
    });
    setChatInput("");
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const sideLinks = [
    { label: "Dashboard", path: "/owner-dashboard", d: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10" },
    { label: "Orders", path: "/order-management", d: "M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M8 12h8" },
    { label: "Products", path: "/products", d: "M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
    { label: "Staff", path: "/add-staff", d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" },
    { label: "Suppliers", path: "/supplier-management", d: "M3 3h18v4H3zM3 11h18v4H3zM3 19h18v4H3z" },
    { label: "Attendance", path: "/attendance", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { label: "Messages", path: "/owner-messages", d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
    { label: "Reviews", path: "/owner-reviews", d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
    { label: "Profile", path: "/owner-profile", d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
  ];

  return (
    <div className="od-shell">
      {user?.role === "staff" ? (
        <StaffSidebar staff={user} />
      ) : (
        <aside className="od-sidebar">
          <div className="od-sidebar__brand">
            <div className="od-sidebar__logo">
              <span className="od-sidebar__logo-icon">K</span>
              <span className="od-sidebar__logo-text">SmartKhata</span>
            </div>
          </div>
          <nav className="od-sidebar__nav">
            {sideLinks.map(link => (
              <button key={link.path}
                className={`od-sidebar__link ${location.pathname === link.path ? "od-sidebar__link--active" : ""}`}
                onClick={() => navigate(link.path)}>
                <span className="od-sidebar__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={link.d}/></svg>
                </span>
                <span className="od-sidebar__label">{link.label}</span>
              </button>
            ))}
          </nav>
          <div className="od-sidebar__footer">
            <div className="od-sidebar__user" onClick={() => navigate("/owner-profile")}>
              <div className="od-sidebar__avatar">
                {user?.profileImage ? <img src={imgUrl(user.profileImage)} alt="avatar"/> : <span>{(user?.username||"U")[0].toUpperCase()}</span>}
              </div>
              <div>
                <div className="od-sidebar__user-name">{user?.username||"Owner"}</div>
                <div className="od-sidebar__user-role" style={{textTransform:"capitalize"}}>Owner</div>
              </div>
            </div>
          </div>
        </aside>
      )}

      <div className="od-main">
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">Messages</h1>
            <div className="od-topbar__date">Chat directly with your customers</div>
          </div>
          <div className="od-topbar__right">
            <div className="od-topbar__profile" onClick={() => navigate(user?.role === "staff" ? "/staff-profile" : "/owner-profile")}>
              <div className="od-topbar__avatar">
                {user?.profileImage ? <img src={imgUrl(user.profileImage)} alt="avatar"/> : <span>{(user?.username||"U")[0].toUpperCase()}</span>}
              </div>
            </div>
            <button className="od-topbar__logout" onClick={handleLogout} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          </div>
        </header>

        <main style={{ padding: '0', display: 'flex', flexDirection: 'row', height: 'calc(100vh - 64px)', background: '#fff', margin: '24px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          
          {/* Sidebar Conversations List */}
          <div style={{ width: '350px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 700, color: '#0f172a' }}>Inbox</h2>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {conversations.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                  No active conversations yet
                </div>
              ) : (
                conversations.map((conv) => (
                  <div 
                    key={conv.user._id} 
                    onClick={() => openConversation(conv.user)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '16px 20px', 
                      borderBottom: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      background: activeChat?._id === conv.user._id ? '#eff6ff' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#026bf4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                      {conv.user.profileImage ? <img src={imgUrl(conv.user.profileImage)} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="User" /> : conv.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: '#0f172a', fontSize: '14px' }}>{conv.user.username}</strong>
                        {conv.unreadCount > 0 && <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>{conv.unreadCount}</span>}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                        {conv.lastMessage?.text || "Started a conversation"}
                      </div>
                      {conv.lastMessage?.productId && (
                        <div style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          marginTop: '5px', padding: '3px 8px', 
                          background: '#eff6ff', borderRadius: '6px',
                          border: '1px solid #bfdbfe', maxWidth: '100%',
                          overflow: 'hidden'
                        }}>
                          {conv.lastMessage.productId.image && (
                            <img 
                              src={imgUrl(Array.isArray(conv.lastMessage.productId.image) ? conv.lastMessage.productId.image[0] : conv.lastMessage.productId.image)} 
                              alt="" 
                              style={{ width: '14px', height: '14px', borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }} 
                            />
                          )}
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            📦 {conv.lastMessage.productId.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Chat Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
            {activeChat ? (
              <>
                <div style={{ padding: '16px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#026bf4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                    {activeChat.profileImage ? <img src={imgUrl(activeChat.profileImage)} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="User" /> : activeChat.username.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{activeChat.username}</h3>
                    <span style={{ fontSize: '13px', color: '#16a34a' }}>● Customer</span>
                  </div>
                  {/* Product the customer messaged from */}
                  {(() => {
                    const firstProductMsg = messages.find(m => m.productId);
                    if (!firstProductMsg?.productId) return null;
                    const prod = firstProductMsg.productId;
                    const img = Array.isArray(prod.image) ? prod.image[0] : prod.image;
                    return (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: '#eff6ff', border: '1px solid #bfdbfe',
                        borderRadius: '10px', padding: '10px 14px',
                      }}>
                        {img && (
                          <img 
                            src={imgUrl(img)} 
                            alt="Product"
                            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                          />
                        )}
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Messaged about</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {prod.name}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#f1f5f9' }}>
                  {messages.map((msg, idx) => {
                    const isMine = msg.senderId === effectiveOwnerId || msg.senderId?._id === effectiveOwnerId;
                    return (
                      <div key={idx} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '60%' }}>
                        <div style={{ 
                          padding: '12px 18px', 
                          background: isMine ? '#026bf4' : '#ffffff', 
                          color: isMine ? '#ffffff' : '#0f172a',
                          borderRadius: '16px',
                          borderBottomRightRadius: isMine ? '4px' : '16px',
                          borderBottomLeftRadius: isMine ? '16px' : '4px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                          border: isMine ? 'none' : '1px solid #e2e8f0',
                          fontSize: '15px',
                          lineHeight: '1.5'
                        }}>
                          {msg.text}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', textAlign: isMine ? 'right' : 'left' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} style={{ padding: '20px 30px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '15px', background: '#fff' }}>
                  <input 
                    type="text" 
                    placeholder="Type your message..." 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    style={{ flex: 1, padding: '14px 20px', borderRadius: '24px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', background: '#f8fafc' }}
                  />
                  <button 
                    type="submit" 
                    disabled={!chatInput.trim()}
                    style={{ background: '#026bf4', color: '#fff', border: 'none', borderRadius: '24px', padding: '0 25px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s', opacity: chatInput.trim() ? 1 : 0.6 }}
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#64748b' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.2 }}>💬</div>
                <h3 style={{ margin: 0, fontWeight: 500 }}>Select a conversation to start chatting</h3>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerMessages;
