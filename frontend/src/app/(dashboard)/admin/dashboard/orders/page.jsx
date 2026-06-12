"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Toast from "@/app/components/Toast";
import "./AdminOrders.css";

const API_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}`;

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className={`stat-card-premium stat-${color}`}>
      <div className="stat-icon-wrapper">
        <div className="stat-icon">
          <i className={`bi ${icon}`}></i>
        </div>
      </div>
      <div className="stat-content">
        <h3 className="stat-value">
          {typeof value === "number" ? value.toLocaleString() : value}
        </h3>
        <p className="stat-title">{title}</p>
      </div>
    </div>
  );
};

// Payment Badge Component
const PaymentBadge = ({ status }) => {
  const configs = {
    paid: { class: "success", icon: "bi-check-circle-fill", label: "Paid" },
    pending: { class: "warning", icon: "bi-hourglass-split", label: "Pending" },
    failed: {
      class: "danger",
      icon: "bi-exclamation-triangle-fill",
      label: "Failed",
    },
    refunded: {
      class: "info",
      icon: "bi-arrow-return-left",
      label: "Refunded",
    },
    requires_capture: {
      class: "info",
      icon: "bi-shield-lock",
      label: "In Escrow",
    },
    captured: { class: "success", icon: "bi-cash-stack", label: "Released" },
  };
  const config = configs[status] || {
    class: "secondary",
    icon: "bi-question-circle",
    label: status,
  };

  return (
    <span className={`payment-badge ${config.class}`}>
      <i className={`bi ${config.icon}`}></i>
      {config.label}
    </span>
  );
};

// Delivery Badge Component
const DeliveryBadge = ({ isDelivered }) => {
  return (
    <span
      className={`delivery-badge ${isDelivered ? "delivered" : "processing"}`}
    >
      <i
        className={`bi ${isDelivered ? "bi-check-circle-fill" : "bi-truck"}`}
      ></i>
      {isDelivered ? "Delivered" : "Processing"}
    </span>
  );
};

// Order Status Select Component
const OrderStatusSelect = ({ item, orderId, onUpdate, updating }) => {
  const [status, setStatus] = useState(item.orderStatus || "pending");

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    await onUpdate(orderId, item._id, newStatus);
  };

  const statusConfigs = {
    pending: { class: "status-option pending", label: "Pending" },
    confirmed: { class: "status-option confirmed", label: "Confirmed" },
    processing: { class: "status-option processing", label: "Processing" },
    shipped: { class: "status-option shipped", label: "Shipped" },
    delivered: { class: "status-option delivered", label: "Delivered" },
    cancelled: { class: "status-option cancelled", label: "Cancelled" },
  };

  return (
    <select
      className={`order-status-select ${statusConfigs[status]?.class || ""}`}
      value={status}
      onChange={handleChange}
      disabled={updating === orderId}
    >
      <option value="pending">Pending</option>
      <option value="confirmed">Confirmed</option>
      <option value="processing">Processing</option>
      <option value="shipped">Shipped</option>
      <option value="delivered">Delivered</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
};

// Helper function to get profile image URL
const getProfileImageUrl = (profilePicture) => {
  if (!profilePicture) return null;
  if (profilePicture.startsWith("http")) return profilePicture;
  if (profilePicture.startsWith("/uploads")) {
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}${profilePicture}`;
  }
  return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/profiles/${profilePicture}`;
};

// Order Row Component
const OrderRow = ({
  order,
  index,
  isExpanded,
  onToggle,
  onUpdateStatus,
  updatingOrder,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  // Get user data from populated order
  const user = order.user || {};
  console.log(user);
  const userName = user.fullname || user.name || "Guest";
  const userEmail = user.email || "";
  const userPhone = order.shippingAddress?.phone || user.phone || "No phone";
  const profileImageUrl = getProfileImageUrl(user.profilePicture);

  return (
    <React.Fragment>
      <tr className={`order-row ${isExpanded ? "expanded" : ""}`}>
        <td className="expand-cell">
          <button className="expand-btn" onClick={() => onToggle(index)}>
            <i className={`bi bi-chevron-${isExpanded ? "up" : "down"}`}></i>
          </button>
        </td>
        <td className="order-id-cell">
          <span className="order-id">#{order._id.slice(-8).toUpperCase()}</span>
        </td>
        <td className="customer-cell">
          <div className="customer-info">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={userName}
                className="customer-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  const parent = e.target.parentElement;
                  const icon = document.createElement("i");
                  icon.className = "bi bi-person-circle";
                  icon.style.fontSize = "32px";
                  icon.style.color = "var(--gold)";
                  parent.insertBefore(icon, e.target);
                  e.target.remove();
                }}
              />
            ) : (
              <i
                className="bi bi-person-circle"
                style={{ fontSize: "32px", color: "var(--gold)" }}
              ></i>
            )}
            <div>
              <div className="customer-name">{userName}</div>
              {userEmail && <div className="customer-email">{userEmail}</div>}
              <div className="customer-phone">
                <i className="bi bi-telephone"></i> {userPhone}
              </div>
            </div>
          </div>
        </td>
        <td className="total-cell">
          <span className="order-total">
            {formatCurrency(order.totalPrice)}
          </span>
        </td>
        <td className="payment-cell">
          <PaymentBadge status={order.paymentStatus} />
        </td>
        <td className="delivery-cell">
          <DeliveryBadge isDelivered={order.isDelivered} />
        </td>
        <td className="date-cell">
          <div className="date-info">
            <i className="bi bi-calendar3"></i>
            <span>{formatDate(order.createdAt)}</span>
          </div>
        </td>
      </tr>

      {/* Expanded Details */}
      {isExpanded && (
        <tr className="expanded-row border border-sm">
          <td colSpan="12" className="expanded-cell">
            <div className="expanded-content">
              {/* Shipping Information */}
              <div className="info-section">
                <h6 className="section-title-small">
                  <i className="bi bi-truck"></i>
                  Shipping Details
                </h6>
                <div className="info-card">
                  <div className="info-row">
                    <span>Full Name:</span>
                    <strong>
                      {order.shippingAddress?.fullName || userName}
                    </strong>
                  </div>
                  <div className="info-row">
                    <span>Phone:</span>
                    <strong>{order.shippingAddress?.phone || userPhone}</strong>
                  </div>
                  <div className="info-row">
                    <span>Email:</span>
                    <strong>{userEmail || "N/A"}</strong>
                  </div>
                  <div className="info-row">
                    <span>Address:</span>
                    <div className="address-text">
                      {order.shippingAddress?.address || "N/A"}
                      <br />
                      {order.shippingAddress?.city && (
                        <>
                          {order.shippingAddress.city}
                          {order.shippingAddress?.postalCode &&
                            `, ${order.shippingAddress.postalCode}`}
                          <br />
                        </>
                      )}
                      {order.shippingAddress?.country || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="items-section">
                <h6 className="section-title-small">
                  <i className="bi bi-box-seam"></i>
                  Order Items
                </h6>
                <div className="items-table-wrapper">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Seller</th>
                        <th>Status</th>
                        <th className="text-center">Qty</th>
                        <th className="text-end">Price</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.orderItems?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="product-name-cell">{item.name}</td>
                          <td className="seller-name-cell">
                            {item.seller?.fullname ||
                              item.seller?.name ||
                              "Unknown Seller"}
                          </td>

                          <td className="status-cell">
                            <OrderStatusSelect
                              item={item}
                              orderId={order._id}
                              onUpdate={onUpdateStatus}
                              updating={updatingOrder}
                            />
                          </td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-end">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="text-end fw-semibold">
                            {formatCurrency(item.quantity * item.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Order Summary */}
                <div className="order-summary">
                  <div className="summary-card">
                    <div className="summary-row">
                      <span>Items Subtotal:</span>
                      <span>{formatCurrency(order.itemsPrice)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Shipping:</span>
                      <span>{formatCurrency(order.shippingPrice)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Tax:</span>
                      <span>{formatCurrency(order.taxPrice)}</span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-row total">
                      <span>Grand Total:</span>
                      <span className="total-amount">
                        {formatCurrency(order.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const tokenRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  useEffect(() => {
    tokenRef.current = localStorage.getItem("token");
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const token = tokenRef.current;
    if (!token) {
      setError("No authentication token found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.response?.data?.message || "Failed to fetch orders");
      showToast("Failed to fetch orders", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (index) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const updateOrderStatus = async (orderId, itemId, newStatus) => {
    try {
      setUpdatingOrder(orderId);
      const token = tokenRef.current;
      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/admin/${orderId}/items/${itemId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await fetchOrders();
      showToast(`Order status updated to ${newStatus}`, "success");
    } catch (err) {
      console.error("Error updating order status:", err);
      showToast(
        err.response?.data?.message || "Failed to update order status",
        "error",
      );
    } finally {
      setUpdatingOrder(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "all" || order.paymentStatus === filterStatus;
    const matchesSearch =
      searchTerm === "" ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.shippingAddress?.phone || "").includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: orders.length,
    paid: orders.filter(
      (o) => o.paymentStatus === "paid" || o.paymentStatus === "captured",
    ).length,
    pending: orders.filter((o) => o.paymentStatus === "pending").length,
    revenue: orders
      .filter(
        (o) => o.paymentStatus === "paid" || o.paymentStatus === "captured",
      )
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0),
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="admin-orders">
        <div className="loading-container">
          <div className="gold-spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      <div className="orders-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="header-badge">
              <i className="bi bi-box-seam"></i>
              <span>Order Management</span>
            </div>
            <h1 className="page-title">Manage Orders</h1>
            <p className="page-subtitle">View and manage all customer orders</p>
          </div>
          <div className="header-stats">
            <span className="total-badge">
              <i className="bi bi-cart"></i>
              Total Orders: {orders.length}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid-premium">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.revenue)}
            icon="bi-currency-dollar"
            color="gold"
          />
          <StatCard
            title="Paid Orders"
            value={stats.paid}
            icon="bi-check-circle-fill"
            color="success"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon="bi-hourglass-split"
            color="warning"
          />
          <StatCard
            title="Completion Rate"
            value={`${orders.length ? Math.round((stats.paid / orders.length) * 100) : 0}%`}
            icon="bi-pie-chart-fill"
            color="info"
          />
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search by Order ID or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <button className="reset-btn" onClick={fetchOrders}>
            <i className="bi bi-arrow-repeat"></i>
            Refresh
          </button>
        </div>

        {/* Orders Table */}
        <div className="orders-card">
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}></th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Delivery</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, index) => (
                    <OrderRow
                      key={order._id}
                      order={order}
                      index={index}
                      isExpanded={expandedRows[index]}
                      onToggle={toggleRow}
                      onUpdateStatus={updateOrderStatus}
                      updatingOrder={updatingOrder}
                    />
                  ))
                ) : (
                  <tr className="empty-row">
                    <td colSpan="7" className="empty-table-cell">
                      <i className="bi bi-inbox"></i>
                      <h5>No orders found</h5>
                      <p>Try adjusting your filters or search term</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
