import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import OwnerSidebar from "../components/OwnerSidebar";
import StaffSidebar from "../components/StaffSidebar";
import { imgUrl } from "../utils/imageUrl";
import "../styles/ownerDashboard.css"; // Reuse dashboard layouts where possible

const API_BASE = "http://localhost:8000";

const OwnerMessages = () => {
  const navigate = useNavigate();
  const [owner, setOwner] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Chat Data
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [socket, setSocket] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || user.role !== "owner") {
      navigate("/login");
      return;
    }
    setOwner(user);
    fetchConversations();
  }, [navigate]);

  useEffect(() => {
    if (owner._id) {
      const newSocket = io(API_BASE);
      setSocket(newSocket);
      newSocket.emit("register", owner._id);

      newSocket.on("receive_message", (msg) => {
        // Update current chat if it's open
        setActiveChat(prevActiveChat => {
          if (prevActiveChat && msg.senderId._id === prevActiveChat._id) {
            setMessages(prevMsgs => [...prevMsgs, msg]);
            // Tell server we read it immediately
            newSocket.emit("mark_read", { senderId: msg.senderId._id, receiverId: owner._id });
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
  }, [owner._id]);

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
        socket.emit("mark_read", { senderId: user._id, receiverId: owner._id });
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChat || !socket) return;
    
    socket.emit("send_message", {
      senderId: owner._id,
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

  return (
    <div className="sd-layout od-modern-layout">
      {owner?.role === "owner" ? (
        <OwnerSidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          owner={owner} 
          handleLogout={handleLogout} 
        />
      ) : (
        <StaffSidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          staff={owner} 
          handleLogout={handleLogout} 
        />
      )}

      {/* Main Content */}
      <div className={`sd-main od-main-content ${sidebarOpen ? "sd-main--shifted" : ""}`}>
        <header className="sd-navbar">
          <div className="sd-navbar__left">
            <button className="sd-navbar__hamburger" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div className="sd-navbar__title">
              <h1>Messages</h1>
              <span className="sd-navbar__subtitle">Chat directly with your customers</span>
            </div>
          </div>
          <div className="sd-navbar__right">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="sd-avatar">
                {owner?.profileImage ? (
                  <img src={imgUrl(owner.profileImage)} alt="avatar" />
                ) : (
                  <span>O</span>
                )}
              </div>
              <div className="sd-navbar__staff-info">
                <span className="sd-navbar__name">{owner?.username}</span>
                <span className="sd-navbar__role">Owner</span>
              </div>
            </div>
          </div>
        </header>

        <main className="sd-content od-content" style={{ padding: '0', display: 'flex', height: 'calc(100vh - 72px)', background: '#fff' }}>
          
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
                    const isMine = msg.senderId === owner._id || msg.senderId?._id === owner._id;
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
