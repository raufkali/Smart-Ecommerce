"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL + "/orders/";

  // Fetch orders with useCallback for potential reuse
  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      const { data } = await axios.get(backendURL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(data.orders || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch orders");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [backendURL]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Toggle row expansion
  const toggleRow = (index) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Update order status
  const updateOrderStatus = async (orderId, itemId, newStatus) => {
    try {
      setUpdatingOrder(orderId);
      const token = localStorage.getItem("token");

      await axios.put(
        `${backendURL}${orderId}/items/${itemId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Refresh orders after update
      await fetchOrders();

      // Show success message (you could add a toast notification here)
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update order status");
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Get payment badge with proper styling
  const getPaymentBadge = (status) => {
    const badges = {
      paid: { class: "success", icon: "bi-check-circle-fill" },
      pending: { class: "warning", icon: "bi-hourglass-split" },
      failed: { class: "danger", icon: "bi-exclamation-triangle-fill" },
      refunded: { class: "info", icon: "bi-arrow-return-left" },
    };

    const badge = badges[status] || {
      class: "secondary",
      icon: "bi-question-circle",
    };

    return (
      <span
        className={`badge bg-${badge.class} bg-opacity-10 text-${badge.class} px-3 py-2`}
      >
        <i className={`bi ${badge.icon} me-1`}></i>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Format date nicely
  const formatDate = (dateString) => {
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

  // Filter orders based on status and search
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "all" || order.paymentStatus === filterStatus;
    const matchesSearch =
      searchTerm === "" ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingAddress?.phone?.includes(searchTerm);

    return matchesStatus && matchesSearch;
  });

  // Calculate summary statistics
  const stats = {
    total: orders.length,
    paid: orders.filter((o) => o.paymentStatus === "paid").length,
    pending: orders.filter((o) => o.paymentStatus === "pending").length,
    revenue: orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.totalPrice, 0),
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div
            className="spinner-border text-primary mb-3"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center shadow-sm">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header with Stats */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">
          <i className="bi bi-box-seam me-2"></i>
          Order Management
        </h2>
        <span className="badge bg-primary bg-opacity-10 text-primary px-4 py-2 rounded-pill">
          <i className="bi bi-cart me-2"></i>
          Total Orders: {orders.length}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-primary bg-opacity-10">
            <div className="card-body">
              <h6 className="text-primary mb-2">Total Revenue</h6>
              <h3 className="mb-0">${stats.revenue.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-success bg-opacity-10">
            <div className="card-body">
              <h6 className="text-success mb-2">Paid Orders</h6>
              <h3 className="mb-0">{stats.paid}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-warning bg-opacity-10">
            <div className="card-body">
              <h6 className="text-warning mb-2">Pending</h6>
              <h3 className="mb-0">{stats.pending}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-info bg-opacity-10">
            <div className="card-body">
              <h6 className="text-info mb-2">Completion Rate</h6>
              <h3 className="mb-0">
                {orders.length
                  ? Math.round((stats.paid / orders.length) * 100)
                  : 0}
                %
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Search by ID, customer, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div className="col-md-5 text-end">
          <button
            className="btn btn-outline-primary me-2"
            onClick={fetchOrders}
          >
            <i className="bi bi-arrow-repeat me-2"></i>
            Refresh
          </button>
          <button className="btn btn-outline-secondary">
            <i className="bi bi-download me-2"></i>
            Export
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="bg-light">
            <tr>
              <th style={{ width: "50px" }}></th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Delivery</th>
              <th>Date</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => (
                <React.Fragment key={order._id}>
                  <tr className={expandedRows[index] ? "table-active" : ""}>
                    <td>
                      <button
                        className="btn btn-sm btn-link text-decoration-none p-0"
                        onClick={() => toggleRow(index)}
                      >
                        <i
                          className={`bi bi-chevron-${expandedRows[index] ? "up" : "down"} fs-6`}
                        ></i>
                      </button>
                    </td>
                    <td>
                      <span className="fw-semibold">
                        #{order._id.slice(-8)}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                          <i className="bi bi-person text-primary"></i>
                        </div>
                        <div>
                          <div className="fw-semibold">
                            {order.user?.name || "Guest"}
                          </div>
                          <small className="text-muted">
                            {order.shippingAddress?.phone || "No phone"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="fw-bold">${order.totalPrice.toFixed(2)}</td>
                    <td>{getPaymentBadge(order.paymentStatus)}</td>
                    <td>
                      {order.isDelivered ? (
                        <span className="badge bg-success bg-opacity-10 text-success px-3 py-2">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          Delivered
                        </span>
                      ) : (
                        <span className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2">
                          <i className="bi bi-truck me-1"></i>
                          Processing
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="small">
                        <div className="fw-semibold">
                          {formatDate(order.createdAt)}
                        </div>
                        <small className="text-muted">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-2 justify-content-center">
                        <button
                          className="btn btn-sm btn-outline-info"
                          title="Print Invoice"
                        >
                          <i className="bi bi-printer"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          title="Contact Customer"
                        >
                          <i className="bi bi-envelope"></i>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Details */}
                  {expandedRows[index] && (
                    <tr className="bg-light">
                      <td colSpan="8" className="p-4">
                        <div className="row g-4">
                          {/* Shipping Information */}
                          <div className="col-md-4">
                            <div className="card border-0 shadow-sm h-100">
                              <div className="card-body">
                                <h6 className="fw-bold mb-3">
                                  <i className="bi bi-truck me-2 text-primary"></i>
                                  Shipping Details
                                </h6>
                                <p className="mb-2">
                                  <strong>Name:</strong>{" "}
                                  {order.shippingAddress.fullName}
                                </p>
                                <p className="mb-2">
                                  <strong>Phone:</strong>{" "}
                                  {order.shippingAddress.phone}
                                </p>
                                <p className="mb-2">
                                  <strong>Address:</strong>
                                  <br />
                                  {order.shippingAddress.address}
                                  <br />
                                  {order.shippingAddress.city},{" "}
                                  {order.shippingAddress.postalCode}
                                  <br />
                                  {order.shippingAddress.country}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="col-md-8">
                            <div className="card border-0 shadow-sm">
                              <div className="card-body">
                                <h6 className="fw-bold mb-3">
                                  <i className="bi bi-box me-2 text-primary"></i>
                                  Order Items
                                </h6>
                                <div className="table-responsive">
                                  <table className="table table-sm">
                                    <thead>
                                      <tr>
                                        <th>Product</th>
                                        <th>Status</th>
                                        <th className="text-center">
                                          Quantity
                                        </th>
                                        <th className="text-end">Price</th>
                                        <th className="text-end">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {order.orderItems.map((item, i) => (
                                        <tr key={i}>
                                          <td>{item.name}</td>
                                          <td>
                                            <select
                                              className="form-select form-select-sm"
                                              value={
                                                item.orderStatus || "pending"
                                              }
                                              onChange={(e) =>
                                                updateOrderStatus(
                                                  order._id,
                                                  item._id,
                                                  e.target.value,
                                                )
                                              }
                                              disabled={
                                                updatingOrder === order._id
                                              }
                                            >
                                              <option value="pending">
                                                Pending
                                              </option>
                                              <option value="processing">
                                                Processing
                                              </option>
                                              <option value="shipped">
                                                Shipped
                                              </option>
                                              <option value="delivered">
                                                Delivered
                                              </option>
                                              <option value="cancelled">
                                                Cancelled
                                              </option>
                                            </select>
                                          </td>
                                          <td className="text-center">
                                            {item.quantity}
                                          </td>
                                          <td className="text-end">
                                            ${item.price}
                                          </td>
                                          <td className="text-end">
                                            $
                                            {(
                                              item.quantity * item.price
                                            ).toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Price Summary */}
                                <div className="row mt-3">
                                  <div className="col-md-6 offset-md-6">
                                    <div className="bg-white p-3 rounded">
                                      <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">
                                          Items Total:
                                        </span>
                                        <span className="fw-semibold">
                                          ${order.itemsPrice}
                                        </span>
                                      </div>
                                      <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">
                                          Shipping:
                                        </span>
                                        <span className="fw-semibold">
                                          ${order.shippingPrice}
                                        </span>
                                      </div>
                                      <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Tax:</span>
                                        <span className="fw-semibold">
                                          ${order.taxPrice}
                                        </span>
                                      </div>
                                      <hr className="my-2" />
                                      <div className="d-flex justify-content-between">
                                        <span className="fw-bold">
                                          Grand Total:
                                        </span>
                                        <span className="fw-bold text-primary">
                                          ${order.totalPrice}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-5">
                  <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                  <h5 className="text-muted">No orders found</h5>
                  <p className="text-muted mb-0">
                    Try adjusting your filters or search term
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersPage;
