"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./ClientOrders.css";

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

  return (
    <div className={`toast-notification toast-${type}`} role="alert">
      <i className={`bi ${icons[type] || "bi-bell-fill"} toast-icon`}></i>
      <span className="toast-message">{message}</span>
      <button type="button" className="toast-close-btn" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// Status Badge Component
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        class: "badge-status pending",
        icon: "bi-hourglass-split",
        label: "Pending",
      },
      accepted: {
        class: "badge-status accepted",
        icon: "bi-check2-circle",
        label: "Accepted",
      },
      processing: {
        class: "badge-status processing",
        icon: "bi-gear",
        label: "Processing",
      },
      shipped: {
        class: "badge-status shipped",
        icon: "bi-truck",
        label: "Shipped",
      },
      out_for_delivery: {
        class: "badge-status out-for-delivery",
        icon: "bi-bicycle",
        label: "Out for Delivery",
      },
      delivered: {
        class: "badge-status delivered",
        icon: "bi-check-circle",
        label: "Delivered",
      },
      cancelled: {
        class: "badge-status cancelled",
        icon: "bi-x-circle",
        label: "Cancelled",
      },
      refunded: {
        class: "badge-status refunded",
        icon: "bi-arrow-repeat",
        label: "Refunded",
      },
      disputed: {
        class: "badge-status disputed",
        icon: "bi-exclamation-triangle",
        label: "Disputed",
      },
      requires_capture: {
        class: "badge-status escrow",
        icon: "bi-shield-lock",
        label: "In Escrow",
      },
      partial_captured: {
        class: "badge-status partial-captured",
        icon: "bi-shield-lock",
        label: "Partial Released",
      },
      captured: {
        class: "badge-status captured",
        icon: "bi-cash-stack",
        label: "Released",
      },
      partial_refunded: {
        class: "badge-status partial-refunded",
        icon: "bi-arrow-repeat",
        label: "Partial Refund",
      },
      refunded_payment: {
        class: "badge-status refunded-payment",
        icon: "bi-arrow-repeat",
        label: "Refunded",
      },
      failed: {
        class: "badge-status failed",
        icon: "bi-exclamation-triangle",
        label: "Failed",
      },
      open: {
        class: "badge-status dispute-open",
        icon: "bi-hourglass-split",
        label: "Dispute Open",
      },
      approved: {
        class: "badge-status dispute-approved",
        icon: "bi-check-circle",
        label: "Approved",
      },
      rejected: {
        class: "badge-status dispute-rejected",
        icon: "bi-x-circle",
        label: "Rejected",
      },
      // Admin resolution statuses
      resolved_refund: {
        class: "badge-status resolved-refund",
        icon: "bi-gavel",
        label: "Admin Refunded",
      },
      resolved_release: {
        class: "badge-status resolved-release",
        icon: "bi-gavel",
        label: "Admin Released",
      },
    };
    return (
      configs[status] || {
        class: "badge-status default",
        icon: "bi-question-circle",
        label: status,
      }
    );
  };

  const config = getStatusConfig(status);
  return (
    <span className={config.class}>
      <i className={`bi ${config.icon}`}></i>
      {config.label}
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
    { key: "delivered", label: "Delivered", icon: "bi-check-circle" },
  ];

  const cancelSteps = [
    { key: "cancelled", label: "Cancelled", icon: "bi-x-circle" },
    { key: "refunded", label: "Refunded", icon: "bi-arrow-repeat" },
  ];

  const isCancelled =
    item.orderStatus === "cancelled" || item.orderStatus === "refunded";
  const activeSteps = isCancelled ? cancelSteps : steps;
  const currentIndex = steps.findIndex((s) => s.key === item.orderStatus);

  return (
    <div className="order-timeline">
      {activeSteps.map((step, idx) => {
        const isActive = item.orderStatus === step.key;
        const isCompleted =
          !isCancelled &&
          currentIndex >= steps.findIndex((s) => s.key === step.key);

        return (
          <React.Fragment key={step.key}>
            {idx > 0 && (
              <div
                className={`timeline-line ${isActive || isCompleted ? "completed" : ""}`}
              />
            )}
            <div className="timeline-step" title={step.label}>
              <div
                className={`timeline-icon ${isActive || isCompleted ? "active" : ""}`}
              >
                <i className={`bi ${step.icon}`}></i>
              </div>
              <span className="timeline-label">{step.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
// Star Rating Component
// ─────────────────────────────────────────────
const StarRating = ({ value, onChange, readonly = false, size = "md" }) => {
  const [hovered, setHovered] = useState(0);

  const sizeClass =
    { sm: "stars-sm", md: "stars-md", lg: "stars-lg" }[size] || "stars-md";

  return (
    <div
      className={`star-rating ${sizeClass} ${readonly ? "star-readonly" : ""}`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= (hovered || value) ? "star-filled" : "star-empty"}`}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          disabled={readonly}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <i
            className={`bi ${star <= (hovered || value) ? "bi-star-fill" : "bi-star"}`}
          ></i>
        </button>
      ))}
      {!readonly && value > 0 && (
        <span className="star-label">
          {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
        </span>
      )}
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

  if (status === "cancelled" || status === "refunded") {
    return {
      canConfirm: false,
      canCancel: false,
      canDispute: false,
      label: "Finalized",
    };
  }

  // Check if dispute is being handled by admin
  if (
    disputeStatus === "open" ||
    disputeStatus === "approved" ||
    disputeStatus === "rejected"
  ) {
    return {
      canConfirm: false,
      canCancel: false,
      canDispute: false,
      label: "Dispute Pending",
    };
  }

  // Admin resolved cases - don't allow reviews or further actions
  if (
    disputeStatus === "resolved_refund" ||
    disputeStatus === "resolved_release"
  ) {
    return {
      canConfirm: false,
      canCancel: false,
      canDispute: false,
      label:
        disputeStatus === "resolved_refund"
          ? "Admin Refunded"
          : "Admin Released",
    };
  }

  const fundsInEscrow =
    escrowStatus === "held" ||
    orderPaymentStatus === "requires_capture" ||
    orderPaymentStatus === "partial_captured";

  const canConfirm =
    ["shipped", "out_for_delivery"].includes(status) && fundsInEscrow;

  const canCancel =
    ["pending", "confirmed", "accepted", "processing"].includes(status) &&
    fundsInEscrow;

  // Allow dispute for shipped items too
  const canDispute =
    !canConfirm &&
    !canCancel &&
    status !== "delivered" &&
    disputeStatus !== "rejected";

  if (canConfirm)
    return {
      canConfirm: true,
      canCancel: false,
      canDispute: true,
      label: "Ready to Confirm",
    };

  if (canCancel)
    return {
      canConfirm: false,
      canCancel: true,
      canDispute: true,
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
    canDispute,
    label: "In Progress",
  };
};

// Check if item can be reviewed (only normal delivered items, not admin-resolved)
const canReviewItem = (item) => {
  const isDelivered =
    item.orderStatus === "delivered" && item.escrowStatus === "released";

  // Don't allow review if admin handled the dispute
  const isAdminResolved =
    item.disputeStatus === "resolved_refund" ||
    item.disputeStatus === "resolved_release";

  return isDelivered && !isAdminResolved;
};

// ─────────────────────────────────────────────
// Review Modal — Fiverr-style inline review
// ─────────────────────────────────────────────
const ReviewModal = ({ isOpen, order, item, onClose, onSubmit }) => {
  const [activeTab, setActiveTab] = useState("product"); // "product" | "seller"
  const [productRating, setProductRating] = useState(0);
  const [productComment, setProductComment] = useState("");
  const [sellerRating, setSellerRating] = useState(0);
  const [sellerComment, setSellerComment] = useState("");
  const [pendingReviews, setPendingReviews] = useState(null);
  const [loadingPending, setLoadingPending] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState({ product: false, seller: false });

  // Reset state when modal opens for a new item
  useEffect(() => {
    if (isOpen && order && item) {
      setActiveTab("product");
      setProductRating(0);
      setProductComment("");
      setSellerRating(0);
      setSellerComment("");
      setSubmitted({ product: false, seller: false });
      fetchPending();
    }
  }, [isOpen, order?._id, item?._id]);

  const fetchPending = async () => {
    if (!order || !item) return;
    setLoadingPending(true);
    try {
      const token = localStorage.getItem("token");
      const productId = item.product?._id || item.product;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reviews/pending/${order._id}/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (data.success) {
        setPendingReviews(data.reviews);
        // Mark already-done ones
        const productDone = data.reviews?.find(
          (r) => r.type === "product",
        )?.done;
        const sellerDone = data.reviews?.find((r) => r.type === "seller")?.done;
        setSubmitted({ product: !!productDone, seller: !!sellerDone });
        // Auto-switch to whichever tab still needs a review
        if (productDone && !sellerDone) setActiveTab("seller");
      }
    } catch (err) {
      console.error("Failed to fetch pending reviews", err);
    } finally {
      setLoadingPending(false);
    }
  };

  if (!isOpen || !order || !item) return null;

  const productId = item.product?._id || item.product;
  const sellerId = item.seller?._id || item.seller;
  const sellerName = item.seller?.fullname || "the seller";

  const handleSubmitProduct = async () => {
    if (productRating === 0) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reviews/product/${order._id}/${productId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: productRating,
            comment: productComment.trim(),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit review");
      setSubmitted((s) => ({ ...s, product: true }));
      onSubmit?.("Product review submitted!", "success");
      // Auto-switch to seller tab if not done
      if (!submitted.seller) setActiveTab("seller");
    } catch (err) {
      onSubmit?.(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSeller = async () => {
    if (sellerRating === 0) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reviews/seller/${order._id}/${productId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: sellerRating,
            comment: sellerComment.trim(),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit review");
      setSubmitted((s) => ({ ...s, seller: true }));
      onSubmit?.("Seller review submitted!", "success");
    } catch (err) {
      onSubmit?.(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const allDone = submitted.product && submitted.seller;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container modal-review"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header modal-header-review">
          <h5 className="modal-title">
            <i className="bi bi-star-fill me-2 text-gold"></i>
            Rate Your Experience
          </h5>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body review-modal-body">
          {/* Item context */}
          <div className="review-item-context">
            <div className="review-item-name">
              <i className="bi bi-box-seam me-2 text-gold"></i>
              {item.name}
            </div>
            <StatusBadge status="delivered" />
          </div>

          {/* All done state */}
          {allDone ? (
            <div className="review-all-done">
              <div className="review-done-icon">
                <i className="bi bi-patch-check-fill"></i>
              </div>
              <h5>Thank you for your reviews!</h5>
              <p>Your feedback helps the community make better decisions.</p>
              <button className="btn-success" onClick={onClose}>
                Close
              </button>
            </div>
          ) : loadingPending ? (
            <div className="review-loading">
              <div className="loading-spinner-sm"></div>
              <span>Loading review status...</span>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="review-tabs">
                <button
                  className={`review-tab ${activeTab === "product" ? "active" : ""} ${submitted.product ? "tab-done" : ""}`}
                  onClick={() => setActiveTab("product")}
                >
                  {submitted.product ? (
                    <i className="bi bi-check-circle-fill me-1 text-success"></i>
                  ) : (
                    <i className="bi bi-box-seam me-1"></i>
                  )}
                  Rate Product
                </button>
                <button
                  className={`review-tab ${activeTab === "seller" ? "active" : ""} ${submitted.seller ? "tab-done" : ""}`}
                  onClick={() => setActiveTab("seller")}
                >
                  {submitted.seller ? (
                    <i className="bi bi-check-circle-fill me-1 text-success"></i>
                  ) : (
                    <i className="bi bi-person-badge me-1"></i>
                  )}
                  Rate Seller
                </button>
              </div>

              {/* Product Review Tab */}
              {activeTab === "product" && (
                <div className="review-tab-content">
                  {submitted.product ? (
                    <div className="review-submitted-state">
                      <i className="bi bi-check-circle-fill text-success"></i>
                      <p>Product review submitted!</p>
                      <button
                        className="btn-link-action"
                        onClick={() => setActiveTab("seller")}
                      >
                        Rate the seller next{" "}
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="review-question">
                        How would you rate <strong>{item.name}</strong>?
                      </div>
                      <StarRating
                        value={productRating}
                        onChange={setProductRating}
                        size="lg"
                      />
                      <div className="form-group mt-3">
                        <label>
                          Your review{" "}
                          <span className="text-muted">(optional)</span>
                        </label>
                        <textarea
                          className="form-textarea"
                          rows="3"
                          value={productComment}
                          onChange={(e) => setProductComment(e.target.value)}
                          placeholder="Share your experience with this product..."
                          maxLength={500}
                        />
                        <small className="char-count">
                          {productComment.length}/500
                        </small>
                      </div>
                      <button
                        className="btn-review-submit"
                        onClick={handleSubmitProduct}
                        disabled={productRating === 0 || submitting}
                      >
                        {submitting ? (
                          <span className="spinner"></span>
                        ) : (
                          <>
                            <i className="bi bi-send me-2"></i>
                            Submit Product Review
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Seller Review Tab */}
              {activeTab === "seller" && (
                <div className="review-tab-content">
                  {submitted.seller ? (
                    <div className="review-submitted-state">
                      <i className="bi bi-check-circle-fill text-success"></i>
                      <p>Seller review submitted!</p>
                      {!submitted.product && (
                        <button
                          className="btn-link-action"
                          onClick={() => setActiveTab("product")}
                        >
                          Rate the product too{" "}
                          <i className="bi bi-arrow-right"></i>
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="review-seller-profile">
                        <div className="seller-avatar-review">
                          <i className="bi bi-person-circle"></i>
                        </div>
                        <div>
                          <div className="seller-review-name">{sellerName}</div>
                          <div className="seller-review-label">Seller</div>
                        </div>
                      </div>
                      <div className="review-question">
                        How was your experience with{" "}
                        <strong>{sellerName}</strong>?
                      </div>
                      <StarRating
                        value={sellerRating}
                        onChange={setSellerRating}
                        size="lg"
                      />
                      <div className="form-group mt-3">
                        <label>
                          Your review{" "}
                          <span className="text-muted">(optional)</span>
                        </label>
                        <textarea
                          className="form-textarea"
                          rows="3"
                          value={sellerComment}
                          onChange={(e) => setSellerComment(e.target.value)}
                          placeholder="Communication, packaging, speed, accuracy..."
                          maxLength={500}
                        />
                        <small className="char-count">
                          {sellerComment.length}/500
                        </small>
                      </div>
                      <button
                        className="btn-review-submit"
                        onClick={handleSubmitSeller}
                        disabled={sellerRating === 0 || submitting}
                      >
                        {submitting ? (
                          <span className="spinner"></span>
                        ) : (
                          <>
                            <i className="bi bi-send me-2"></i>
                            Submit Seller Review
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Progress indicator */}
              <div className="review-progress">
                <div className="review-progress-bar">
                  <div
                    className="review-progress-fill"
                    style={{
                      width: `${((submitted.product ? 1 : 0) + (submitted.seller ? 1 : 0)) * 50}%`,
                    }}
                  ></div>
                </div>
                <span className="review-progress-label">
                  {(submitted.product ? 1 : 0) + (submitted.seller ? 1 : 0)}/2
                  reviews completed
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Confirm Delivery Modal
// ─────────────────────────────────────────────
const ConfirmDeliveryModal = ({ isOpen, order, item, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container modal-confirm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header modal-header-success">
          <h5 className="modal-title">
            <i className="bi bi-check-circle-fill me-2"></i>Confirm Delivery
          </h5>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-icon-success">
            <i className="bi bi-box-seam"></i>
          </div>
          <div className="info-card">
            <h6>{item.name}</h6>
            <div className="info-row">
              <span>Item Total:</span>
              <strong>{fmt(totalAmount)}</strong>
            </div>
            <div className="info-row">
              <span>Platform Fee (10%):</span>
              <span className="text-muted">-{fmt(platformFee)}</span>
            </div>
            <div className="info-row">
              <span>Released to Seller:</span>
              <strong className="text-success">{fmt(sellerAmount)}</strong>
            </div>
          </div>
          <div className="alert-info">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Important:</strong> Confirming delivery will release the
            payment from escrow to the seller. This action cannot be undone.
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
            />
            <span>
              I confirm that I have received this item in good condition
            </span>
          </label>
        </div>
        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn-success"
            onClick={handleConfirm}
            disabled={loading || !isChecked}
          >
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>Confirm Delivery & Release Payment</>
            )}
          </button>
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div
          className={`modal-header ${isDispute ? "modal-header-warning" : "modal-header-danger"}`}
        >
          <h5 className="modal-title">
            <i
              className={`bi ${isDispute ? "bi-exclamation-triangle-fill" : "bi-x-circle-fill"} me-2`}
            ></i>
            {isDispute ? "Request Refund / Open Dispute" : "Cancel Item"}
          </h5>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="info-card compact">
              <div className="info-row">
                <span>Product:</span>
                <strong>{item.name}</strong>
              </div>
              <div className="info-row">
                <span>Amount:</span>
                <strong>{fmt(totalAmount)}</strong>
              </div>
              <div className="info-row">
                <span>Status:</span>
                <StatusBadge status={item.orderStatus} />
              </div>
            </div>
            {isDispute ? (
              <div className="alert-warning">
                <i className="bi bi-info-circle-fill me-2"></i>
                <strong>How it works:</strong>
                <ol>
                  <li>Submit your refund request with a reason</li>
                  <li>Seller has 48 hours to respond</li>
                  <li>If seller approves, you'll be refunded</li>
                  <li>If seller rejects, an admin will review</li>
                </ol>
              </div>
            ) : (
              <div className="alert-warning">
                <i className="bi bi-info-circle-fill me-2"></i>
                <strong>Note:</strong> Cancelling will immediately refund{" "}
                {fmt(totalAmount)} to your payment method.
              </div>
            )}
            <div className="form-group">
              <label>
                Reason <span className="required">*</span>
              </label>
              <textarea
                className="form-textarea"
                rows="4"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  isDispute
                    ? "Describe the issue in detail..."
                    : "Why are you cancelling this item?"
                }
                required
                minLength={5}
              />
              <small>{reason.length}/5 characters minimum</small>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Back
            </button>
            <button
              type="submit"
              className={`btn-${isDispute ? "warning" : "danger"}`}
              disabled={loading || reason.trim().length < 5}
            >
              {loading ? (
                <span className="spinner"></span>
              ) : isDispute ? (
                "Submit Refund Request"
              ) : (
                "Cancel Item & Refund"
              )}
            </button>
          </div>
        </form>
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
  onReviewItem,
}) => {
  if (!isOpen || !order) return null;

  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="bi bi-receipt me-2 text-gold"></i>
            Order #{order._id?.slice(-8).toUpperCase()}
          </h5>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {/* Status Cards */}
          <div className="status-grid">
            <div className="status-card">
              <small>Order Status</small>
              <StatusBadge status={order.orderStatus} />
            </div>
            <div className="status-card">
              <small>Payment</small>
              <StatusBadge status={order.paymentStatus} />
            </div>
            <div className="status-card">
              <small>Date</small>
              <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
            </div>
          </div>

          {/* Escrow Info */}
          {order.paymentStatus === "requires_capture" && (
            <div className="alert-escrow">
              <i className="bi bi-shield-lock fs-5 me-2"></i>
              <div>
                <strong>Funds Held in Escrow</strong>
                <p>
                  Your payment of {fmt(order.totalPrice)} is securely held.
                  Funds will be released per item when you confirm delivery.
                </p>
              </div>
            </div>
          )}

          {/* Shipping Address */}
          <div className="section-card">
            <h6>
              <i className="bi bi-geo-alt me-2 text-gold"></i>Shipping Address
            </h6>
            <div className="shipping-address">
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
          </div>

          {/* Items Table */}
          <h6 className="section-title">
            <i className="bi bi-box-seam me-2 text-gold"></i>Order Items
          </h6>
          <div className="items-table-wrapper">
            <table className="items-table">
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
                {order.orderItems?.map((item, idx) => {
                  const totalAmount =
                    item.price * item.quantity + (item.shippingFee || 0);
                  const actions = getItemActions(item, order.paymentStatus);
                  const isReviewable = canReviewItem(item);
                  const isDisputeRejected = item.disputeStatus === "rejected";
                  const isAdminResolved =
                    item.disputeStatus === "resolved_refund" ||
                    item.disputeStatus === "resolved_release";

                  return (
                    <tr key={idx}>
                      <td>
                        <div className="product-info">
                          <div className="product-name">{item.name}</div>
                          <div className="product-seller">
                            Seller: {item.seller?.fullname || "Store"}
                          </div>
                          <div className="product-timeline">
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
                        <div className="action-buttons">
                          {/* Show dispute chat link for rejected (escalated) disputes */}
                          {isDisputeRejected && item.disputeChatId && (
                            <a
                              href={`/chat?chatId=${item.disputeChatId}`}
                              className="btn-action btn-dispute-chat"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <i className="bi bi-chat-dots-fill me-1"></i>
                              Chat with Admin
                            </a>
                          )}

                          {/* Show admin resolution status */}
                          {isAdminResolved && (
                            <div className="admin-resolution-info">
                              <StatusBadge status={item.disputeStatus} />
                              {item.disputeChatId && (
                                <a
                                  href={`/chat?chatId=${item.disputeChatId}`}
                                  className="btn-action btn-dispute-chat mt-1"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <i className="bi bi-chat-dots me-1"></i>
                                  View Chat History
                                </a>
                              )}
                            </div>
                          )}

                          {actions.canConfirm && (
                            <button
                              className="btn-action btn-confirm"
                              onClick={() => onConfirmDelivery(order, item)}
                            >
                              <i className="bi bi-check-circle me-1"></i>Confirm
                            </button>
                          )}
                          {actions.canCancel && (
                            <button
                              className="btn-action btn-cancel"
                              onClick={() => onCancelItem(order, item)}
                            >
                              <i className="bi bi-x-circle me-1"></i>Cancel
                            </button>
                          )}
                          {actions.canDispute && (
                            <button
                              className="btn-action btn-dispute"
                              onClick={() => onDisputeItem(order, item)}
                            >
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              Refund
                            </button>
                          )}

                          {/* Review button - only for items that weren't admin-resolved */}
                          {isReviewable && (
                            <button
                              className="btn-action btn-review"
                              onClick={() => onReviewItem(order, item)}
                            >
                              <i className="bi bi-star me-1"></i>Review
                            </button>
                          )}

                          {!actions.canConfirm &&
                            !actions.canCancel &&
                            !actions.canDispute &&
                            !isReviewable &&
                            !isDisputeRejected &&
                            !isAdminResolved && (
                              <span className="badge-inactive">
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
          <div className="summary-card">
            <div className="summary-row">
              <span>Subtotal:</span>
              <strong>{fmt(order.itemsPrice)}</strong>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <strong>{fmt(order.shippingPrice)}</strong>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>Total:</span>
              <span className="total-amount">{fmt(order.totalPrice)}</span>
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

// ─────────────────────────────────────────────
// Order Card Component
// ─────────────────────────────────────────────
const OrderCard = ({
  order,
  onViewDetails,
  onConfirmDelivery,
  onCancelItem,
  onDisputeItem,
  onReviewItem,
}) => {
  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n || 0);

  const actionableItems =
    order.orderItems?.filter((item) => {
      const actions = getItemActions(item, order.paymentStatus);
      return actions.canConfirm || actions.canCancel || actions.canDispute;
    }).length || 0;

  const disputeItems =
    order.orderItems?.filter(
      (item) =>
        item.disputeStatus === "open" || item.disputeStatus === "rejected",
    ).length || 0;

  const reviewableItems =
    order.orderItems?.filter((item) => canReviewItem(item)).length || 0;

  return (
    <div className="order-card">
      <div className="order-card-header">
        <div className="order-info">
          <h6 className="order-id">
            <i className="bi bi-receipt me-2"></i>
            Order #{order._id?.slice(-8).toUpperCase()}
          </h6>
          <span className="order-date">
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="order-status-badges">
          <StatusBadge status={order.orderStatus} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="order-card-body">
        {order.orderItems?.slice(0, 3).map((item, idx) => (
          <div key={idx} className="order-item-row">
            <div className="order-item-info">
              <StatusBadge status={item.orderStatus} />
              <span className="order-item-name">{item.name}</span>
              <span className="order-item-qty">×{item.quantity}</span>
            </div>
            <span className="order-item-total">
              {fmt(item.price * item.quantity + (item.shippingFee || 0))}
            </span>
          </div>
        ))}
        {order.orderItems?.length > 3 && (
          <div className="more-items">
            +{order.orderItems.length - 3} more items
          </div>
        )}
      </div>

      {(disputeItems > 0 || actionableItems > 0 || reviewableItems > 0) && (
        <div className="order-alerts">
          {disputeItems > 0 && (
            <div className="alert-dispute">
              <i className="bi bi-exclamation-triangle-fill me-1"></i>
              {disputeItems} item(s) in dispute —{" "}
              {order.orderItems?.some(
                (item) => item.disputeStatus === "rejected",
              ) && (
                <a
                  href={`/chat?chatId=${
                    order.orderItems.find((i) => i.disputeStatus === "rejected")
                      ?.disputeChatId
                  }`}
                  className="dispute-chat-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat with Admin
                </a>
              )}
            </div>
          )}
          {actionableItems > 0 && (
            <div className="alert-action">
              <i className="bi bi-info-circle-fill me-1"></i>
              {actionableItems} item(s) require your attention
            </div>
          )}
          {reviewableItems > 0 && (
            <div className="alert-review">
              <i className="bi bi-star-fill me-1"></i>
              {reviewableItems} item(s) ready for review
            </div>
          )}
        </div>
      )}

      {/* Show admin chat link for escalated disputes */}
      {order.orderItems?.some(
        (item) => item.disputeStatus === "rejected" && item.disputeChatId,
      ) && (
        <div className="alert-escalated">
          <i className="bi bi-shield-exclamation me-1"></i>
          Dispute escalated — Admin reviewing.{" "}
          <a
            href={`/chat?chatId=${
              order.orderItems.find(
                (i) => i.disputeStatus === "rejected" && i.disputeChatId,
              )?.disputeChatId
            }`}
            className="dispute-chat-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open dispute chat
          </a>
        </div>
      )}

      <div className="order-card-footer">
        <div className="shipping-location">
          <i className="bi bi-geo-alt me-1 text-gold"></i>
          {order.shippingAddress?.city}, {order.shippingAddress?.country}
        </div>
        <div className="order-total">
          <span>Total:</span>
          <span className="total-price">{fmt(order.totalPrice)}</span>
        </div>
        <button
          className="btn-view-details"
          onClick={() => onViewDetails(order)}
        >
          <i className="bi bi-eye me-1"></i>View Details
        </button>
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────
// Stats Card Component
// ─────────────────────────────────────────────
const StatsCard = ({ title, value, icon, color }) => (
  <div className={`stats-card stats-${color}`}>
    <div className="stats-icon">
      <i className={`bi ${icon}`}></i>
    </div>
    <div className="stats-content">
      <h5 className="stats-value">{value}</h5>
      <p className="stats-title">{title}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Main Client Orders Page
// ─────────────────────────────────────────────
const ClientOrders = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [modal, setModal] = useState({
    type: null,
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
        { headers: { Authorization: `Bearer ${token}` } },
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

  const openDetails = (order) =>
    setModal({ type: "details", order, item: null, isOpen: true });
  const openConfirm = (order, item) =>
    setModal({ type: "confirm", order, item, isOpen: true });
  const openCancel = (order, item) =>
    setModal({ type: "cancel", order, item, isOpen: true });
  const openDispute = (order, item) =>
    setModal({ type: "dispute", order, item, isOpen: true });
  const openReview = (order, item) =>
    setModal({ type: "review", order, item, isOpen: true });

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
      // Check if review is allowed before auto-opening
      const updatedOrder = orders.find((o) => o._id === order._id);
      const updatedItem = updatedOrder?.orderItems?.find(
        (i) => (i.product?._id || i.product)?.toString() === productId,
      );
      if (updatedItem && canReviewItem(updatedItem)) {
        setTimeout(() => openReview(order, updatedItem), 600);
      }
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

  const handleReviewSubmit = (message, type) => {
    showToast(message, type);
  };

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

  // Updated stats calculation to include admin-resolved cases
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
      o.orderItems?.some(
        (item) =>
          item.disputeStatus === "open" || item.disputeStatus === "rejected",
      ),
    ).length,
    delivered: orders.filter((o) => o.orderStatus === "delivered").length,
    totalSpent: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* All Modals */}
      <OrderDetailsModal
        isOpen={modal.type === "details" && modal.isOpen}
        order={modal.order}
        onClose={closeAllModals}
        onConfirmDelivery={openConfirm}
        onCancelItem={openCancel}
        onDisputeItem={openDispute}
        onReviewItem={openReview}
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

      <ReviewModal
        isOpen={modal.type === "review" && modal.isOpen}
        order={modal.order}
        item={modal.item}
        onClose={closeAllModals}
        onSubmit={handleReviewSubmit}
      />

      {/* Page Header */}
      <div className="orders-header">
        <div>
          <h1 className="orders-title">
            <i className="bi bi-box-seam me-3 text-gold"></i>My Orders
          </h1>
          <p className="orders-subtitle">
            Track, manage, and confirm your orders
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="row my-2 d-flex justify-content-center align-items-center gap-2">
        <div className="col-2">
          <StatsCard
            title="Total Orders"
            value={stats.total}
            icon="bi-receipt"
            color="primary"
          />
        </div>
        <div className="col-2">
          <StatsCard
            title="In Escrow"
            value={stats.inEscrow}
            icon="bi-shield-lock"
            color="info"
          />
        </div>
        <div className="col-2">
          <StatsCard
            title="Needs Action"
            value={stats.needAction}
            icon="bi-exclamation-triangle"
            color="warning"
          />
        </div>
        <div className="col-5">
          <StatsCard
            title="Disputes"
            value={stats.disputes}
            icon="bi-flag"
            color="danger"
          />
        </div>
        <div className="col-4">
          <StatsCard
            title="Delivered"
            value={stats.delivered}
            icon="bi-check-circle"
            color="success"
          />
        </div>
        <div className="col-5">
          <StatsCard
            title="Total Spent"
            value={`$${stats.totalSpent.toFixed(2)}`}
            icon="bi-cash-stack"
            color="dark"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <i className="bi bi-search search-icon"></i>
          <input
            type="text"
            className="search-input"
            placeholder="Search by order ID or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
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
          <option value="partial_captured">Partial Released</option>
          <option value="captured">Released</option>
          <option value="refunded">Refunded</option>
        </select>
        <button
          className="btn-reset"
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("all");
            setPaymentFilter("all");
          }}
        >
          <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-inbox empty-icon"></i>
          <h4>No orders found</h4>
          <p>
            {orders.length === 0
              ? "You haven't placed any orders yet."
              : "Try adjusting your filters"}
          </p>
          {orders.length === 0 && (
            <Link href="/products" className="btn-primary-link">
              <i className="bi bi-shop me-2"></i>Start Shopping
            </Link>
          )}
        </div>
      ) : (
        <div className="row d-flex justify-content-center align-items-center">
          <div className="orders-list col-10">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onViewDetails={openDetails}
                onConfirmDelivery={openConfirm}
                onCancelItem={openCancel}
                onDisputeItem={openDispute}
                onReviewItem={openReview}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientOrders;
