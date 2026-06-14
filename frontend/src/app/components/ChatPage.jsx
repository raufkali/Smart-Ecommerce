"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import io from "socket.io-client";
import "./ChatPage.css";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// ----------------------------------------------------------------------
// Helper: full image URL for profile pictures
// ----------------------------------------------------------------------
const getFullImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads")) return `${API_URL}${url}`;
  return `${API_URL}/uploads/profiles/${url}`;
};

// Helper: get display name from participant (works for admin too)
const getParticipantDisplayName = (participant, fallbackTitle = "Chat") => {
  if (!participant) return fallbackTitle;
  // 1. Denormalized name from participant
  if (participant.name) return participant.name;
  // 2. Populated user object
  if (participant.userId) {
    if (participant.userId.fullname) return participant.userId.fullname;
    if (participant.userId.name) return participant.userId.name;
    if (participant.userId.email) return participant.userId.email.split("@")[0];
  }
  return fallbackTitle;
};

// ----------------------------------------------------------------------
// Toast notification (auto-dismiss)
// ----------------------------------------------------------------------
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`chat-toast ${type}`}>
      <i
        className={`bi bi-${type === "success" ? "check-circle-fill" : type === "error" ? "exclamation-circle-fill" : "info-circle-fill"}`}
      />
      <span>{message}</span>
      <button onClick={onClose}>
        <i className="bi bi-x-lg" />
      </button>
    </div>
  );
};

// ----------------------------------------------------------------------
// Avatar component (handles fallback initials & badge)
// ----------------------------------------------------------------------
const Avatar = ({ src, name, size = 40, badge = 0 }) => {
  const imageUrl = getFullImageUrl(src);
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div className="chat-avatar" style={{ width: size, height: size }}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="chat-avatar-img"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="chat-avatar-placeholder"
          style={{ width: size, height: size }}
        >
          <i className="bi bi-person-circle"></i>
        </div>
      )}
      {badge > 0 && (
        <span className="unread-badge">{badge > 99 ? "99+" : badge}</span>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// Chat list item (sidebar)
// ----------------------------------------------------------------------
const ChatListItem = ({ chat, isActive, onClick, currentUser }) => {
  const currentUserId =
    currentUser?._id?.toString() || currentUser?.id?.toString();

  // Find the other participant (not the current user)
  const other = chat.participants?.find((p) => {
    const pid = p.userId?._id?.toString() || p.userId?.toString();
    return pid !== currentUserId;
  });

  // Use helper to get display name
  const displayName = getParticipantDisplayName(other, chat.title || "Chat");
  const preview = chat.lastMessage?.content || "No messages yet";
  const unread = chat.unreadCount || 0;
  const time = chat.lastMessage?.sentAt || chat.updatedAt;
  const avatarSrc = other?.profilePicture || null;

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0)
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    if (diff === 1) return "Yesterday";
    if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <button
      className={`chat-list-item ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      <Avatar src={avatarSrc} name={displayName} size={48} badge={unread} />
      <div className="chat-info">
        <div className="chat-name">{displayName}</div>
        <div className="chat-preview">
          <i
            className={`bi ${chat.type === "order" ? "bi-bag-check" : chat.type === "dispute" ? "bi-exclamation-triangle" : "bi-chat-dots"}`}
          />
          <span>{preview.slice(0, 50)}</span>
        </div>
      </div>
      <div className="chat-meta">
        <div className="chat-time">{formatTime(time)}</div>
      </div>
    </button>
  );
};

// ----------------------------------------------------------------------
// Message bubble (single message)
// ----------------------------------------------------------------------
const MessageBubble = ({ message, isSent, senderName, isAdmin }) => {
  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className={`message-row ${isSent ? "sent" : "received"}`}>
      <div className="message-bubble-wrapper">
        {" "}
        {/* ← add this wrapper */}
        {senderName && (
          <div className={`message-sender-name ${isAdmin ? "admin" : ""}`}>
            {isAdmin && <span className="admin-badge">Admin</span>}
            {senderName}
          </div>
        )}
        <div className={`message-bubble ${isAdmin ? "admin-bubble" : ""}`}>
          <div className="message-text">{message.content}</div>
          <div className="message-time">
            {formatTime(message.createdAt)}
            {isSent && <i className="bi bi-check-all" />}
          </div>
        </div>
      </div>{" "}
      {/* ← close wrapper */}
    </div>
  );
};

// ----------------------------------------------------------------------
// Chat window (main area)
// ----------------------------------------------------------------------
const ChatWindow = ({ chat, currentUser, onMessageSent, apiUrl, socket }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const other = chat?.participants?.find(
    (p) => p.userId?._id !== currentUser?._id,
  );
  const chatDisplayName = getParticipantDisplayName(
    other,
    chat?.title || "Chat",
  );
  const chatAvatar = other?.profilePicture;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!chat) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/chat/${chat._id}/messages?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        await fetch(`${apiUrl}/chat/${chat._id}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error("fetchMessages error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chat || !socket) return;
    fetchMessages();
    socket.emit("joinChat", chat._id);

    const handleNewMessage = ({ chatId, message }) => {
      if (chatId !== chat._id) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      onMessageSent();
    };

    const handleTyping = ({ chatId, userId }) => {
      if (
        chatId === chat._id &&
        userId !== (currentUser?._id || currentUser?.id)
      ) {
        setTyping(true);
        setTimeout(() => setTyping(false), 2000);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleTyping);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleTyping);
    };
  }, [chat?._id, socket]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setSending(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/chat/${chat._id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
        onMessageSent();
        scrollToBottom();
      }
    } catch (err) {
      console.error("sendMessage error", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTypingEvent = () => {
    if (socket && chat) {
      socket.emit("typing", {
        chatId: chat._id,
        userId: currentUser?._id || currentUser?.id,
      });
    }
  };

  const groupByDate = () => {
    const groups = {};
    messages.forEach((msg) => {
      const date = new Date(msg.createdAt).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  if (!chat) {
    return (
      <div className="welcome-state">
        <div className="welcome-icon">
          <i className="bi bi-chat-dots-fill" />
        </div>
        <h3>Your Messages</h3>
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading messages...</p>
      </div>
    );
  }

  const grouped = groupByDate();
  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <Avatar src={chatAvatar} name={chatDisplayName} size={44} />
          <div className="chat-header-details">
            <h3>{chatDisplayName}</h3>
            <span className="chat-type-badge">
              <i
                className={`bi ${chat.type === "order" ? "bi-bag-check" : chat.type === "dispute" ? "bi-exclamation-triangle" : "bi-headset"}`}
              />
              {chat.type.charAt(0).toUpperCase() + chat.type.slice(1)} Chat
            </span>
          </div>
        </div>
      </div>

      <div className="messages-area">
        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className="message-date">
              <span>{formatDateHeader(date)}</span>
            </div>
            {msgs.map((msg) => {
              const isSent =
                msg.sender?.userId === (currentUser?._id || currentUser?.id);
              const isAdmin = msg.sender?.role === "admin";
              const senderName =
                msg.sender?.fullname ||
                msg.sender?.name ||
                (isSent ? currentUser?.fullname || currentUser?.name : null);

              return (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isSent={isSent}
                  senderName={senderName}
                  isAdmin={isAdmin}
                />
              );
            })}
          </div>
        ))}
        {typing && (
          <div className="typing-indicator">
            <span>{chatDisplayName} is typing</span>
            <div className="typing-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-area">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            className="message-input"
            rows="1"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTypingEvent();
            }}
            onKeyPress={handleKeyPress}
          />
          <button
            className={`send-btn ${input.trim() ? "active" : ""}`}
            onClick={sendMessage}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <span className="spinner-small" />
            ) : (
              <i className="bi bi-send-fill" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// New Chat Modal (admin only)
// ----------------------------------------------------------------------
const NewChatModal = ({
  show,
  onClose,
  onChatCreated,
  currentUser,
  apiUrl,
}) => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!show) {
      setSearch("");
      setUsers([]);
      setSelected(null);
    }
  }, [show]);

  useEffect(() => {
    if (currentUser?.role !== "admin" || search.length < 2) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${apiUrl}/admin/users?search=${encodeURIComponent(search)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setUsers(
            (data.users || []).filter(
              (u) => u._id !== (currentUser?._id || currentUser?.id),
            ),
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, currentUser]);

  const createChat = async () => {
    if (!selected) return;
    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/chat/create-seller-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sellerId: selected._id }),
      });
      if (res.ok) {
        const data = await res.json();
        onChatCreated(data.chat);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (!show) return null;

  if (currentUser?.role !== "admin") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              <i className="bi bi-plus-circle" /> New Chat
            </h3>
            <button className="btn-secondary" onClick={onClose}>
              <i className="bi bi-x-lg" />
            </button>
          </div>
          <div className="modal-body">
            <div className="info-message">
              <i className="bi bi-info-circle-fill" />
              <p>
                To start a chat, go to a product page and click "Chat with
                Seller"
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="bi bi-plus-circle" /> New Conversation
          </h3>
          <button className="btn-secondary" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="modal-body">
          <div className="chat-search-box">
            <i className="bi bi-search" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="user-list">
            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
              </div>
            ) : users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user._id}
                  className={`user-item ${selected?._id === user._id ? "selected" : ""}`}
                  onClick={() => setSelected(user)}
                >
                  <Avatar
                    src={user.profilePicture}
                    name={user.fullname}
                    size={44}
                  />
                  <div className="user-info">
                    <div className="user-name">{user.fullname}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
              ))
            ) : search.length >= 2 ? (
              <div className="empty-state">
                <i className="bi bi-inbox" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="empty-state">
                <i className="bi bi-search" />
                <p>Type at least 2 characters to search</p>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={createChat}
            disabled={!selected || creating}
          >
            {creating ? (
              <span className="spinner-small" />
            ) : (
              <>
                <i className="bi bi-chat-dots-fill" /> Start Chat
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Main Chat Page
// ----------------------------------------------------------------------
const ChatPage = ({ userRole, currentUser: propUser }) => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(propUser || null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const socketRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setSidebarOpen(window.innerWidth > 768);
    const handleResize = () => setSidebarOpen(window.innerWidth > 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (propUser) {
      setCurrentUser(propUser);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setCurrentUser(d.user))
      .catch(() => router.push("/login"));
  }, [propUser, router]);

  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem("token");
    const socket = io(API_URL, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("joinRoom", {
      userId: currentUser._id || currentUser.id,
      role: currentUser.role,
    });
    socket.on("chat_notification", () => fetchChats());
    socket.on("new_message", () => fetchChats());
    return () => socket.disconnect();
  }, [currentUser]);

  const fetchChats = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = localStorage.getItem("token");
      const url =
        currentUser.role === "admin"
          ? `${API_URL}/chat/admin/chats?type=${filter}`
          : `${API_URL}/chat/my-chats`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChats(data.chats || []);
      }
    } catch (err) {
      console.error("fetchChats error", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, filter]);

  useEffect(() => {
    if (currentUser) fetchChats();
  }, [currentUser, fetchChats]);

  const filteredChats = chats.filter((chat) => {
    if (filter !== "all" && chat.type !== filter) return false;
    if (search) {
      const other = chat.participants?.find(
        (p) => p.userId?._id !== currentUser?._id,
      );
      const otherName = getParticipantDisplayName(other, chat.title);
      return otherName.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const handleSelectChat = (chat) => {
    const scrollY = window.scrollY;
    setSelectedChat(chat);
    setSidebarOpen(false);
    setTimeout(() => window.scrollTo(0, scrollY), 0);
  };

  const FILTERS = [
    { key: "all", label: "All", icon: "bi-grid-fill" },
    { key: "order", label: "Orders", icon: "bi-bag-check-fill" },
    { key: "dispute", label: "Disputes", icon: "bi-exclamation-triangle-fill" },
    { key: "support", label: "Support", icon: "bi-headset" },
  ];

  if (loading) {
    return (
      <div className="loading-state" style={{ height: "calc(100vh - 60px)" }}>
        <div className="spinner" />
        <p>Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className={`chat-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="chat-sidebar-header">
          <h2>
            <i className="bi bi-chat-dots-fill" /> Messages
          </h2>
          <button className="new-chat-btn" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg" />
          </button>
        </div>

        <div className="chat-search">
          <div className="chat-search-box">
            <i className="bi bi-search" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="btn-secondary"
                onClick={() => setSearch("")}
                style={{ padding: 0, width: 24, height: 24 }}
              >
                <i className="bi bi-x-lg" />
              </button>
            )}
          </div>
        </div>

        {currentUser?.role === "admin" && (
          <div className="chat-filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`filter-btn ${filter === f.key ? "active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                <i className={`bi ${f.icon}`} /> {f.label}
              </button>
            ))}
          </div>
        )}

        <div className="chat-list">
          {filteredChats.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-inbox" />
              <p>No conversations yet</p>
              <button
                className="btn-primary"
                onClick={() => setShowModal(true)}
              >
                <i className="bi bi-plus-lg" /> New Chat
              </button>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <ChatListItem
                key={chat._id}
                chat={chat}
                isActive={selectedChat?._id === chat._id}
                onClick={() => handleSelectChat(chat)}
                currentUser={currentUser}
              />
            ))
          )}
        </div>
      </div>

      {typeof window !== "undefined" && window.innerWidth <= 768 && (
        <button
          className="mobile-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <i
            className={`bi ${sidebarOpen ? "bi-x-lg" : "bi-chat-dots-fill"}`}
          />
        </button>
      )}

      <div className="chat-window">
        <ChatWindow
          chat={selectedChat}
          currentUser={currentUser}
          onMessageSent={fetchChats}
          apiUrl={API_URL}
          socket={socketRef.current}
        />
      </div>

      <NewChatModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onChatCreated={(newChat) => {
          fetchChats();
          setSelectedChat(newChat);
          setSidebarOpen(false);
        }}
        currentUser={currentUser}
        apiUrl={API_URL}
      />
    </div>
  );
};

export default ChatPage;
