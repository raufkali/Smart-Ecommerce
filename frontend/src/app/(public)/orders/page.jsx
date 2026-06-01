"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─────────────────────────────────────────────
// Toast Component
// ─────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
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
    warning: "bg-warning text-dark",
    info: "bg-info text-dark",
  };

  return (
    <div
      className={`${colors[type] || "bg-primary"} text-white`}
      role="alert"
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        minWidth: 320,
        maxWidth: 450,
        padding: "1rem 1.25rem",
        borderRadius: "0.5rem",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        zIndex: 9999,
        animation: "slideIn 0.3s ease forwards",
      }}
    >
      <i className={`bi ${icons[type] || "bi-bell-fill"} me-2 fs-5`}></i>
      <span className="flex-grow-1">{message}</span>
      <button
        type="button"
        className="btn-close btn-close-white ms-3"
        onClick={onClose}
      ></button>
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
// Status Badge Component
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const configs = {
    // Order statuses
    pending: {
      color: "bg-warning text-dark",
      icon: "bi-hourglass-split",
      label: "Pending",
    },
    accepted: {
      color: "bg-info text-dark",
      icon: "bi-check2-circle",
      label: "Accepted",
    },
    processing: { color: "bg-primary", icon: "bi-gear", label: "Processing" },
    shipped: { color: "bg-primary", icon: "bi-truck", label: "Shipped" },
    out_for_delivery: {
      color: "bg-info",
      icon: "bi-bicycle",
      label: "Out for Delivery",
    },
    delivered: {
      color: "bg-success",
      icon: "bi-check-circle",
      label: "Delivered",
    },
    cancelled: { color: "bg-danger", icon: "bi-x-circle", label: "Cancelled" },
    refunded: {
      color: "bg-secondary",
      icon: "bi-arrow-repeat",
      label: "Refunded",
    },
    disputed: {
      color: "bg-danger",
      icon: "bi-exclamation-triangle",
      label: "Disputed",
    },
    // Payment statuses
    requires_capture: {
      color: "bg-info text-dark",
      icon: "bi-shield-lock",
      label: "In Escrow",
    },
    partial_captured: {
      color: "bg-info text-dark",
      icon: "bi-shield-lock",
      label: "Partial Released",
    },
    captured: { color: "bg-success", icon: "bi-cash-stack", label: "Released" },
    partial_refunded: {
      color: "bg-warning text-dark",
      icon: "bi-arrow-repeat",
      label: "Partial Refund",
    },
    refunded_payment: {
      color: "bg-secondary",
      icon: "bi-arrow-repeat",
      label: "Refunded",
    },
    failed: {
      color: "bg-danger",
      icon: "bi-exclamation-triangle",
      label: "Failed",
    },
    // Dispute statuses
    open: {
      color: "bg-warning text-dark",
      icon: "bi-hourglass-split",
      label: "Dispute Open",
    },
    approved: {
      color: "bg-success",
      icon: "bi-check-circle",
      label: "Approved",
    },
    rejected: { color: "bg-danger", icon: "bi-x-circle", label: "Rejected" },
  };

  const c = configs[status] || {
    color: "bg-secondary",
    icon: "bi-question-circle",
    label: status,
  };
  return (
    <span
      className={`badge ${c.color} px-2 py-1 d-inline-flex align-items-center gap-1`}
    >
      <i className={`bi ${c.icon}`}></i>
      {c.label}
    </span>
  );
};

// ─────────────────────────────────────────────
// Tracking Timeline Component
// ─────────────────────────────────────────────
const OrderTimeline = ({ item }) => {
  const steps = [
    { key: "pending", label: "Order Placed", icon: "bi-receipt" },
    { key: "accepted", label: "Accepted", icon: "bi-check2-circle" },
    { key: "processing", label: "Processing", icon: "bi-gear" },
    { key: "shipped", label: "Shipped", icon: "bi-truck" },
    { key: "out_for_delivery", label: "Out for Delivery", icon: "bi-bicycle" },
    { key: "delivered", label: "Delivered", icon: "bi-check-circle" },
  ];

  const cancelSteps = [
    { key: "cancelled", label: "Cancelled", icon: "bi-x-circle" },
    { key: "refunded", label: "Refunded", icon: "bi-arrow-repeat" },
  ];

  const isCancelled =
    item.orderStatus === "cancelled" || item.orderStatus === "refunded";
  const activeSteps = isCancelled ? cancelSteps : steps;

  return (
    <div
      className="d-flex align-items-center gap-1"
      style={{ fontSize: "0.75rem" }}
    >
      {activeSteps.map((step, idx) => {
        const isActive = item.orderStatus === step.key;
        const isCompleted =
          !isCancelled &&
          steps.findIndex((s) => s.key === item.orderStatus) >=
            steps.findIndex((s) => s.key === step.key);

        return (
          <React.Fragment key={step.key}>
            {idx > 0 && (
              <div
                className="flex-grow-1"
                style={{
                  height: 2,
                  backgroundColor:
                    isActive || isCompleted ? "#198754" : "#dee2e6",
                  minWidth: 20,
                }}
              />
            )}
            <div className="text-center" title={step.label}>
              <i
                className={`bi ${step.icon} ${isActive || isCompleted ? "text-success" : "text-muted"}`}
                style={{ fontSize: "1rem" }}
              ></i>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
// Helper: Determine what actions are available for an item
// ─────────────────────────────────────────────
const getItemActions = (item, orderPaymentStatus) => {
  const status = item.orderStatus;
  const disputeStatus = item.disputeStatus;
  const escrowStatus = item.escrowStatus;

  // Already cancelled or refunded - no actions
  if (status === "cancelled" || status === "refunded") {
    return {
      canConfirm: false,
      canCancel: false,
      canDispute: false,
      label: "Finalized",
    };
  }

  // Dispute is open - waiting for seller/admin
  if (disputeStatus === "open" || disputeStatus === "approved") {
    return {
      canConfirm: false,
      canCancel: false,
      canDispute: false,
      label: "Dispute Pending",
    };
  }

  // Can confirm delivery (only after it's been shipped)
  const canConfirm =
    ["shipped", "out_for_delivery"].includes(status) && escrowStatus === "held";

  // Can cancel/request refund (before delivery, funds in escrow)
  const canCancel =
    ["pending", "accepted", "processing"].includes(status) &&
    escrowStatus === "held";

  // Can open dispute (for shipped items or if seller hasn't responded)
  const canDispute =
    !canConfirm &&
    !canCancel &&
    status !== "delivered" &&
    disputeStatus !== "rejected";

  if (canConfirm)
    return {
      canConfirm: true,
      canCancel: false,
      canDispute: false,
      label: "Ready to Confirm",
    };
  if (canCancel)
    return {
      canConfirm: false,
      canCancel: true,
      canDispute: false,
      label: "Can Cancel",
    };
  if (status === "delivered")
    return {
      canConfirm: false,
      canCancel: false,
      canDispute: false,
      label: "Completed",
    };

  return {
    canConfirm: false,
    canCancel: false,
    canDispute: true,
    label: "In Progress",
  };
};

// ─────────────────────────────────────────────
// Confirm Delivery Modal
// ─────────────────────────────────────────────
const ConfirmDeliveryModal = ({ isOpen, order, item, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order || !item) return null;

  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n || 0);
  const totalAmount = item.price * item.quantity + (item.shippingFee || 0);
  const sellerAmount = totalAmount * 0.9;
  const platformFee = totalAmount * 0.1;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
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
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">
              <i className="bi bi-check-circle-fill me-2"></i>Confirm Delivery
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="text-center mb-3">
              <i className="bi bi-box-seam display-1 text-success"></i>
            </div>

            <div className="alert alert-success">
              <h6 className="alert-heading">{item.name}</h6>
              <hr />
              <div className="d-flex justify-content-between">
                <span>Item Total:</span>
                <strong>{fmt(totalAmount)}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Platform Fee (10%):</span>
                <span className="text-muted">-{fmt(platformFee)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Released to Seller:</span>
                <strong className="text-success">{fmt(sellerAmount)}</strong>
              </div>
            </div>

            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Important:</strong> Confirming delivery will release the
              payment from escrow to the seller. This action cannot be undone.
              Only confirm if you have received the item and are satisfied with
              it.
            </div>

            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="confirmCheck"
              />
              <label className="form-check-label" htmlFor="confirmCheck">
                I confirm that I have received this item in good condition
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn btn-success"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Processing...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-1"></i>Confirm Delivery &
                  Release Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Cancel / Dispute Item Modal
// ─────────────────────────────────────────────
const CancelItemModal = ({ isOpen, order, item, mode, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order || !item) return null;

  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n || 0);
  const totalAmount = item.price * item.quantity + (item.shippingFee || 0);
  const isDispute = mode === "dispute";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) return;
    setLoading(true);
    await onConfirm(reason);
    setLoading(false);
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
          <div
            className={`modal-header ${isDispute ? "bg-warning" : "bg-danger"} text-white`}
          >
            <h5 className="modal-title">
              <i
                className={`bi ${isDispute ? "bi-exclamation-triangle-fill" : "bi-x-circle-fill"} me-2`}
              ></i>
              {isDispute ? "Request Refund / Open Dispute" : "Cancel Item"}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-info">
                <strong>Product:</strong> {item.name}
                <br />
                <strong>Amount:</strong> {fmt(totalAmount)}
                <br />
                <strong>Current Status:</strong> {item.orderStatus}
              </div>

              {isDispute ? (
                <div className="alert alert-warning">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  <strong>How it works:</strong>
                  <ol className="mb-0 mt-2 small">
                    <li>Submit your refund request with a reason</li>
                    <li>Seller has 48 hours to respond</li>
                    <li>If seller approves, you'll be refunded</li>
                    <li>If seller rejects, an admin will review</li>
                    <li>Funds remain in escrow during the dispute</li>
                  </ol>
                </div>
              ) : (
                <div className="alert alert-warning">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  <strong>Note:</strong> Cancelling this item will immediately
                  refund
                  {fmt(totalAmount)} to your original payment method since funds
                  are still in escrow.
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Reason <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    isDispute
                      ? "Describe the issue with this item in detail (min 5 characters)..."
                      : "Why are you cancelling this item? (min 5 characters)..."
                  }
                  required
                  minLength={5}
                />
                <small className="text-muted">
                  {reason.length}/5 characters minimum
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                className={`btn ${isDispute ? "btn-warning" : "btn-danger"}`}
                disabled={loading || reason.trim().length < 5}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i
                      className={`bi ${isDispute ? "bi-send" : "bi-trash3"} me-1`}
                    ></i>
                    {isDispute
                      ? "Submit Refund Request"
                      : "Cancel Item & Refund"}
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
// ─────────────────────────────────────────────
const OrderDetailsModal = ({
  isOpen,
  order,
  onClose,
  onConfirmDelivery,
  onCancelItem,
  onDisputeItem,
}) => {
  if (!isOpen || !order) return null;

  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n || 0);

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-receipt me-2 text-primary"></i>
              Order #{order._id?.slice(-8).toUpperCase()}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {/* Status Cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="bg-light p-3 rounded">
                  <small className="text-muted d-block">Order Status</small>
                  <StatusBadge status={order.orderStatus} />
                </div>
              </div>
              <div className="col-md-4">
                <div className="bg-light p-3 rounded">
                  <small className="text-muted d-block">Payment</small>
                  <StatusBadge status={order.paymentStatus} />
                </div>
              </div>
              <div className="col-md-4">
                <div className="bg-light p-3 rounded">
                  <small className="text-muted d-block">Date</small>
                  <strong>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </strong>
                </div>
              </div>
            </div>

            {/* Escrow Info */}
            {order.paymentStatus === "requires_capture" && (
              <div className="alert alert-info mb-4">
                <i className="bi bi-shield-lock fs-5 me-2"></i>
                <strong>Funds Held in Escrow</strong>
                <p className="mb-0 small">
                  Your payment of {fmt(order.totalPrice)} is securely held.
                  Funds will be released per item when you confirm delivery.
                </p>
              </div>
            )}

            {/* Shipping */}
            <h6 className="fw-semibold mb-2">Shipping Address</h6>
            <div className="bg-light p-3 rounded mb-4">
              <p className="mb-0 fw-semibold">
                {order.shippingAddress?.fullName}
              </p>
              <p className="mb-0">{order.shippingAddress?.address}</p>
              <p className="mb-0">
                {order.shippingAddress?.city},{" "}
                {order.shippingAddress?.postalCode}
              </p>
              <p className="mb-0">
                {order.shippingAddress?.country} ·{" "}
                {order.shippingAddress?.phone}
              </p>
            </div>

            {/* Items Table */}
            <h6 className="fw-semibold mb-3">Order Items</h6>
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
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
                  {order.orderItems?.map((item, idx) => {
                    const totalAmount =
                      item.price * item.quantity + (item.shippingFee || 0);
                    const actions = getItemActions(item, order.paymentStatus);

                    return (
                      <tr key={idx}>
                        <td>
                          <div>
                            <div className="fw-semibold">{item.name}</div>
                            <small className="text-muted">
                              Seller: {item.seller?.fullname || "Store"}
                            </small>
                            <div className="mt-1">
                              <OrderTimeline item={item} />
                            </div>
                          </div>
                        </td>
                        <td>{fmt(item.price)}</td>
                        <td>{item.quantity}</td>
                        <td className="fw-semibold">{fmt(totalAmount)}</td>
                        <td>
                          <StatusBadge status={item.orderStatus} />
                          {item.disputeStatus &&
                            item.disputeStatus !== "none" && (
                              <div className="mt-1">
                                <StatusBadge status={item.disputeStatus} />
                              </div>
                            )}
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            {actions.canConfirm && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => onConfirmDelivery(order, item)}
                              >
                                <i className="bi bi-check-circle me-1"></i>
                                Confirm Delivery
                              </button>
                            )}
                            {actions.canCancel && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => onCancelItem(order, item)}
                              >
                                <i className="bi bi-x-circle me-1"></i>Cancel
                                Item
                              </button>
                            )}
                            {actions.canDispute && (
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => onDisputeItem(order, item)}
                              >
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                Request Refund
                              </button>
                            )}
                            {!actions.canConfirm &&
                              !actions.canCancel &&
                              !actions.canDispute && (
                                <span className="badge bg-light text-dark">
                                  {actions.label}
                                </span>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Order Summary */}
            <div className="row justify-content-end mt-3">
              <div className="col-md-5">
                <div className="bg-light p-3 rounded">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Subtotal:</span>
                    <strong>{fmt(order.itemsPrice)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Shipping:</span>
                    <strong>{fmt(order.shippingPrice)}</strong>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <span className="fw-bold">Total:</span>
                    <span className="fw-bold text-primary fs-5">
                      {fmt(order.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Order Card Component
// ─────────────────────────────────────────────
const OrderCard = ({
  order,
  onViewDetails,
  onConfirmDelivery,
  onCancelItem,
  onDisputeItem,
}) => {
  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n || 0);

  // Count actionable items
  const actionableItems =
    order.orderItems?.filter((item) => {
      const actions = getItemActions(item, order.paymentStatus);
      return actions.canConfirm || actions.canCancel || actions.canDispute;
    }).length || 0;

  const disputeItems =
    order.orderItems?.filter((item) => item.disputeStatus === "open").length ||
    0;

  return (
    <div
      className="card shadow-sm mb-4"
      style={{ transition: "all 0.3s ease" }}
    >
      <div className="card-body">
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 pb-2 border-bottom">
          <div>
            <h6 className="text-muted mb-1">
              <i className="bi bi-receipt me-2"></i>
              Order #{order._id?.slice(-8).toUpperCase()}
            </h6>
            <small className="text-muted">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </small>
          </div>
          <div className="d-flex gap-2">
            <StatusBadge status={order.orderStatus} />
            <StatusBadge status={order.paymentStatus} />
          </div>
        </div>

        {/* Item Summary */}
        <div className="mb-3">
          {order.orderItems?.slice(0, 3).map((item, idx) => (
            <div
              key={idx}
              className="d-flex justify-content-between align-items-center py-1"
            >
              <div className="d-flex align-items-center">
                <StatusBadge status={item.orderStatus} />
                <span className="ms-2">{item.name}</span>
                <small className="text-muted ms-2">×{item.quantity}</small>
              </div>
              <span className="fw-semibold">
                {fmt(item.price * item.quantity + (item.shippingFee || 0))}
              </span>
            </div>
          ))}
          {order.orderItems?.length > 3 && (
            <small className="text-muted">
              +{order.orderItems.length - 3} more items
            </small>
          )}
        </div>

        {/* Alerts */}
        {disputeItems > 0 && (
          <div className="alert alert-warning py-2 px-3 mb-2 small">
            <i className="bi bi-exclamation-triangle-fill me-1"></i>
            {disputeItems} item(s) have open disputes
          </div>
        )}
        {actionableItems > 0 && (
          <div className="alert alert-info py-2 px-3 mb-2 small">
            <i className="bi bi-info-circle-fill me-1"></i>
            {actionableItems} item(s) require your attention
          </div>
        )}

        {/* Footer */}
        <div className="d-flex justify-content-between align-items-center pt-2 border-top">
          <small className="text-muted">
            {order.shippingAddress?.city}, {order.shippingAddress?.country}
          </small>
          <div>
            <span className="text-muted me-2">Total:</span>
            <span className="fw-bold text-primary fs-5">
              {fmt(order.totalPrice)}
            </span>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-2">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => onViewDetails(order)}
          >
            <i className="bi bi-eye me-1"></i>View Details & Actions
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Client Orders Page
// ─────────────────────────────────────────────
const ClientOrders = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal state - unified management
  const [modal, setModal] = useState({
    type: null, // 'details', 'confirm', 'cancel', 'dispute'
    order: null,
    item: null,
    isOpen: false,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const closeAllModals = useCallback(() => {
    setModal({ type: null, order: null, item: null, isOpen: false });
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/my-orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Modal Openers ──────────────────────────
  const openDetails = (order) => {
    setModal({ type: "details", order, item: null, isOpen: true });
  };

  const openConfirmDelivery = (order, item) => {
    setModal({ type: "confirm", order, item, isOpen: true });
  };

  const openCancelItem = (order, item) => {
    setModal({ type: "cancel", order, item, isOpen: true });
  };

  const openDisputeItem = (order, item) => {
    setModal({ type: "dispute", order, item, isOpen: true });
  };

  // ── API Handlers ───────────────────────────
  const handleConfirmDelivery = async () => {
    const { order, item } = modal;
    const productId = item.product?._id || item.product;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/payment/confirm-delivery/${order._id}/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to confirm delivery");

      showToast(
        data.message || "Delivery confirmed! Payment released to seller.",
        "success",
      );
      closeAllModals();
      await fetchOrders();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleCancelItem = async (reason) => {
    const { order, item } = modal;
    const productId = item.product?._id || item.product;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/payment/refund-product/${order._id}/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel item");

      showToast(
        data.message || "Item cancelled. Refund will be processed.",
        "success",
      );
      closeAllModals();
      await fetchOrders();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleDisputeItem = async (reason) => {
    const { order, item } = modal;
    const productId = item.product?._id || item.product;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/payment/refund-product/${order._id}/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        },
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to submit refund request");

      showToast(
        data.message ||
          "Refund request submitted. Seller has 48 hours to respond.",
        "info",
      );
      closeAllModals();
      await fetchOrders();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  // ── Filtering ──────────────────────────────
  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      !searchTerm ||
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderItems?.some((i) =>
        i.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchStatus =
      statusFilter === "all" || order.orderStatus === statusFilter;
    const matchPayment =
      paymentFilter === "all" || order.paymentStatus === paymentFilter;

    return matchSearch && matchStatus && matchPayment;
  });

  // ── Stats ──────────────────────────────────
  const stats = {
    total: orders.length,
    inEscrow: orders.filter((o) => o.paymentStatus === "requires_capture")
      .length,
    needAction: orders.filter((o) =>
      o.orderItems?.some((item) => {
        const actions = getItemActions(item, o.paymentStatus);
        return actions.canConfirm || actions.canCancel || actions.canDispute;
      }),
    ).length,
    disputes: orders.filter((o) =>
      o.orderItems?.some((item) => item.disputeStatus === "open"),
    ).length,
    delivered: orders.filter((o) => o.orderStatus === "delivered").length,
    totalSpent: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <h5 className="text-muted">Loading your orders...</h5>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modals - Controlled by unified state */}
      <OrderDetailsModal
        isOpen={modal.type === "details" && modal.isOpen}
        order={modal.order}
        onClose={closeAllModals}
        onConfirmDelivery={openConfirmDelivery}
        onCancelItem={openCancelItem}
        onDisputeItem={openDisputeItem}
      />

      <ConfirmDeliveryModal
        isOpen={modal.type === "confirm" && modal.isOpen}
        order={modal.order}
        item={modal.item}
        onClose={closeAllModals}
        onConfirm={handleConfirmDelivery}
      />

      <CancelItemModal
        isOpen={
          (modal.type === "cancel" || modal.type === "dispute") && modal.isOpen
        }
        order={modal.order}
        item={modal.item}
        mode={modal.type}
        onClose={closeAllModals}
        onConfirm={
          modal.type === "cancel" ? handleCancelItem : handleDisputeItem
        }
      />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">
            <i className="bi bi-box-seam me-2 text-primary"></i>My Orders
          </h1>
          <p className="text-muted mb-0">
            Track, manage, and confirm your orders
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {[
          {
            title: "Total Orders",
            value: stats.total,
            icon: "bi-receipt",
            color: "primary",
          },
          {
            title: "In Escrow",
            value: stats.inEscrow,
            icon: "bi-shield-lock",
            color: "info",
          },
          {
            title: "Needs Action",
            value: stats.needAction,
            icon: "bi-exclamation-triangle",
            color: "warning",
          },
          {
            title: "Disputes",
            value: stats.disputes,
            icon: "bi-flag",
            color: "danger",
          },
          {
            title: "Delivered",
            value: stats.delivered,
            icon: "bi-check-circle",
            color: "success",
          },
          {
            title: "Total Spent",
            value: `$${stats.totalSpent.toFixed(2)}`,
            icon: "bi-cash-stack",
            color: "dark",
          },
        ].map((s) => (
          <div key={s.title} className="col-md-2 col-6">
            <div
              className={`card border-0 shadow-sm bg-${s.color} bg-opacity-10 h-100`}
            >
              <div className="card-body text-center py-3">
                <i className={`bi ${s.icon} fs-3 text-${s.color}`}></i>
                <h5 className="fw-bold mt-2 mb-0">{s.value}</h5>
                <small className="text-muted">{s.title}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-5">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by order ID or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
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
            <option value="partial_captured">Partial Released</option>
            <option value="captured">Released</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div className="col-md-2">
          <button
            className="btn btn-outline-secondary w-100"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setPaymentFilter("all");
            }}
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-3">
          <i className="bi bi-inbox display-1 text-muted"></i>
          <h4 className="mt-3 text-muted">No orders found</h4>
          <p className="text-muted">
            {orders.length === 0
              ? "You haven't placed any orders yet."
              : "Try adjusting your filters"}
          </p>
          {orders.length === 0 && (
            <Link href="/products" className="btn btn-primary mt-2">
              <i className="bi bi-shop me-2"></i>Start Shopping
            </Link>
          )}
        </div>
      ) : (
        filteredOrders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            onViewDetails={openDetails}
            onConfirmDelivery={openConfirmDelivery}
            onCancelItem={openCancelItem}
            onDisputeItem={openDisputeItem}
          />
        ))
      )}
    </div>
  );
};

export default ClientOrders;
