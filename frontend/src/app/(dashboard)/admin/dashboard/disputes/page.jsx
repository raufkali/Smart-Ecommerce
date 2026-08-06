"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import "./AdminDisputePanel.css";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
const tok = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : "";

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const icons = {
    success: "bi-check-circle-fill",
    error: "bi-exclamation-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    info: "bi-info-circle-fill",
  };
  return (
    <div className={`adp-toast adp-toast-${type}`}>
      <i className={`bi ${icons[type] || "bi-bell"}`}></i>
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const Badge = ({ label, color }) => (
  <span className={`adp-badge adp-badge-${color}`}>{label}</span>
);

const disputeStatusBadge = (status) => {
  const map = {
    open: { label: "Open", color: "warning" },
    rejected: { label: "Escalated", color: "danger" },
    disputed: { label: "Disputed", color: "danger" },
    approved: { label: "Refunded", color: "success" },
    resolved_refund: { label: "Resolved: Refund", color: "secondary" },
    resolved_release: { label: "Resolved: Released", color: "info" },
  };
  const cfg = map[status] || { label: status, color: "secondary" };
  return <Badge {...cfg} />;
};

// ─── Countdown timer badge ────────────────────────────────────────────────────
const Countdown = ({ expiresAt }) => {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) {
        setLabel("Expired");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setLabel(`${h}h ${m}m remaining`);
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [expiresAt]);
  if (!label) return null;
  return (
    <span className="adp-countdown">
      <i className="bi bi-clock-history"></i> {label}
    </span>
  );
};

// ─── 3-way Dispute Chat Panel ─────────────────────────────────────────────────
const DisputeChat = ({ chatId, currentUserId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const res = await fetch(`${BACKEND}/chat/${chatId}/messages?limit=100`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const data = await res.json();
      if (data.success) setMessages(data.messages || []);
    } catch (err) {
      console.error("Chat fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    fetchMessages();
    const id = setInterval(fetchMessages, 5000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${BACKEND}/chat/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tok()}`,
        },
        body: JSON.stringify({ content: input.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setInput("");
      }
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  const roleColor = {
    buyer: "#3b82f6",
    seller: "#f59e0b",
    admin: "#10b981",
    system: "#6b7280",
  };
  const roleLabel = {
    buyer: "Buyer",
    seller: "Seller",
    admin: "Admin",
    system: "System",
  };

  if (loading) {
    return (
      <div className="adp-chat-panel">
        <div className="adp-chat-loading">
          <div className="adp-spinner"></div>
          <p>Loading chat…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="adp-chat-panel">
      <div className="adp-chat-header">
        <div className="adp-chat-title">
          <i className="bi bi-chat-dots-fill"></i>
          <span>Dispute Chat</span>
          <span className="adp-chat-live">● Live</span>
        </div>
        <button className="adp-chat-close" onClick={onClose}>
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <div className="adp-chat-participants">
        {["buyer", "seller", "admin"].map((role) => (
          <span
            key={role}
            className={`adp-participant adp-participant-${role}`}
          >
            <i className="bi bi-person-circle"></i>
            {roleLabel[role]}
          </span>
        ))}
      </div>

      <div className="adp-chat-messages">
        {messages.length === 0 && (
          <div className="adp-chat-empty">
            <i className="bi bi-chat-square-dots"></i>
            <p>No messages yet. Start the conversation.</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const role = msg.sender?.role || "system";
          const isMe = msg.sender?.userId === currentUserId;
          const color = roleColor[role] || "#6b7280";

          return (
            <div
              key={msg._id || idx}
              className={`adp-msg ${isMe ? "adp-msg-mine" : "adp-msg-other"}`}
            >
              {!isMe && (
                <div className="adp-msg-avatar" style={{ background: color }}>
                  {(msg.sender?.name || role)[0].toUpperCase()}
                </div>
              )}
              <div className="adp-msg-body">
                {!isMe && (
                  <div className="adp-msg-meta">
                    <span className="adp-msg-name" style={{ color }}>
                      {msg.sender?.name || roleLabel[role]}
                    </span>
                    <span
                      className="adp-msg-role"
                      style={{ background: color }}
                    >
                      {roleLabel[role]}
                    </span>
                  </div>
                )}
                <div
                  className={`adp-msg-bubble ${isMe ? "adp-bubble-mine" : ""}`}
                >
                  {msg.content}
                </div>
                <div className="adp-msg-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="adp-chat-input-area">
        <textarea
          className="adp-chat-input"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
        />
        <button
          className="adp-chat-send"
          onClick={sendMessage}
          disabled={sending || !input.trim()}
        >
          {sending ? (
            <div className="adp-spinner adp-spinner-sm"></div>
          ) : (
            <i className="bi bi-send-fill"></i>
          )}
        </button>
      </div>
    </div>
  );
};

// ─── Arbitration Modal ────────────────────────────────────────────────────────
const ArbitrationModal = ({ dispute, onClose, onResolved, showToast }) => {
  const [ruling, setRuling] = useState("refund_buyer");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!dispute) return null;

  const { order, item } = dispute;
  const productId = (item.product?._id || item.product).toString();
  const refundAmount = item.price * item.quantity + (item.shippingFee || 0);
  const sellerAmount = refundAmount * 0.9;
  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${BACKEND}/payment/admin/arbitrate/${order._id}/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tok()}`,
          },
          body: JSON.stringify({ ruling, notes }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Arbitration failed");
      showToast(data.message, "success");
      onResolved();
      onClose();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adp-modal-overlay" onClick={onClose}>
      <div className="adp-modal" onClick={(e) => e.stopPropagation()}>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div className="adp-modal-header">
            <h5>
              <i className="bi bi-gavel me-2"></i>
              Make a Ruling
            </h5>
            <button type="button" className="adp-modal-close" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="adp-modal-body">
            <div className="adp-case-summary">
              <div className="adp-case-row">
                <span>Order</span>
                <strong>#{order._id?.slice(-8).toUpperCase()}</strong>
              </div>
              <div className="adp-case-row">
                <span>Product</span>
                <strong>{item.name}</strong>
              </div>
              <div className="adp-case-row">
                <span>Buyer's Claim</span>
                <em>"{item.disputeReason || "No reason provided"}"</em>
              </div>
              {item.sellerDisputeNotes && (
                <div className="adp-case-row">
                  <span>Seller's Response</span>
                  <em>"{item.sellerDisputeNotes}"</em>
                </div>
              )}
            </div>

            <div className="adp-financial-impact">
              <h6>Financial Impact</h6>
              <div className="adp-impact-cards">
                <div
                  className={`adp-impact-card ${ruling === "refund_buyer" ? "active" : ""}`}
                >
                  <div className="adp-impact-label">If Buyer Wins</div>
                  <div className="adp-impact-amount buyer">
                    {fmt(refundAmount)}
                  </div>
                  <div className="adp-impact-sub">refunded to buyer</div>
                </div>
                <div
                  className={`adp-impact-card ${ruling === "release_seller" ? "active" : ""}`}
                >
                  <div className="adp-impact-label">If Seller Wins</div>
                  <div className="adp-impact-amount seller">
                    {fmt(sellerAmount)}
                  </div>
                  <div className="adp-impact-sub">
                    released to seller (after 10% fee)
                  </div>
                </div>
              </div>
            </div>

            <div className="adp-ruling-section">
              <label className="adp-field-label">Your Ruling</label>
              <div className="adp-ruling-cards">
                <div
                  className={`adp-ruling-card ${ruling === "refund_buyer" ? "selected refund" : ""}`}
                  onClick={() => setRuling("refund_buyer")}
                >
                  <i className="bi bi-arrow-return-left"></i>
                  <strong>Refund Buyer</strong>
                  <small>
                    Buyer's claim is valid. Cancel the item and refund{" "}
                    {fmt(refundAmount)}.
                  </small>
                </div>
                <div
                  className={`adp-ruling-card ${ruling === "release_seller" ? "selected release" : ""}`}
                  onClick={() => setRuling("release_seller")}
                >
                  <i className="bi bi-send-check"></i>
                  <strong>Release to Seller</strong>
                  <small>
                    Seller's position is valid. Release {fmt(sellerAmount)} to
                    seller.
                  </small>
                </div>
              </div>
            </div>

            <div className="adp-field-group">
              <label className="adp-field-label">
                Admin Notes <span className="adp-required">*</span>
                <small className="adp-field-hint">
                  (visible to both parties after ruling)
                </small>
              </label>
              <textarea
                className="adp-textarea"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain your reasoning clearly. Both buyer and seller will see this..."
                required
              />
              <small className="adp-char-count">
                {notes.length} characters
              </small>
            </div>

            <div className="adp-ruling-warning">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <p>
                This action is <strong>permanent and irreversible</strong>.
                Funds will be moved immediately via Stripe. Both parties will be
                notified.
              </p>
            </div>
          </div>

          <div className="adp-modal-footer">
            <button
              type="button"
              className="adp-btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`adp-btn-ruling ${ruling === "refund_buyer" ? "adp-btn-refund" : "adp-btn-release"}`}
              disabled={loading || !notes.trim()}
            >
              {loading ? (
                <div className="adp-spinner adp-spinner-sm"></div>
              ) : ruling === "refund_buyer" ? (
                <>
                  <i className="bi bi-arrow-return-left me-2"></i>Issue Refund
                  to Buyer
                </>
              ) : (
                <>
                  <i className="bi bi-send-check me-2"></i>Release Funds to
                  Seller
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Dispute Card ─────────────────────────────────────────────────────────────
const DisputeCard = ({ dispute, onOpenChat, onOpenArbitration, isActive }) => {
  const { order, item } = dispute;
  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);
  const totalAmount = item.price * item.quantity + (item.shippingFee || 0);
  const isResolved = [
    "resolved_refund",
    "resolved_release",
    "approved",
  ].includes(item.disputeStatus);

  return (
    <div
      className={`adp-dispute-card ${isActive ? "adp-card-active" : ""} ${isResolved ? "adp-card-resolved" : ""}`}
    >
      <div className="adp-card-top">
        <div className="adp-card-id">
          <i className="bi bi-receipt"></i>
          Order #{order._id?.slice(-8).toUpperCase()}
        </div>
        {disputeStatusBadge(item.disputeStatus || item.orderStatus)}
      </div>

      <div className="adp-card-product">
        <i className="bi bi-box-seam"></i>
        <strong>{item.name}</strong>
        <span className="adp-card-amount">{fmt(totalAmount)}</span>
      </div>

      <div className="adp-card-parties">
        <div className="adp-party buyer">
          <i className="bi bi-person-circle"></i>
          <div>
            <small>Buyer</small>
            <strong>{order.user?.fullname || "—"}</strong>
          </div>
        </div>
        <div className="adp-vs">vs</div>
        <div className="adp-party seller">
          <i className="bi bi-shop"></i>
          <div>
            <small>Seller</small>
            <strong>{item.seller?.fullname || "—"}</strong>
          </div>
        </div>
      </div>

      {item.disputeReason && (
        <div className="adp-card-reason">
          <i className="bi bi-chat-quote"></i>
          <em>"{item.disputeReason}"</em>
        </div>
      )}

      {item.disputeExpiresAt && !isResolved && (
        <Countdown expiresAt={item.disputeExpiresAt} />
      )}

      <div className="adp-card-date">
        <i className="bi bi-calendar3"></i>
        {new Date(order.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </div>

      <div className="adp-card-actions">
        {item.disputeChatId && (
          <button
            className={`adp-btn-chat ${isActive ? "adp-btn-chat-active" : ""}`}
            onClick={() => onOpenChat(dispute)}
          >
            <i
              className={`bi ${isActive ? "bi-chat-dots-fill" : "bi-chat-dots"}`}
            ></i>
            {isActive ? "Chatting…" : "Open Chat"}
          </button>
        )}
        {!item.disputeChatId && !isResolved && (
          <span className="adp-no-chat">
            <i className="bi bi-info-circle"></i> Chat not yet created
          </span>
        )}
        {!isResolved && (
          <button
            className="adp-btn-rule"
            onClick={() => onOpenArbitration(dispute)}
          >
            <i className="bi bi-gavel"></i>
            Make Ruling
          </button>
        )}
        {isResolved && (
          <span className="adp-resolved-label">
            <i className="bi bi-check-circle-fill"></i>
            Case closed
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Main Admin Dispute Panel ─────────────────────────────────────────────────
const AdminDisputePanel = ({ adminUserId }) => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [arbitrating, setArbitrating] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/admin/disputes`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const data = await res.json();
      if (data.success) setDisputes(data.disputes || []);
      else throw new Error(data.message);
    } catch (err) {
      showToast("Failed to load disputes: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const openChat = (dispute) => {
    const chatId = dispute.item.disputeChatId;
    if (!chatId) return;
    setActiveChat({
      chatId: chatId.toString(),
      disputeLabel: `Order #${dispute.order._id?.slice(-8).toUpperCase()} — ${dispute.item.name}`,
    });
  };

  const resolvedStatuses = ["resolved_refund", "resolved_release", "approved"];

  const filteredDisputes = disputes.filter((d) => {
    const isResolved = resolvedStatuses.includes(d.item.disputeStatus);
    const matchFilter =
      filter === "all" ? true : filter === "pending" ? !isResolved : isResolved;

    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.order._id?.toLowerCase().includes(q) ||
      d.item.name?.toLowerCase().includes(q) ||
      d.order.user?.fullname?.toLowerCase().includes(q) ||
      d.item.seller?.fullname?.toLowerCase().includes(q);

    return matchFilter && matchSearch;
  });

  const pendingCount = disputes.filter(
    (d) => !resolvedStatuses.includes(d.item.disputeStatus),
  ).length;
  const resolvedCount = disputes.filter((d) =>
    resolvedStatuses.includes(d.item.disputeStatus),
  ).length;

  return (
    <div className="adp-root">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {arbitrating && (
        <ArbitrationModal
          dispute={arbitrating}
          onClose={() => setArbitrating(null)}
          onResolved={() => {
            fetchDisputes();
            setArbitrating(null);
          }}
          showToast={showToast}
        />
      )}

      {/* Flat Layout - No sticky headers */}
      <div className="adp-container">
        {/* Header Section */}
        <div className="adp-header-section">
          <div className="adp-header-content">
            <div>
              <h2 className="adp-title">
                <i className="bi bi-shield-exclamation"></i>
                Dispute Center
              </h2>
              <p className="adp-subtitle">
                Review escalated disputes, chat with both parties, and issue
                rulings.
              </p>
            </div>
            <div className="adp-stats">
              <div className="adp-stat pending">
                <span>{pendingCount}</span>
                <small>Pending</small>
              </div>
              <div className="adp-stat resolved">
                <span>{resolvedCount}</span>
                <small>Resolved</small>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="adp-filters">
            <div className="adp-search">
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Search order, product, buyer, seller…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="adp-filter-tabs">
              {["pending", "resolved", "all"].map((f) => (
                <button
                  key={f}
                  className={`adp-filter-tab ${filter === f ? "active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className={`adp-content ${activeChat ? "with-chat" : ""}`}>
          {/* Disputes List */}
          <div className="adp-list">
            {loading ? (
              <div className="adp-state-center">
                <div className="adp-spinner adp-spinner-lg"></div>
                <p>Loading disputes…</p>
              </div>
            ) : filteredDisputes.length === 0 ? (
              <div className="adp-state-center">
                <i className="bi bi-check-circle adp-empty-icon"></i>
                <h5>
                  {filter === "pending"
                    ? "No pending disputes"
                    : "No disputes found"}
                </h5>
                <p>
                  {filter === "pending"
                    ? "All disputes have been resolved."
                    : "Try adjusting your search or filter."}
                </p>
              </div>
            ) : (
              <div className="adp-cards">
                {filteredDisputes.map((dispute, idx) => (
                  <DisputeCard
                    key={`${dispute.order._id}-${idx}`}
                    dispute={dispute}
                    isActive={
                      activeChat?.chatId ===
                      dispute.item.disputeChatId?.toString()
                    }
                    onOpenChat={openChat}
                    onOpenArbitration={setArbitrating}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Chat Panel */}
          {activeChat && (
            <div className="adp-chat-wrapper">
              <div className="adp-chat-label">
                <i className="bi bi-shield-exclamation"></i>
                <span>{activeChat.disputeLabel}</span>
              </div>
              <DisputeChat
                chatId={activeChat.chatId}
                currentUserId={adminUserId}
                onClose={() => setActiveChat(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDisputePanel;
