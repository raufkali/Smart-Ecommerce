"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
const token = () => localStorage.getItem("token");

// ─────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────
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
  const colors = {
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-warning",
    info: "bg-info",
  };

  return (
    <div
      className={`${colors[type] || "bg-primary"} text-white`}
      role="alert"
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        minWidth: 300,
        maxWidth: 400,
        padding: "1rem 1.25rem",
        borderRadius: "0.5rem",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        zIndex: 9999,
        animation: "slideIn 0.3s ease forwards",
      }}
    >
      <i className={`bi ${icons[type] || "bi-bell-fill"} me-2`}></i>
      <span className="flex-grow-1">{message}</span>
      <button
        type="button"
        className="btn-close btn-close-white ms-3"
        onClick={onClose}
      />
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────
// Auto-release countdown badge
// Shows how many days/hours remain until funds auto-release
// ─────────────────────────────────────────────
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
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [autoReleaseAt]);

  if (!autoReleaseAt || !label) return null;

  return (
    <small className="text-info d-block mt-1">
      <i className="bi bi-clock me-1"></i>
      {label}
    </small>
  );
};

// ─────────────────────────────────────────────
// Dispute badge + respond button (shown in table rows and modal)
// ─────────────────────────────────────────────
const DisputeBadge = ({ item, onRespond }) => {
  if (!item.disputeStatus || item.disputeStatus === "none") return null;

  const configs = {
    open: {
      label: "Refund requested",
      color: "warning",
      icon: "bi-exclamation-triangle-fill",
      canAct: true,
    },
    approved: {
      label: "Refund approved",
      color: "success",
      icon: "bi-check-circle",
      canAct: false,
    },
    rejected: {
      label: "Dispute escalated",
      color: "danger",
      icon: "bi-shield-exclamation",
      canAct: false,
    },
    resolved_refund: {
      label: "Admin: refunded",
      color: "secondary",
      icon: "bi-gavel",
      canAct: false,
    },
    resolved_release: {
      label: "Admin: released",
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
    <div className="mt-1">
      <span className={`badge bg-${cfg.color} me-2`}>
        <i className={`bi ${cfg.icon} me-1`}></i>
        {cfg.label}
      </span>
      {cfg.canAct && onRespond && (
        <button
          className="btn btn-sm btn-warning py-0 px-2"
          onClick={onRespond}
        >
          <i className="bi bi-reply me-1"></i>Respond
        </button>
      )}
      {item.disputeStatus === "open" && item.disputeExpiresAt && (
        <small className="text-muted ms-2">
          Expires: {new Date(item.disputeExpiresAt).toLocaleDateString()}
        </small>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Dispute Resolution Modal
// Seller approves (refund buyer) or rejects (escalate to admin)
// ─────────────────────────────────────────────
const DisputeModal = ({ order, item, onClose, onResolved, showToast }) => {
  const [action, setAction] = useState("approve");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!order || !item) return null;

  const productId = (item.product?._id || item.product).toString();
  const refundAmount = item.price * item.quantity + (item.shippingFee || 0);
  const fmt = (v) =>
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
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-shield-exclamation me-2 text-warning"></i>
              Resolve Refund Dispute
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-warning mb-3">
                <strong>Buyer&apos;s reason:</strong>{" "}
                {item.disputeReason || "No reason provided"}
              </div>
              <div className="alert alert-info mb-3">
                <strong>Product:</strong> {item.name}
                <br />
                <strong>Refund amount:</strong> {fmt(refundAmount)}
              </div>

              {/* Choice cards */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Your decision</label>
                <div className="d-flex gap-3">
                  <div
                    className={`border rounded p-3 flex-fill text-center ${
                      action === "approve"
                        ? "border-success bg-success bg-opacity-10"
                        : "border-secondary"
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setAction("approve")}
                  >
                    <i className="bi bi-check-circle-fill text-success d-block mb-1 fs-4"></i>
                    <strong className="text-success d-block">Approve</strong>
                    <small className="text-muted">Buyer gets money back</small>
                  </div>
                  <div
                    className={`border rounded p-3 flex-fill text-center ${
                      action === "reject"
                        ? "border-danger bg-danger bg-opacity-10"
                        : "border-secondary"
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setAction("reject")}
                  >
                    <i className="bi bi-x-circle-fill text-danger d-block mb-1 fs-4"></i>
                    <strong className="text-danger d-block">Reject</strong>
                    <small className="text-muted">Escalate to admin</small>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Notes{" "}
                  {action === "reject" && (
                    <span className="text-danger">*</span>
                  )}
                  <span className="text-muted fw-normal">
                    {" "}
                    (optional for approve)
                  </span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    action === "approve"
                      ? "Any message for the buyer…"
                      : "Explain why you are rejecting this refund request…"
                  }
                  required={action === "reject"}
                />
              </div>

              {action === "reject" && (
                <div className="alert alert-danger mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Rejecting escalates this to our admin team. Please provide a
                  clear explanation.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn ${action === "approve" ? "btn-success" : "btn-danger"}`}
                disabled={loading || (action === "reject" && !notes.trim())}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" />
                ) : action === "approve" ? (
                  <>
                    <i className="bi bi-check-lg me-1"></i>Approve Refund
                  </>
                ) : (
                  <>
                    <i className="bi bi-x-lg me-1"></i>Reject & Escalate
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Order Details Modal
// Shows customer info, escrow status, per-item status controls,
// dispute badges, auto-release countdown
// ─────────────────────────────────────────────
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

  const fmt = (v) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(v);
  const fmtDate = (d) => new Date(d).toLocaleString();

  const badgeColor = {
    pending: "warning",
    confirmed: "info",
    processing: "primary",
    shipped: "primary",
    delivered: "success",
    cancelled: "danger",
    disputed: "danger",
  };
  const paymentLabel = {
    pending: "Pending",
    requires_payment_method: "Payment Failed",
    requires_capture: "Held in Escrow",
    partial_captured: "Partial Released",
    captured: "Released",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
    partial_refunded: "Partial Refunded",
  };
  const paymentColor = {
    pending: "warning",
    requires_payment_method: "danger",
    requires_capture: "info",
    partial_captured: "info",
    captured: "success",
    paid: "success",
    failed: "danger",
    refunded: "secondary",
    partial_refunded: "warning",
  };

  // Filter items that belong to this seller
  const sellerItems =
    order.orderItems?.filter(
      (item) =>
        item.seller === order.sellerId || item.seller?._id === order.sellerId,
    ) || [];

  // Status flow — sellers cannot set "delivered"; that's buyer-triggered
  const nextStatuses = (current) =>
    ({
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: [], // buyer confirms or auto-release handles delivery
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
            ? `Item marked as shipped. 10-day buyer review period started.`
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
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Order Details #{order._id?.slice(-8).toUpperCase()}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {/* Customer + Shipping */}
            <div className="row mb-4">
              <div className="col-md-6">
                <h6 className="fw-semibold mb-2">Customer</h6>
                <p className="mb-1">
                  <strong>Name:</strong>{" "}
                  {order.user?.fullname || order.shippingAddress?.fullName}
                </p>
                <p className="mb-1">
                  <strong>Email:</strong> {order.user?.email}
                </p>
                <p className="mb-1">
                  <strong>Phone:</strong> {order.shippingAddress?.phone}
                </p>
              </div>
              <div className="col-md-6">
                <h6 className="fw-semibold mb-2">Shipping Address</h6>
                <p className="mb-1">{order.shippingAddress?.address}</p>
                <p className="mb-1">
                  {order.shippingAddress?.city},{" "}
                  {order.shippingAddress?.postalCode}
                </p>
                <p className="mb-1">{order.shippingAddress?.country}</p>
              </div>
            </div>

            {/* Summary cards */}
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="bg-light p-3 rounded">
                  <small className="text-muted d-block">Order Date</small>
                  <strong>{fmtDate(order.createdAt)}</strong>
                </div>
              </div>
              <div className="col-md-3">
                <div className="bg-light p-3 rounded">
                  <small className="text-muted d-block">Payment Method</small>
                  <strong className="text-capitalize">
                    {order.paymentMethod}
                  </strong>
                </div>
              </div>
              <div className="col-md-3">
                <div className="bg-light p-3 rounded">
                  <small className="text-muted d-block">Payment Status</small>
                  <span
                    className={`badge bg-${paymentColor[order.paymentStatus] || "secondary"}`}
                  >
                    {paymentLabel[order.paymentStatus] || order.paymentStatus}
                  </span>
                </div>
              </div>
              <div className="col-md-3">
                <div className="bg-light p-3 rounded">
                  <small className="text-muted d-block">Your Earnings</small>
                  <strong className="text-primary">
                    {fmt(
                      sellerItems.reduce((s, i) => s + i.price * i.quantity, 0),
                    )}
                  </strong>
                </div>
              </div>
            </div>

            {/* Escrow / payment banners */}
            {order.paymentStatus === "requires_capture" && (
              <div className="alert alert-info mb-4">
                <div className="d-flex">
                  <i className="bi bi-shield-lock fs-4 me-3"></i>
                  <div>
                    <strong>Funds held in escrow</strong>
                    <p className="mb-0 small">
                      Payment of {fmt(order.totalPrice)} is securely held. Funds
                      release when the buyer confirms delivery or the 10-day
                      review window closes.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {order.paymentStatus === "captured" && (
              <div className="alert alert-success mb-4">
                <div className="d-flex">
                  <i className="bi bi-check-circle fs-4 me-3"></i>
                  <div>
                    <strong>Payment released</strong>
                    <p className="mb-0 small">
                      Funds have been transferred to your wallet.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Products table */}
            <h6 className="fw-semibold mb-3">Your products in this order</h6>
            <div className="table-responsive">
              <table className="table table-bordered align-middle mb-0">
                <thead className="table-light">
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

                    return (
                      <tr key={idx}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {item.product?.images?.[0] && (
                              <img
                                src={`${BACKEND}${item.product.images[0]}`}
                                alt={item.name}
                                style={{
                                  width: 40,
                                  height: 40,
                                  objectFit: "cover",
                                  borderRadius: 4,
                                }}
                              />
                            )}
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td>{fmt(item.price)}</td>
                        <td>{item.quantity}</td>
                        <td>{fmt(item.price * item.quantity)}</td>
                        <td>
                          <span
                            className={`badge bg-${badgeColor[item.orderStatus] || "secondary"}`}
                          >
                            {item.orderStatus}
                          </span>
                          {/* Dispute badge */}
                          <DisputeBadge
                            item={item}
                            onRespond={() => onOpenDispute(order, item)}
                          />
                          {/* Auto-release countdown — visible after shipping */}
                          {item.orderStatus === "shipped" &&
                            item.autoReleaseAt && (
                              <AutoReleaseCountdown
                                autoReleaseAt={item.autoReleaseAt}
                              />
                            )}
                        </td>
                        <td>
                          {/* Block status changes while a dispute is open */}
                          {hasOpenDispute ? (
                            <small className="text-warning">
                              <i className="bi bi-lock me-1"></i>
                              Dispute pending
                            </small>
                          ) : (
                            <div className="d-flex gap-1 flex-wrap">
                              {nexts.map((status) => (
                                <button
                                  key={status}
                                  className={`btn btn-sm ${
                                    status === "cancelled"
                                      ? "btn-outline-danger"
                                      : status === "shipped"
                                        ? "btn-primary"
                                        : `btn-${badgeColor[status] || "secondary"}`
                                  }`}
                                  onClick={() =>
                                    handleStatusUpdate(productId, status)
                                  }
                                  disabled={updatingStatus}
                                  title={
                                    status === "shipped"
                                      ? "Marking as shipped starts the 10-day buyer review period"
                                      : undefined
                                  }
                                >
                                  {status === "cancelled" ? (
                                    <>
                                      <i className="bi bi-x-circle me-1"></i>
                                      Cancel & refund
                                    </>
                                  ) : status === "shipped" ? (
                                    <>
                                      <i className="bi bi-truck me-1"></i>Mark
                                      shipped
                                    </>
                                  ) : (
                                    status
                                  )}
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

                          {/* Terminal state labels */}
                          {item.orderStatus === "cancelled" && (
                            <small className="text-success d-block mt-1">
                              <i className="bi bi-arrow-repeat me-1"></i>
                              Refunded to buyer
                            </small>
                          )}
                          {item.orderStatus === "delivered" && (
                            <small className="text-info d-block mt-1">
                              <i className="bi bi-check-circle me-1"></i>
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

            {/* Order totals */}
            <div className="row justify-content-end mt-4">
              <div className="col-md-4">
                <div className="bg-light p-3 rounded">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <strong>{fmt(order.itemsPrice)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Shipping:</span>
                    <strong>{fmt(order.shippingPrice)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tax:</span>
                    <strong>{fmt(order.taxPrice)}</strong>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <span className="fw-bold">Total:</span>
                    <span className="fw-bold text-primary">
                      {fmt(order.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main SellerOrders page
// ─────────────────────────────────────────────
const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [disputeOrder, setDisputeOrder] = useState(null);
  const [disputeItem, setDisputeItem] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  // Filters
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
    // Close details modal first so both don't stack awkwardly
    setShowDetailsModal(false);
    setDisputeOrder(order);
    setDisputeItem(item);
    setShowDisputeModal(true);
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const fmt = (v) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(v);
  const fmtDate = (d) => new Date(d).toLocaleDateString();

  const badgeColor = {
    pending: "warning",
    confirmed: "info",
    processing: "primary",
    shipped: "primary",
    delivered: "success",
    cancelled: "danger",
    disputed: "danger",
  };
  const paymentLabel = {
    pending: "Pending",
    requires_payment_method: "Failed",
    requires_capture: "Escrow",
    partial_captured: "Part. Released",
    captured: "Released",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
    partial_refunded: "Part. Refund",
  };
  const paymentColor = {
    pending: "warning",
    requires_payment_method: "danger",
    requires_capture: "info",
    partial_captured: "info",
    captured: "success",
    paid: "success",
    failed: "danger",
    refunded: "secondary",
    partial_refunded: "warning",
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
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

  // ── Filtering ─────────────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid py-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Details modal */}
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

      {/* Dispute modal */}
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

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-2">Orders Management</h1>
          <p className="text-muted mb-0">
            Manage and track your customer orders
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-4 mb-4">
        <div className="col-md-2">
          <div className="card border-0 shadow-sm bg-primary bg-opacity-10">
            <div className="card-body py-3">
              <h6 className="text-muted mb-1 small">Total</h6>
              <h3 className="fw-bold mb-0">{stats.total}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 shadow-sm bg-warning bg-opacity-10">
            <div className="card-body py-3">
              <h6 className="text-muted mb-1 small">Pending</h6>
              <h3 className="fw-bold mb-0">{stats.pending}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 shadow-sm bg-primary bg-opacity-10">
            <div className="card-body py-3">
              <h6 className="text-muted mb-1 small">Shipped</h6>
              <h3 className="fw-bold mb-0">{stats.shipped}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 shadow-sm bg-danger bg-opacity-10">
            <div className="card-body py-3">
              <h6 className="text-muted mb-1 small">Disputes</h6>
              <h3 className="fw-bold mb-0 text-danger">{stats.disputes}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 shadow-sm bg-info bg-opacity-10">
            <div className="card-body py-3">
              <h6 className="text-muted mb-1 small">In Escrow</h6>
              <h3 className="fw-bold mb-0">{stats.inEscrow}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 shadow-sm bg-success bg-opacity-10">
            <div className="card-body py-3">
              <h6 className="text-muted mb-1 small">Revenue</h6>
              <h3 className="fw-bold mb-0" style={{ fontSize: "1.2rem" }}>
                {fmt(stats.revenue)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search order ID, customer, product…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
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
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">All Payments</option>
            <option value="requires_capture">In Escrow</option>
            <option value="partial_captured">Part. Released</option>
            <option value="captured">Released</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
        <div className="col-md-2">
          <button
            className="btn btn-outline-secondary w-100"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setPaymentFilter("all");
              setDateFilter("all");
            }}
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status" />
          <h5 className="text-muted">Loading orders…</h5>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-3">
          <i className="bi bi-box-seam display-1 text-muted"></i>
          <h5 className="mt-3 text-muted">No orders found</h5>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
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

                  return (
                    <tr
                      key={order._id}
                      className={hasOpenDispute ? "table-warning" : ""}
                    >
                      <td>
                        <Link
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedOrder(order);
                            setShowDetailsModal(true);
                          }}
                          className="text-decoration-none fw-semibold"
                        >
                          #{order._id.slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td>
                        {order.user?.fullname ||
                          order.shippingAddress?.fullName}
                      </td>
                      <td>{fmtDate(order.createdAt)}</td>
                      <td>
                        <div className="small">
                          {sellerItems.length} item(s)
                        </div>
                        <small className="text-muted">
                          {sellerItems
                            .map((i) => i.name)
                            .join(", ")
                            .substring(0, 30)}
                          …
                        </small>
                        {hasOpenDispute && (
                          <span className="badge bg-warning text-dark d-block mt-1">
                            <i className="bi bi-exclamation-triangle-fill me-1"></i>
                            Refund requested
                          </span>
                        )}
                        {/* Show nearest auto-release in table */}
                        {hasShipped &&
                          (() => {
                            const soonest = sellerItems
                              .filter(
                                (i) =>
                                  i.orderStatus === "shipped" &&
                                  i.autoReleaseAt,
                              )
                              .sort(
                                (a, b) =>
                                  new Date(a.autoReleaseAt) -
                                  new Date(b.autoReleaseAt),
                              )[0];
                            return soonest ? (
                              <AutoReleaseCountdown
                                autoReleaseAt={soonest.autoReleaseAt}
                              />
                            ) : null;
                          })()}
                      </td>
                      <td className="fw-bold text-primary">
                        {fmt(sellerTotal)}
                      </td>
                      <td>
                        {statuses.map((s, i) => (
                          <span
                            key={i}
                            className={`badge bg-${badgeColor[s] || "secondary"} me-1`}
                          >
                            {s}
                          </span>
                        ))}
                      </td>
                      <td>
                        <span
                          className={`badge bg-${paymentColor[order.paymentStatus] || "secondary"}`}
                        >
                          {paymentLabel[order.paymentStatus] ||
                            order.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetailsModal(true);
                            }}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {/* Quick respond button if there's an open dispute */}
                          {hasOpenDispute &&
                            (() => {
                              const disputedItem = sellerItems.find(
                                (i) => i.disputeStatus === "open",
                              );
                              return disputedItem ? (
                                <button
                                  className="btn btn-sm btn-warning"
                                  onClick={() =>
                                    openDispute(order, disputedItem)
                                  }
                                  title="Respond to refund request"
                                >
                                  <i className="bi bi-reply"></i>
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
  );
};

export default SellerOrders;
