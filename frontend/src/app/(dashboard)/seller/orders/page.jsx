"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./SellerOrders.css";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
const token = () => localStorage.getItem("token");

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const icons = {
    success: "bi-check-circle-fill",
    error: "bi-exclamation-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    info: "bi-info-circle-fill",
  };

  return (
    <div className={`dashboard-toast dashboard-toast-${type}`} role="alert">
      <i className={`bi ${icons[type] || "bi-bell-fill"}`}></i>
      <span className="toast-message">{message}</span>
      <button type="button" className="toast-close-btn" onClick={onClose}>
        <i className="bi bi-x-lg"></i>
      </button>
    </div>
  );
};

// Auto-release countdown badge
const AutoReleaseCountdown = ({ autoReleaseAt }) => {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!autoReleaseAt) return;
    const calc = () => {
      const diff = new Date(autoReleaseAt) - new Date();
      if (diff <= 0) {
        setLabel("Releasing soon…");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      setLabel(`Auto-releases in ${d}d ${h}h`);
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [autoReleaseAt]);

  if (!autoReleaseAt || !label) return null;

  return (
    <small className="auto-release-badge">
      <i className="bi bi-clock-history"></i>
      {label}
    </small>
  );
};

// Dispute badge component
const DisputeBadge = ({ item, onRespond }) => {
  if (!item.disputeStatus || item.disputeStatus === "none") return null;

  const configs = {
    open: {
      label: "Refund Requested",
      color: "warning",
      icon: "bi-exclamation-triangle-fill",
      canAct: true,
    },
    approved: {
      label: "Refund Approved",
      color: "success",
      icon: "bi-check-circle",
      canAct: false,
    },
    rejected: {
      label: "Dispute Escalated",
      color: "danger",
      icon: "bi-shield-exclamation",
      canAct: false,
    },
    resolved_refund: {
      label: "Admin Refunded",
      color: "secondary",
      icon: "bi-gavel",
      canAct: false,
    },
    resolved_release: {
      label: "Admin Released",
      color: "info",
      icon: "bi-gavel",
      canAct: false,
    },
  };

  const cfg = configs[item.disputeStatus] || {
    label: item.disputeStatus,
    color: "secondary",
    icon: "bi-question-circle",
    canAct: false,
  };

  return (
    <div className="dispute-badge-wrapper">
      <span className={`dispute-badge ${cfg.color}`}>
        <i className={`bi ${cfg.icon}`}></i>
        {cfg.label}
      </span>
      {cfg.canAct && onRespond && (
        <button className="respond-dispute-btn" onClick={onRespond}>
          <i className="bi bi-reply-fill"></i>
          Respond
        </button>
      )}
      {item.disputeStatus === "open" && item.disputeExpiresAt && (
        <small className="dispute-expiry">
          Expires: {new Date(item.disputeExpiresAt).toLocaleDateString()}
        </small>
      )}
    </div>
  );
};

// Dispute Resolution Modal
const DisputeModal = ({ order, item, onClose, onResolved, showToast }) => {
  const [action, setAction] = useState("approve");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!order || !item) return null;

  const productId = (item.product?._id || item.product).toString();
  const refundAmount = item.price * item.quantity + (item.shippingFee || 0);

  const formatCurrency = (v) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (action === "reject" && !notes.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${BACKEND}/payment/resolve-dispute/${order._id}/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify({ action, sellerNotes: notes }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resolve dispute");
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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container dispute-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="bi bi-shield-exclamation"></i>
            Resolve Refund Dispute
          </h5>
          <button className="modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="info-alert warning">
              <i className="bi bi-chat-dots-fill"></i>
              <div>
                <strong>Buyer's reason:</strong>
                <p>{item.disputeReason || "No reason provided"}</p>
              </div>
            </div>

            <div className="info-alert info">
              <i className="bi bi-box-seam"></i>
              <div>
                <strong>{item.name}</strong>
                <p>Refund amount: {formatCurrency(refundAmount)}</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Your decision</label>
              <div className="decision-cards">
                <div
                  className={`decision-card ${action === "approve" ? "active approve" : ""}`}
                  onClick={() => setAction("approve")}
                >
                  <i className="bi bi-check-circle-fill"></i>
                  <strong>Approve Refund</strong>
                  <small>Buyer gets money back</small>
                </div>
                <div
                  className={`decision-card ${action === "reject" ? "active reject" : ""}`}
                  onClick={() => setAction("reject")}
                >
                  <i className="bi bi-x-circle-fill"></i>
                  <strong>Reject & Escalate</strong>
                  <small>Admin will review</small>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Notes{" "}
                {action === "reject" && <span className="required">*</span>}
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  action === "approve"
                    ? "Add a message for the buyer (optional)..."
                    : "Please explain why you're rejecting this refund request..."
                }
                required={action === "reject"}
              />
            </div>

            {action === "reject" && (
              <div className="info-alert danger">
                <i className="bi bi-info-circle-fill"></i>
                <div>
                  <strong>Escalation Notice</strong>
                  <p>
                    This will escalate the dispute to our admin team for review.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn-${action === "approve" ? "success" : "danger"}`}
              disabled={loading || (action === "reject" && !notes.trim())}
            >
              {loading ? (
                <span className="spinner-small"></span>
              ) : action === "approve" ? (
                <>
                  <i className="bi bi-check-lg"></i>
                  Approve Refund
                </>
              ) : (
                <>
                  <i className="bi bi-shield-exclamation"></i>
                  Escalate to Admin
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Order Details Modal
const OrderDetailsModal = ({
  show,
  onClose,
  order,
  onUpdateStatus,
  showToast,
  onOpenDispute,
}) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!show || !order) return null;

  const formatCurrency = (v) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(v);

  const formatDate = (d) => new Date(d).toLocaleString();

  const statusConfig = {
    pending: { color: "warning", icon: "bi-hourglass-split" },
    confirmed: { color: "info", icon: "bi-check2-circle" },
    processing: { color: "primary", icon: "bi-arrow-repeat" },
    shipped: { color: "primary", icon: "bi-truck" },
    delivered: { color: "success", icon: "bi-check2-all" },
    cancelled: { color: "danger", icon: "bi-x-circle" },
    disputed: { color: "danger", icon: "bi-exclamation-triangle" },
  };

  const paymentConfig = {
    pending: { label: "Pending", color: "warning" },
    requires_payment_method: { label: "Payment Failed", color: "danger" },
    requires_capture: { label: "In Escrow", color: "info" },
    partial_captured: { label: "Partially Released", color: "info" },
    captured: { label: "Released", color: "success" },
    paid: { label: "Paid", color: "success" },
    failed: { label: "Failed", color: "danger" },
    refunded: { label: "Refunded", color: "secondary" },
    partial_refunded: { label: "Partial Refund", color: "warning" },
  };

  const sellerItems =
    order.orderItems?.filter(
      (item) =>
        item.seller === order.sellerId || item.seller?._id === order.sellerId,
    ) || [];

  const nextStatuses = (current) =>
    ({
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: [],
      delivered: [],
      cancelled: [],
      disputed: [],
    })[current] || [];

  const handleStatusUpdate = async (productId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`${BACKEND}/orders/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          orderId: order._id,
          productId,
          orderStatus: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status");

      const msg =
        newStatus === "cancelled"
          ? "Item cancelled and refunded successfully!"
          : newStatus === "shipped"
            ? "Item marked as shipped. 10-day buyer review period started."
            : `Status updated to ${newStatus}`;
      showToast(msg, "success");
      onUpdateStatus();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container order-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="bi bi-receipt"></i>
            Order #{order._id?.slice(-8).toUpperCase()}
          </h5>
          <button className="modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="modal-body">
          {/* Customer & Shipping */}
          <div className="info-grid">
            <div className="info-card">
              <h6>
                <i className="bi bi-person"></i> Customer
              </h6>
              <p>
                <strong>Name:</strong>{" "}
                {order.user?.fullname || order.shippingAddress?.fullName}
              </p>
              <p>
                <strong>Email:</strong> {order.user?.email}
              </p>
              <p>
                <strong>Phone:</strong> {order.shippingAddress?.phone}
              </p>
            </div>
            <div className="info-card">
              <h6>
                <i className="bi bi-geo-alt"></i> Shipping Address
              </h6>
              <p>{order.shippingAddress?.address}</p>
              <p>
                {order.shippingAddress?.city},{" "}
                {order.shippingAddress?.postalCode}
              </p>
              <p>{order.shippingAddress?.country}</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="summary-grid">
            <div className="summary-item">
              <small>Order Date</small>
              <strong>{formatDate(order.createdAt)}</strong>
            </div>
            <div className="summary-item">
              <small>Payment Method</small>
              <strong className="capitalize">{order.paymentMethod}</strong>
            </div>
            <div className="summary-item">
              <small>Payment Status</small>
              <span
                className={`status-badge ${paymentConfig[order.paymentStatus]?.color || "secondary"}`}
              >
                {paymentConfig[order.paymentStatus]?.label ||
                  order.paymentStatus}
              </span>
            </div>
            <div className="summary-item">
              <small>Your Earnings</small>
              <strong className="gold-text">
                {formatCurrency(
                  sellerItems.reduce((s, i) => s + i.price * i.quantity, 0),
                )}
              </strong>
            </div>
          </div>

          {/* Escrow Notice */}
          {order.paymentStatus === "requires_capture" && (
            <div className="info-alert info">
              <i className="bi bi-shield-lock-fill"></i>
              <div>
                <strong>Funds held in escrow</strong>
                <p>
                  Payment of {formatCurrency(order.totalPrice)} is securely
                  held. Funds release when the buyer confirms delivery or the
                  10-day review window closes.
                </p>
              </div>
            </div>
          )}

          {order.paymentStatus === "captured" && (
            <div className="info-alert success">
              <i className="bi bi-check-circle-fill"></i>
              <div>
                <strong>Payment released</strong>
                <p>Funds have been transferred to your wallet.</p>
              </div>
            </div>
          )}

          {/* Products Table */}
          <h6 className="section-title">
            <i className="bi bi-grid"></i> Your Products
          </h6>
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellerItems.map((item, idx) => {
                  const productId = (
                    item.product._id || item.product
                  ).toString();
                  const nexts = nextStatuses(item.orderStatus);
                  const hasOpenDispute = item.disputeStatus === "open";
                  const status = statusConfig[item.orderStatus] || {
                    color: "secondary",
                    icon: "bi-question",
                  };

                  return (
                    <tr key={idx}>
                      <td className="product-cell">
                        {item.product?.images?.[0] && (
                          <img
                            src={`${BACKEND}${item.product.images[0]}`}
                            alt={item.name}
                            className="product-thumb"
                          />
                        )}
                        <span>{item.name}</span>
                      </td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>{item.quantity}</td>
                      <td className="gold-text">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                      <td>
                        <span className={`status-badge ${status.color}`}>
                          <i className={`bi ${status.icon}`}></i>
                          {item.orderStatus}
                        </span>
                        <DisputeBadge
                          item={item}
                          onRespond={() => onOpenDispute(order, item)}
                        />
                        {item.orderStatus === "shipped" &&
                          item.autoReleaseAt && (
                            <AutoReleaseCountdown
                              autoReleaseAt={item.autoReleaseAt}
                            />
                          )}
                      </td>
                      <td>
                        {hasOpenDispute ? (
                          <span className="blocked-message">
                            <i className="bi bi-lock-fill"></i>
                            Dispute pending
                          </span>
                        ) : (
                          <div className="action-buttons">
                            {nexts.map((status) => (
                              <button
                                key={status}
                                className={`action-btn ${status}`}
                                onClick={() =>
                                  handleStatusUpdate(productId, status)
                                }
                                disabled={updatingStatus}
                              >
                                {status === "cancelled" && (
                                  <i className="bi bi-x-circle"></i>
                                )}
                                {status === "shipped" && (
                                  <i className="bi bi-truck"></i>
                                )}
                                {status !== "cancelled" &&
                                  status !== "shipped" &&
                                  status}
                                {status === "cancelled" && "Cancel"}
                                {status === "shipped" && "Ship"}
                              </button>
                            ))}
                            {nexts.length === 0 &&
                              item.orderStatus !== "shipped" && (
                                <span className="text-muted small">
                                  No actions
                                </span>
                              )}
                          </div>
                        )}
                        {item.orderStatus === "cancelled" && (
                          <small className="refunded-text">
                            <i className="bi bi-arrow-repeat"></i>
                            Refunded to buyer
                          </small>
                        )}
                        {item.orderStatus === "delivered" && (
                          <small className="released-text">
                            <i className="bi bi-check-circle"></i>
                            Payment released
                          </small>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Order Totals */}
          <div className="totals-section">
            <div className="totals-card">
              <div className="total-row">
                <span>Subtotal:</span>
                <strong>{formatCurrency(order.itemsPrice)}</strong>
              </div>
              <div className="total-row">
                <span>Shipping:</span>
                <strong>{formatCurrency(order.shippingPrice)}</strong>
              </div>
              <div className="total-row">
                <span>Tax:</span>
                <strong>{formatCurrency(order.taxPrice)}</strong>
              </div>
              <hr />
              <div className="total-row grand">
                <span>Total:</span>
                <strong className="gold-text">
                  {formatCurrency(order.totalPrice)}
                </strong>
              </div>
            </div>
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
};

// Main SellerOrders Component
const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [disputeOrder, setDisputeOrder] = useState(null);
  const [disputeItem, setDisputeItem] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/orders/seller`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openDispute = (order, item) => {
    setShowDetailsModal(false);
    setDisputeOrder(order);
    setDisputeItem(item);
    setShowDisputeModal(true);
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(v);

  const formatDate = (d) => new Date(d).toLocaleDateString();

  const statusConfig = {
    pending: "warning",
    confirmed: "info",
    processing: "primary",
    shipped: "primary",
    delivered: "success",
    cancelled: "danger",
    disputed: "danger",
  };

  const paymentConfig = {
    pending: { label: "Pending", color: "warning" },
    requires_payment_method: { label: "Failed", color: "danger" },
    requires_capture: { label: "Escrow", color: "info" },
    partial_captured: { label: "Part. Released", color: "info" },
    captured: { label: "Released", color: "success" },
    paid: { label: "Paid", color: "success" },
    failed: { label: "Failed", color: "danger" },
    refunded: { label: "Refunded", color: "secondary" },
    partial_refunded: { label: "Part. Refund", color: "warning" },
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) =>
      o.orderItems?.some((i) => i.orderStatus === "pending"),
    ).length,
    shipped: orders.filter((o) =>
      o.orderItems?.some((i) => i.orderStatus === "shipped"),
    ).length,
    disputes: orders.filter((o) =>
      o.orderItems?.some((i) => i.disputeStatus === "open"),
    ).length,
    inEscrow: orders.filter((o) => o.paymentStatus === "requires_capture")
      .length,
    revenue: orders.reduce((sum, o) => {
      const items =
        o.orderItems?.filter(
          (i) => i.seller === o.sellerId || i.seller?._id === o.sellerId,
        ) || [];
      return sum + items.reduce((s, i) => s + i.price * i.quantity, 0);
    }, 0),
  };

  const filteredOrders = orders.filter((order) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      order._id.toLowerCase().includes(q) ||
      order.user?.fullname?.toLowerCase().includes(q) ||
      order.orderItems?.some((i) => i.name.toLowerCase().includes(q));

    const matchStatus =
      statusFilter === "all" ||
      order.orderItems?.some((i) => i.orderStatus === statusFilter);

    const matchPayment =
      paymentFilter === "all" || order.paymentStatus === paymentFilter;

    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const ago = (days) => new Date(now - days * 86400000);
    const matchDate =
      dateFilter === "all"
        ? true
        : dateFilter === "today"
          ? orderDate.toDateString() === now.toDateString()
          : dateFilter === "yesterday"
            ? orderDate.toDateString() === ago(1).toDateString()
            : dateFilter === "week"
              ? orderDate >= ago(7)
              : dateFilter === "month"
                ? orderDate >= ago(30)
                : true;

    return matchSearch && matchStatus && matchPayment && matchDate;
  });

  return (
    <div className="seller-orders">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <OrderDetailsModal
        show={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onUpdateStatus={() => {
          fetchOrders();
          showToast("Order status updated", "success");
        }}
        showToast={showToast}
        onOpenDispute={openDispute}
      />

      {showDisputeModal && (
        <DisputeModal
          order={disputeOrder}
          item={disputeItem}
          onClose={() => {
            setShowDisputeModal(false);
            setDisputeOrder(null);
            setDisputeItem(null);
          }}
          onResolved={fetchOrders}
          showToast={showToast}
        />
      )}

      <div className="orders-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="header-badge">
              <i className="bi bi-box-seam"></i>
              <span>Order Management</span>
            </div>
            <h1 className="page-title">Orders Management</h1>
            <p className="page-subtitle">
              Manage and track your customer orders
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <i className="bi bi-receipt"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stats.total}</h3>
              <p className="stat-label">Total Orders</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <i className="bi bi-hourglass-split"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stats.pending}</h3>
              <p className="stat-label">Pending</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon shipped">
              <i className="bi bi-truck"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stats.shipped}</h3>
              <p className="stat-label">Shipped</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon disputes">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-value text-danger">{stats.disputes}</h3>
              <p className="stat-label">Disputes</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon escrow">
              <i className="bi bi-shield-lock-fill"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stats.inEscrow}</h3>
              <p className="stat-label">In Escrow</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon revenue">
              <i className="bi bi-currency-dollar"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-value gold-text">
                {formatCurrency(stats.revenue)}
              </h3>
              <p className="stat-label">Revenue</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search order ID, customer, product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="disputed">Disputed</option>
          </select>
          <select
            className="filter-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">All Payments</option>
            <option value="requires_capture">In Escrow</option>
            <option value="captured">Released</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            className="filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <button
            className="reset-btn"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setPaymentFilter("all");
              setDateFilter("all");
            }}
          >
            <i className="bi bi-arrow-counterclockwise"></i>
            Reset
          </button>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="loading-state">
            <div className="gold-spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-inbox"></i>
            <h5>No orders found</h5>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="orders-card">
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Products</th>
                    <th>Your Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const sellerItems =
                      order.orderItems?.filter(
                        (i) =>
                          i.seller === order.sellerId ||
                          i.seller?._id === order.sellerId,
                      ) || [];
                    const sellerTotal = sellerItems.reduce(
                      (s, i) => s + i.price * i.quantity,
                      0,
                    );
                    const statuses = [
                      ...new Set(sellerItems.map((i) => i.orderStatus)),
                    ];
                    const hasOpenDispute = sellerItems.some(
                      (i) => i.disputeStatus === "open",
                    );
                    const hasShipped = sellerItems.some(
                      (i) => i.orderStatus === "shipped" && i.autoReleaseAt,
                    );
                    const soonest = hasShipped
                      ? sellerItems
                          .filter(
                            (i) =>
                              i.orderStatus === "shipped" && i.autoReleaseAt,
                          )
                          .sort(
                            (a, b) =>
                              new Date(a.autoReleaseAt) -
                              new Date(b.autoReleaseAt),
                          )[0]
                      : null;

                    return (
                      <tr
                        key={order._id}
                        className={hasOpenDispute ? "dispute-row" : ""}
                      >
                        <td className="order-id">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedOrder(order);
                              setShowDetailsModal(true);
                            }}
                          >
                            #{order._id.slice(-8).toUpperCase()}
                          </a>
                        </td>
                        <td>
                          {order.user?.fullname ||
                            order.shippingAddress?.fullName}
                        </td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td className="products-cell">
                          <div className="products-info">
                            <span className="item-count">
                              {sellerItems.length} item(s)
                            </span>
                            <span className="product-names">
                              {sellerItems
                                .map((i) => i.name)
                                .join(", ")
                                .substring(0, 40)}
                              ...
                            </span>
                            {hasOpenDispute && (
                              <span className="dispute-tag">
                                <i className="bi bi-exclamation-triangle-fill"></i>
                                Refund requested
                              </span>
                            )}
                            {soonest && (
                              <AutoReleaseCountdown
                                autoReleaseAt={soonest.autoReleaseAt}
                              />
                            )}
                          </div>
                        </td>
                        <td className="gold-text fw-bold">
                          {formatCurrency(sellerTotal)}
                        </td>
                        <td>
                          <div className="status-tags">
                            {statuses.map((s, i) => (
                              <span
                                key={i}
                                className={`status-badge ${statusConfig[s] || "secondary"}`}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`payment-badge ${paymentConfig[order.paymentStatus]?.color || "secondary"}`}
                          >
                            {paymentConfig[order.paymentStatus]?.label ||
                              order.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="icon-btn view"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowDetailsModal(true);
                              }}
                              title="View Details"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            {hasOpenDispute &&
                              (() => {
                                const disputedItem = sellerItems.find(
                                  (i) => i.disputeStatus === "open",
                                );
                                return disputedItem ? (
                                  <button
                                    className="icon-btn respond"
                                    onClick={() =>
                                      openDispute(order, disputedItem)
                                    }
                                    title="Respond to refund request"
                                  >
                                    <i className="bi bi-reply-fill"></i>
                                  </button>
                                ) : null;
                              })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOrders;
