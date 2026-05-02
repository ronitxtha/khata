import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import CustomerSidebar from "../components/CustomerSidebar";
import { imgUrl } from "../utils/imageUrl";
import "../styles/ownerDashboard.css";

const API_BASE = "http://localhost:8000";

const CustomerMessages = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({});

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { user, productId }
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);

  // ── Boot ──────────────────────────────────────────────────────
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?._id) { navigate("/login"); return; }
    setCustomer(user);
    fetchConversations();
  }, [navigate]);

  // ── Socket ────────────────────────────────────────────────────
  useEffect(() => {
    if (!customer._id) return;
    const sock = io(API_BASE);
    setSocket(sock);
    sock.emit("register", customer._id);

    sock.on("receive_message", (msg) => {
      setActiveChat(prev => {
        if (prev && msg.senderId._id === prev.user._id) {
          setMessages(m => [...m, msg]);
        }
        return prev;
      });
      fetchConversations();
    });

    sock.on("message_sent", (msg) => {
      setMessages(prev => [...prev, msg]);
      fetchConversations();
    });

    return () => sock.close();
  }, [customer._id]);

  // ── Auto-scroll ───────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── API ───────────────────────────────────────────────────────
  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error("Conversations fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (conv) => {
    setActiveChat(conv);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE}/api/messages/${conv.user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.messages || []);
      setConversations(prev =>
        prev.map(c => c.user._id === conv.user._id ? { ...c, unreadCount: 0 } : c)
      );
      if (socket) socket.emit("mark_read", { senderId: conv.user._id, receiverId: customer._id });
    } catch (err) {
      console.error("Messages fetch error:", err);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChat || !socket) return;
    socket.emit("send_message", {
      senderId: customer._id,
      receiverId: activeChat.user._id,
      text: chatInput,
    });
    setChatInput("");
  };

  // ── Helpers ───────────────────────────────────────────────────
  const getProductFromMessages = () => messages.find(m => m.productId)?.productId || null;

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (d) => {
    const dt = new Date(d);
    const today = new Date();
    if (dt.toDateString() === today.toDateString()) return "Today";
    const yest = new Date(today); yest.setDate(today.getDate() - 1);
    if (dt.toDateString() === yest.toDateString()) return "Yesterday";
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="od-shell">
      <CustomerSidebar customer={customer} />

      <div className="od-main">
        {/* Navbar */}
        <header className="od-topbar">
          <div className="od-topbar__left">
            <h1 className="od-topbar__title">My Messages</h1>
            <div className="od-topbar__date">Chat history with all your stores</div>
          </div>
          <div className="od-topbar__right">
            <div className="od-topbar__profile" onClick={() => navigate("/customer-profile")}>
              <div className="od-topbar__avatar">
                {customer?.profileImage
                  ? <img src={imgUrl(customer.profileImage)} alt="avatar" />
                  : <span>{(customer?.username || "C")[0].toUpperCase()}</span>}
              </div>
            </div>
          </div>
        </header>

        {/* Chat Layout */}
        <main style={{
          display: "flex",
          height: "calc(100vh - 64px)",
          background: "#f8fafc",
          overflow: "hidden",
        }}>
          {/* ── LEFT PANEL: Store List ── */}
          <aside style={{
            width: "340px",
            borderRight: "1px solid rgba(15,23,42,0.08)",
            display: "flex",
            flexDirection: "column",
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)",
            flexShrink: 0,
          }}>
            {/* Panel header */}
            <div style={{
              padding: "24px 24px 16px",
              borderBottom: "1px solid rgba(15,23,42,0.06)",
            }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--color-secondary)" }}>
                Conversations
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>
                {conversations.length} store{conversations.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Conversation list */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {loading ? (
                <div style={{ padding: "60px 20px", textAlign: "center" }}>
                  <div style={{
                    width: "32px", height: "32px",
                    border: "3px solid rgba(37,99,235,0.1)",
                    borderTop: "3px solid #2563eb",
                    borderRadius: "50%", margin: "0 auto 12px",
                    animation: "spin 1s linear infinite"
                  }} />
                  <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>Loading chats...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: "60px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: "48px", opacity: 0.3, marginBottom: "12px" }}>💬</div>
                  <p style={{ color: "var(--color-text-muted)", fontWeight: 600, margin: 0 }}>No conversations yet</p>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "13px", marginTop: "6px" }}>
                    Visit a product and start a chat with a store owner.
                  </p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = activeChat?.user._id === conv.user._id;
                  const prod = conv.lastMessage?.productId;
                  return (
                    <div
                      key={conv.user._id}
                      onClick={() => openConversation(conv)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "14px",
                        padding: "16px 20px",
                        borderBottom: "1px solid rgba(15,23,42,0.05)",
                        cursor: "pointer",
                        background: isActive
                          ? "rgba(37,99,235,0.08)"
                          : "transparent",
                        borderLeft: isActive
                          ? "3px solid #2563eb"
                          : "3px solid transparent",
                        transition: "all 0.2s",
                      }}
                    >
                      {/* Store avatar */}
                      <div style={{
                        width: "48px", height: "48px", borderRadius: "12px",
                        background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                        color: "white", display: "flex", alignItems: "center",
                        justifyContent: "center", fontWeight: 800, fontSize: "18px",
                        flexShrink: 0, boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
                        overflow: "hidden",
                      }}>
                        {conv.user.profileImage
                          ? <img src={imgUrl(conv.user.profileImage)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                          : (conv.user.username?.[0] || "S").toUpperCase()}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                          <span style={{ fontWeight: 800, fontSize: "14px", color: isActive ? "#2563eb" : "var(--color-secondary)" }}>
                            {conv.user.username}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {conv.lastMessage && (
                              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
                                {formatDate(conv.lastMessage.createdAt)}
                              </span>
                            )}
                            {conv.unreadCount > 0 && (
                              <span style={{
                                background: "#ef4444", color: "white",
                                padding: "2px 7px", borderRadius: "20px",
                                fontSize: "11px", fontWeight: 800, flexShrink: 0
                              }}>{conv.unreadCount}</span>
                            )}
                          </div>
                        </div>

                        <div style={{
                          color: conv.unreadCount > 0 ? "var(--color-secondary)" : "var(--color-text-muted)",
                          fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden",
                          textOverflow: "ellipsis", fontWeight: conv.unreadCount > 0 ? 700 : 400,
                        }}>
                          {conv.lastMessage?.text || "No messages yet"}
                        </div>

                        {/* Product tag */}
                        {prod && (
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: "5px",
                            marginTop: "6px", padding: "3px 8px",
                            background: isActive ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.05)",
                            borderRadius: "6px", border: "1px solid rgba(37,99,235,0.15)",
                            maxWidth: "100%", overflow: "hidden",
                          }}>
                            {prod.image && (
                              <img
                                src={imgUrl(Array.isArray(prod.image) ? prod.image[0] : prod.image)}
                                alt=""
                                style={{ width: "14px", height: "14px", borderRadius: "3px", objectFit: "cover" }}
                              />
                            )}
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              📦 {prod.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* ── RIGHT PANEL: Chat Window ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {activeChat ? (
              <>
                {/* Chat header */}
                <div style={{
                  padding: "14px 28px",
                  borderBottom: "1px solid rgba(15,23,42,0.08)",
                  display: "flex", alignItems: "center", gap: "16px",
                  flexWrap: "wrap",
                  background: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(12px)",
                }}>
                  {/* Store avatar */}
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                    color: "white", display: "flex", alignItems: "center",
                    justifyContent: "center", fontWeight: 800, fontSize: "18px",
                    flexShrink: 0, overflow: "hidden",
                    boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
                  }}>
                    {activeChat.user.profileImage
                      ? <img src={imgUrl(activeChat.user.profileImage)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                      : (activeChat.user.username?.[0] || "S").toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--color-secondary)" }}>
                      {activeChat.user.username}
                    </h3>
                    <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>
                      🏪 Store Owner
                    </span>
                  </div>

                  {/* Product context card */}
                  {(() => {
                    const prod = getProductFromMessages();
                    if (!prod) return null;
                    const img = Array.isArray(prod.image) ? prod.image[0] : prod.image;
                    return (
                      <div style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)",
                        borderRadius: "10px", padding: "10px 14px",
                      }}>
                        {img && (
                          <img
                            src={imgUrl(img)} alt="Product"
                            style={{ width: "38px", height: "38px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                          />
                        )}
                        <div>
                          <div style={{ fontSize: "10px", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>Product</div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-secondary)", maxWidth: "180px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {prod.name}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Messages area */}
                <div style={{
                  flex: 1, overflowY: "auto", padding: "28px",
                  display: "flex", flexDirection: "column", gap: "4px",
                  background: "var(--color-bg-main)",
                }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: "center", margin: "auto", color: "var(--color-text-muted)" }}>
                      <div style={{ fontSize: "48px", opacity: 0.2, marginBottom: "12px" }}>💬</div>
                      <p style={{ fontWeight: 600 }}>No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMine = msg.senderId === customer._id || msg.senderId?._id === customer._id;
                      const showDate = idx === 0 || formatDate(messages[idx - 1].createdAt) !== formatDate(msg.createdAt);
                      return (
                        <React.Fragment key={idx}>
                          {showDate && (
                            <div style={{ textAlign: "center", margin: "12px 0" }}>
                              <span style={{
                                fontSize: "11px", fontWeight: 700,
                                color: "var(--color-text-muted)",
                                background: "rgba(15,23,42,0.06)",
                                padding: "4px 14px", borderRadius: "20px",
                              }}>
                                {formatDate(msg.createdAt)}
                              </span>
                            </div>
                          )}
                          <div style={{
                            alignSelf: isMine ? "flex-end" : "flex-start",
                            maxWidth: "65%", marginBottom: "8px",
                          }}>
                            {/* Product badge on first message with product */}
                            {msg.productId && idx === messages.findIndex(m => m.productId) && (
                              <div style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                marginBottom: "6px", padding: "6px 10px",
                                background: "rgba(37,99,235,0.08)",
                                borderRadius: "8px", border: "1px solid rgba(37,99,235,0.15)",
                                fontSize: "12px", color: "#2563eb", fontWeight: 700,
                              }}>
                                📦 Enquiry about: <strong>{msg.productId.name}</strong>
                              </div>
                            )}
                            <div style={{
                              padding: "12px 18px",
                              background: isMine
                                ? "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)"
                                : "rgba(255,255,255,0.95)",
                              color: isMine ? "#fff" : "var(--color-secondary)",
                              borderRadius: "18px",
                              borderBottomRightRadius: isMine ? "4px" : "18px",
                              borderBottomLeftRadius: isMine ? "18px" : "4px",
                              boxShadow: isMine
                                ? "0 4px 14px rgba(37,99,235,0.25)"
                                : "0 2px 8px rgba(0,0,0,0.06)",
                              border: isMine ? "none" : "1px solid rgba(15,23,42,0.07)",
                              fontSize: "15px", lineHeight: "1.55",
                            }}>
                              {msg.text}
                            </div>
                            <div style={{
                              fontSize: "11px", color: "var(--color-text-muted)",
                              marginTop: "4px",
                              textAlign: isMine ? "right" : "left",
                              fontWeight: 500,
                            }}>
                              {formatTime(msg.createdAt)}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                  onSubmit={handleSend}
                  style={{
                    padding: "18px 28px",
                    borderTop: "1px solid rgba(15,23,42,0.08)",
                    display: "flex", gap: "14px",
                    background: "rgba(255,255,255,0.9)",
                    backdropFilter: "blur(12px)",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    style={{
                      flex: 1, padding: "14px 20px",
                      borderRadius: "24px",
                      border: "1px solid rgba(37,99,235,0.2)",
                      outline: "none", fontSize: "15px",
                      background: "rgba(37,99,235,0.03)",
                      color: "var(--color-secondary)",
                      fontFamily: "var(--font-base)",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 4px rgba(37,99,235,0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(37,99,235,0.2)"; e.target.style.boxShadow = "none"; }}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    style={{
                      background: chatInput.trim()
                        ? "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)"
                        : "#e2e8f0",
                      color: chatInput.trim() ? "#fff" : "#94a3b8",
                      border: "none", borderRadius: "24px",
                      padding: "0 28px", height: "50px",
                      fontWeight: 800, fontSize: "14px",
                      cursor: chatInput.trim() ? "pointer" : "not-allowed",
                      transition: "all 0.2s",
                      boxShadow: chatInput.trim() ? "0 4px 14px rgba(37,99,235,0.3)" : "none",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Send ↑
                  </button>
                </form>
              </>
            ) : (
              /* Empty state */
              <div style={{
                flex: 1, display: "flex", alignItems: "center",
                justifyContent: "center", flexDirection: "column",
                gap: "16px", color: "var(--color-text-muted)",
                background: "var(--color-bg-main)",
              }}>
                <div style={{
                  width: "100px", height: "100px",
                  background: "rgba(37,99,235,0.06)",
                  borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: "44px",
                }}>💬</div>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: "20px", color: "var(--color-secondary)" }}>
                  Your Messages
                </h3>
                <p style={{ margin: 0, fontWeight: 500, maxWidth: "340px", textAlign: "center", lineHeight: 1.6 }}>
                  Select a store conversation on the left to continue chatting, or visit a product page to start a new enquiry.
                </p>
                <button
                  onClick={() => navigate("/customer-dashboard")}
                  style={{
                    background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                    color: "white", border: "none", borderRadius: "12px",
                    padding: "12px 28px", fontWeight: 800, cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
                    fontSize: "14px", marginTop: "8px",
                  }}
                >
                  Browse Stores
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .od-main { overflow: hidden; }
      `}</style>
    </div>
  );
};

export default CustomerMessages;
