import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import io from "socket.io-client";
import "./ChatPage.css";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// ─── Helpers ────────────────────────────────────────────────────────────────

const getFullImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads")) return `${url}`;
  return `${API_URL}/uploads/profiles/${url}`;
};

const normaliseId = (val) => {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object")
    return val._id?.toString() || val.id?.toString() || null;
  return String(val);
};

const getParticipantDisplayName = (participant, fallback = "Chat") => {
  if (!participant) return fallback;
  if (participant.name) return participant.name;
  if (participant.userId) {
    const u = participant.userId;
    return u.fullname || u.name || (u.email ? u.email.split("@")[0] : fallback);
  }
  return fallback;
};

const getOtherParticipants = (participants = [], currentUserId) =>
  participants.filter((p) => normaliseId(p.userId) !== currentUserId);

// ─── Toast ──────────────────────────────────────────────────────────────────

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const icon =
    type === "success"
      ? "bi-check-circle-fill"
      : type === "error"
        ? "bi-exclamation-circle-fill"
        : "bi-info-circle-fill";

  return (
    <div className={`chat-toast ${type}`}>
      <i className={`bi ${icon}`} />
      <span>{message}</span>
      <button onClick={onClose}>
        <i className="bi bi-x-lg" />
      </button>
    </div>
  );
};

// ─── Avatar ─────────────────────────────────────────────────────────────────

const Avatar = ({ src, name, size = 40 }) => {
  const url = getFullImageUrl(src);
  return (
    <div className="chat-avatar" style={{ width: size, height: size }}>
      {url ? (
        <img
          src={url}
          alt={name}
          className="chat-avatar-img"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="chat-avatar-placeholder"
          style={{ width: size, height: size }}
        >
          <i className="bi bi-person-circle" />
        </div>
      )}
    </div>
  );
};

// ─── Dual Avatar ────────────────────────────────────────────────────────────

const DualAvatar = ({ participants = [], currentUserId, size = 40 }) => {
  const others = getOtherParticipants(participants, currentUserId);

  if (others.length < 2) {
    const p = others[0];
    return (
      <Avatar
        src={p?.profilePicture || p?.userId?.profilePicture || null}
        name={getParticipantDisplayName(p, "Chat")}
        size={size}
      />
    );
  }

  const small = Math.round(size * 0.7);
  const overlap = Math.round(size * 0.4);
  const containerWidth = size + overlap;

  const getSrc = (p) => p?.profilePicture || p?.userId?.profilePicture || null;

  return (
    <div
      className="dual-avatar"
      style={{
        position: "relative",
        width: containerWidth,
        height: size,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          zIndex: 1,
          borderRadius: "50%",
          boxShadow: "0 0 0 2px var(--color-background-primary)",
        }}
      >
        <Avatar
          src={getSrc(others[1])}
          name={getParticipantDisplayName(others[1], "User 2")}
          size={small}
        />
      </div>
      <div style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}>
        <Avatar
          src={getSrc(others[0])}
          name={getParticipantDisplayName(others[0], "User 1")}
          size={size}
        />
      </div>
    </div>
  );
};

// ─── Image Upload Button ──────────────────────────────────────────────────

const ImageUploadButton = ({ onUpload, disabled }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image too large. Max 10MB.");
      return;
    }

    onUpload(file);
    e.target.value = "";
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button
        className="image-upload-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        title="Upload image"
      >
        <i className="bi bi-image"></i>
      </button>
    </>
  );
};

// ─── Chat list item ──────────────────────────────────────────────────────────

const ChatListItem = ({ chat, isActive, onClick, currentUserId }) => {
  const others = getOtherParticipants(chat.participants, currentUserId);
  const displayName =
    others.length === 1
      ? getParticipantDisplayName(others[0], chat.title || "Chat")
      : others.map((p) => getParticipantDisplayName(p)).join(" & ") ||
        chat.title ||
        "Chat";

  const preview = chat.lastMessage?.content || "No messages yet";
  const unread = chat.unreadCount || 0;
  const time = chat.lastMessage?.sentAt || chat.updatedAt;

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0)
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7)
      return d.toLocaleDateString("en-US", { weekday: "short" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const typeIcon =
    chat.type === "order"
      ? "bi-bag-check"
      : chat.type === "dispute"
        ? "bi-exclamation-triangle"
        : "bi-chat-dots";

  return (
    <button
      className={`chat-list-item ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <DualAvatar
          participants={chat.participants}
          currentUserId={currentUserId}
          size={48}
        />
        {unread > 0 && (
          <span className="unread-badge">{unread > 99 ? "99+" : unread}</span>
        )}
      </div>

      <div className="chat-info">
        <div className="chat-name">{displayName}</div>
        <div className="chat-preview">
          <i className={`bi ${typeIcon}`} />
          <span>{preview.slice(0, 50)}</span>
        </div>
      </div>

      <div className="chat-meta">
        <div className="chat-time">{formatTime(time)}</div>
      </div>
    </button>
  );
};

// ─── Message bubble ──────────────────────────────────────────────────────────

const MessageBubble = ({ message, isSent, senderName, isAdmin }) => {
  const [showFullImage, setShowFullImage] = useState(false);

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const hasImages = message.attachments?.some((a) => a.type === "image");

  return (
    <div className={`message-row ${isSent ? "sent" : "received"}`}>
      <div className="message-bubble-wrapper">
        {senderName && (
          <div className={`message-sender-name ${isAdmin ? "admin" : ""}`}>
            {isAdmin && <span className="admin-badge">Admin</span>}
            {senderName}
          </div>
        )}
        <div className={`message-bubble ${isAdmin ? "admin-bubble" : ""}`}>
          <div className="message-text">{message.content}</div>

          {/* Display images */}
          {hasImages && (
            <div className="message-images">
              {message.attachments.map((attachment, idx) => {
                if (attachment.type === "image") {
                  return (
                    <div
                      key={idx}
                      className="message-image-wrapper"
                      onClick={() => setShowFullImage(true)}
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.name || "Image"}
                        className="message-image-thumb"
                        loading="lazy"
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}

          <div className="message-time">
            {formatTime(message.createdAt)}
            {isSent && <i className="bi bi-check-all" />}
          </div>
        </div>
      </div>

      {/* Full image modal */}
      {showFullImage && hasImages && (
        <div
          className="image-modal-overlay"
          onClick={() => setShowFullImage(false)}
        >
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="image-modal-close"
              onClick={() => setShowFullImage(false)}
            >
              <i className="bi bi-x-lg" />
            </button>
            <img
              src={message.attachments.find((a) => a.type === "image")?.url}
              alt="Full size"
            />
          </div>
        </div>
      )}
    </div>
  );
};
// ─── Chat window ─────────────────────────────────────────────────────────────

const ChatWindow = ({
  chat,
  currentUserId,
  currentUser,
  onMessageSent,
  apiUrl,
  socket,
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typingName, setTypingName] = useState(null);
  const [toast, setToast] = useState(null);
  const messagesAreaRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const pendingMessagesRef = useRef(new Set());

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Don't render until we have a valid user id
  if (!currentUserId) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading user…</p>
      </div>
    );
  }

  const others = getOtherParticipants(chat?.participants || [], currentUserId);
  const chatDisplayName =
    others.length === 1
      ? getParticipantDisplayName(others[0], chat?.title || "Chat")
      : others.map((p) => getParticipantDisplayName(p)).join(" & ") ||
        chat?.title ||
        "Chat";

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const el = messagesAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages, scrollToBottom]);

  const fetchMessages = useCallback(async () => {
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
        fetch(`${apiUrl}/chat/${chat._id}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } catch (err) {
      console.error("fetchMessages:", err);
    } finally {
      setLoading(false);
    }
  }, [chat, apiUrl]);

  // Socket event listeners
  useEffect(() => {
    if (!chat || !socket) return;
    setMessages([]);
    fetchMessages();

    socket.emit("joinChat", chat._id);

    const handleReconnect = () => {
      if (chat?._id) socket.emit("joinChat", chat._id);
    };
    socket.on("connect", handleReconnect);

    const handleNewMessage = ({ chatId, message }) => {
      if (chatId !== chat._id) return;
      pendingMessagesRef.current.delete(message._id);
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
      onMessageSent();
      setTimeout(() => scrollToBottom("smooth"), 100);
    };

    const handleTyping = ({ chatId, userId, name }) => {
      if (chatId !== chat._id) return;
      const uid = String(userId || "");
      const myId = String(currentUserId || "");
      if (!uid || !myId || uid === myId) return;
      const typerParticipant = chat.participants?.find(
        (p) => String(p.userId?._id || p.userId) === uid,
      );
      const displayName =
        name || getParticipantDisplayName(typerParticipant, "Someone");
      setTypingName(displayName);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingName(null), 2500);
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleTyping);

    return () => {
      socket.off("connect", handleReconnect);
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleTyping);
      clearTimeout(typingTimerRef.current);
    };
  }, [
    chat?._id,
    socket,
    currentUserId,
    fetchMessages,
    onMessageSent,
    scrollToBottom,
  ]);

  // 🔥 FIX: Prevent default behavior and stop propagation
  const sendMessage = async (e) => {
    // Prevent any default form submission or page reload
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const content = input.trim();
    if (!content || sending) return;

    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.focus();
    }
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
        const newMessage = data.message;
        pendingMessagesRef.current.add(newMessage._id);
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === newMessage._id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
        setTimeout(() => scrollToBottom("smooth"), 50);
        setTimeout(() => {
          pendingMessagesRef.current.delete(newMessage._id);
        }, 2000);
      }
    } catch (err) {
      console.error("sendMessage:", err);
      showToast("Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  // 🔥 FIX: Prevent default for image upload
  const handleImageUpload = async (file) => {
    if (!chat || !currentUserId) return;

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${apiUrl}/chat/${chat._id}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const newMessage = data.message;
        pendingMessagesRef.current.add(newMessage._id);
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === newMessage._id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
        showToast("Image uploaded successfully", "success");
        setTimeout(() => scrollToBottom("smooth"), 100);
        setTimeout(() => {
          pendingMessagesRef.current.delete(newMessage._id);
        }, 2000);
      } else {
        const error = await res.json();
        showToast(error.message || "Failed to upload image", "error");
      }
    } catch (err) {
      console.error("uploadImage:", err);
      showToast("Failed to upload image", "error");
    } finally {
      setUploading(false);
    }
  };

  // 🔥 FIX: Handle keypress with preventDefault
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      sendMessage(e);
    }
  };

  const emitTyping = () => {
    if (!socket || !chat) return;
    socket.emit("typing", {
      chatId: chat._id,
      userId: currentUserId,
      name: currentUser?.fullname || currentUser?.name || "Someone",
    });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    emitTyping();
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 100) + "px";
    }
  };

  const groupByDate = () => {
    const groups = {};
    messages.forEach((msg) => {
      const key = new Date(msg.createdAt).toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    });
    return groups;
  };

  const formatDateHeader = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
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
        <p>Loading messages…</p>
      </div>
    );
  }

  const grouped = groupByDate();
  const typeIcon =
    chat.type === "order"
      ? "bi-bag-check"
      : chat.type === "dispute"
        ? "bi-exclamation-triangle"
        : "bi-headset";

  return (
    <div className="chat-window-inner">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <DualAvatar
            participants={chat.participants || []}
            currentUserId={currentUserId}
            size={44}
          />
          <div className="chat-header-details">
            <h3>{chatDisplayName}</h3>
            <span className="chat-type-badge">
              <i className={`bi ${typeIcon}`} />
              {chat.type.charAt(0).toUpperCase() + chat.type.slice(1)} Chat
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area" ref={messagesAreaRef}>
        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className="message-date">
              <span>{formatDateHeader(date)}</span>
            </div>
            {msgs.map((msg) => {
              const senderId = normaliseId(msg.sender?.userId);
              const isSent = senderId === currentUserId;
              const isAdmin = msg.sender?.role === "admin";
              const senderName =
                msg.sender?.name || msg.sender?.fullname || "Admin";

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

        {typingName && (
          <div className="typing-indicator">
            <span>Typing</span>
            <div className="typing-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      {/* Input - 🔥 FIX: Removed form element, using div instead */}
      <div className="message-input-area">
        <div className="input-wrapper">
          <ImageUploadButton
            onUpload={handleImageUpload}
            disabled={uploading || !chat}
          />
          <textarea
            ref={inputRef}
            className="message-input"
            rows={1}
            placeholder="Type a message…"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            disabled={uploading}
          />
          <button
            className={`send-btn ${input.trim() ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              sendMessage(e);
            }}
            disabled={!input.trim() || sending || uploading}
            type="button"
          >
            {sending ? (
              <span className="spinner-small" />
            ) : (
              <i className="bi bi-send-fill" />
            )}
          </button>
        </div>
        {uploading && (
          <div className="uploading-indicator">
            <span className="spinner-small" />
            <span>Uploading image...</span>
          </div>
        )}
      </div>
    </div>
  );
};
// ─── New chat modal ──────────────────────────────────────────────────────────

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
    if (currentUser?.role !== "admin" || search.length < 2) {
      setUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${apiUrl}/admin/users?search=${encodeURIComponent(search)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          const data = await res.json();
          const meId = normaliseId(currentUser);
          setUsers((data.users || []).filter((u) => normaliseId(u) !== meId));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, currentUser, apiUrl]);

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
            <button className="btn-secondary icon-only" onClick={onClose}>
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
          <button className="btn-secondary icon-only" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="modal-body">
          <div className="chat-search-box">
            <i className="bi bi-search" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="user-list">
            {loading ? (
              <div className="loading-state" style={{ height: 120 }}>
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
                  {selected?._id === user._id && (
                    <i
                      className="bi bi-check-circle-fill"
                      style={{ color: "var(--cp-gold)" }}
                    />
                  )}
                </div>
              ))
            ) : search.length >= 2 ? (
              <div className="empty-state" >
                <i className="bi bi-inbox" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="empty-state" >
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

// ─── Main page ───────────────────────────────────────────────────────────────

const ChatPage = ({ userRole, currentUser: propUser }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const directChatId = searchParams.get("chatId");

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

  const currentUserId = currentUser ? normaliseId(currentUser) : null;

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    const update = () => setSidebarOpen(window.innerWidth > 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
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

    socket.emit("joinRoom", { userId: currentUserId, role: currentUser.role });
    socket.on("chat_notification", fetchChats);
    socket.on("new_message", fetchChats);

    return () => socket.disconnect();
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

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

        if (directChatId) {
          const targetChat = data.chats?.find(
            (chat) => chat._id === directChatId,
          );
          if (targetChat) {
            setSelectedChat(targetChat);
            if (window.innerWidth <= 768) setSidebarOpen(false);
          }
        }
      }
    } catch (err) {
      console.error("fetchChats:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, filter, directChatId]);

  useEffect(() => {
    if (currentUser) fetchChats();
  }, [currentUser, fetchChats]);

  useEffect(() => {
    if (directChatId && chats.length > 0) {
      const targetChat = chats.find((chat) => chat._id === directChatId);
      if (targetChat) {
        setSelectedChat(targetChat);
        if (window.innerWidth <= 768) setSidebarOpen(false);
      }
    }
  }, [directChatId, chats]);

  const filteredChats = chats.filter((chat) => {
    if (filter !== "all" && chat.type !== filter) return false;
    if (search) {
      const others = getOtherParticipants(chat.participants, currentUserId);
      const name = others.map((p) => getParticipantDisplayName(p)).join(" ");
      return name.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const FILTERS = [
    { key: "all", label: "All", icon: "bi-grid-fill" },
    { key: "order", label: "Orders", icon: "bi-bag-check-fill" },
    { key: "dispute", label: "Disputes", icon: "bi-exclamation-triangle-fill" },
    { key: "support", label: "Support", icon: "bi-headset" },
  ];

  if (!currentUser) {
    return (
      <div className="loading-state" style={{ height: "calc(100vh - 60px)" }}>
        <div className="spinner" />
        <p>Loading user…</p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {sidebarOpen && window.innerWidth <= 768 && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`chat-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="chat-sidebar-header">
          <h2>
            <i className="bi bi-chat-dots-fill" /> Messages
          </h2>
          <button
            className="new-chat-btn"
            onClick={() => setShowModal(true)}
            title="New conversation"
          >
            <i className="bi bi-plus-lg" />
          </button>
        </div>

        <div className="chat-search">
          <div className="chat-search-box">
            <i className="bi bi-search" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="clear-search-btn"
                onClick={() => setSearch("")}
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
                currentUserId={currentUserId}
              />
            ))
          )}
        </div>
      </div>

      {/* Mobile toggle */}
      <button
        className="mobile-toggle"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Toggle conversations"
      >
        <i className={`bi ${sidebarOpen ? "bi-x-lg" : "bi-chat-dots-fill"}`} />
      </button>

      {/* Main chat area */}
      <div className="chat-window">
        <ChatWindow
          chat={selectedChat}
          currentUserId={currentUserId}
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
