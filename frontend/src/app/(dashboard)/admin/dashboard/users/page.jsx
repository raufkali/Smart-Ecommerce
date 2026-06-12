"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./AdminUsers.css";

const API_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin`;

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: "bi-check-circle-fill",
    error: "bi-exclamation-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    info: "bi-info-circle-fill",
  };

  return (
    <div className={`toast-notification toast-${type}`}>
      <i className={`bi ${icons[type] || "bi-bell-fill"} toast-icon`}></i>
      <span className="toast-message">{message}</span>
      <button className="toast-close-btn" onClick={onClose}>
        <i className="bi bi-x-lg"></i>
      </button>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, subtitle }) => {
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
        {subtitle && <small className="stat-subtitle">{subtitle}</small>}
      </div>
    </div>
  );
};

// User Analytics Modal Component
const UserAnalyticsModal = ({ user, onClose }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserAnalytics();
  }, [user]);

  const fetchUserAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/users/${user._id}/analytics`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setAnalytics(response.data.analytics);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err.response?.data?.message || "Failed to fetch user analytics");
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getProfileImageUrl = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith("http")) return profilePicture;
    if (profilePicture.startsWith("/uploads")) {
      return `${process.env.NEXT_PUBLIC_BACKEND_URL}${profilePicture}`;
    }
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/profiles/${profilePicture}`;
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-container modal-large"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="modal-body"
            style={{ textAlign: "center", padding: "40px" }}
          >
            <div className="gold-spinner"></div>
            <p>Loading user analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-container modal-large"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-body">
            <div className="error-message">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const profileImageUrl = getProfileImageUrl(user?.profilePicture);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="bi bi-graph-up"></i>
            User Analytics: {user?.fullname}
          </h5>
          <button className="modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-body analytics-body">
          {/* User Info Summary */}
          <div className="analytics-summary">
            <div className="summary-card">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={user?.fullname}
                  className="analytics-user-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML =
                      '<i class="bi bi-person-circle"></i>';
                  }}
                />
              ) : (
                <i className="bi bi-person-circle"></i>
              )}
              <div>
                <small>User</small>
                <p>{user?.fullname}</p>
                <small className="text-muted">{user?.email}</small>
              </div>
            </div>
          </div>

          {/* Only show order stats for non-admin users */}
          {user?.role !== "admin" && (
            <>
              {/* Order Stats */}
              <div className="analytics-section">
                <h4>
                  <i className="bi bi-bag-check"></i> Order Statistics
                </h4>
                <div className="stats-grid-small">
                  <div className="stat-card-mini">
                    <div className="stat-icon-mini">
                      <i className="bi bi-bag"></i>
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Total Orders</span>
                      <span className="stat-number">
                        {analytics?.orders?.total || 0}
                      </span>
                    </div>
                  </div>
                  <div className="stat-card-mini success">
                    <div className="stat-icon-mini">
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Completed</span>
                      <span className="stat-number">
                        {analytics?.orders?.byStatus?.delivered || 0}
                      </span>
                    </div>
                  </div>
                  <div className="stat-card-mini warning">
                    <div className="stat-icon-mini">
                      <i className="bi bi-hourglass"></i>
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Pending</span>
                      <span className="stat-number">
                        {analytics?.orders?.byStatus?.pending || 0}
                      </span>
                    </div>
                  </div>
                  <div className="stat-card-mini danger">
                    <div className="stat-icon-mini">
                      <i className="bi bi-x-circle"></i>
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Cancelled</span>
                      <span className="stat-number">
                        {analytics?.orders?.byStatus?.cancelled || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Status Breakdown */}
              {analytics?.orders?.byStatus &&
                Object.keys(analytics.orders.byStatus).length > 0 && (
                  <div className="analytics-section">
                    <h4>
                      <i className="bi bi-pie-chart"></i> Order Status Breakdown
                    </h4>
                    <div className="status-breakdown">
                      {Object.entries(analytics.orders.byStatus).map(
                        ([status, count]) =>
                          count > 0 && (
                            <div key={status} className="status-item">
                              <span className={`status-badge ${status}`}>
                                {status}
                              </span>
                              <div className="status-bar-container">
                                <div
                                  className="status-bar"
                                  style={{
                                    width: `${(count / (analytics?.orders?.total || 1)) * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="status-count">{count}</span>
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                )}

              {/* Recent User Orders */}
              {analytics?.orders?.recentOrders?.length > 0 && (
                <div className="analytics-section">
                  <h4>
                    <i className="bi bi-clock-history"></i> Recent Orders
                  </h4>
                  <div className="recent-orders-table">
                    <table className="mini-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Items</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.orders.recentOrders.map((order) => (
                          <tr key={order.id}>
                            <td>{order.id?.slice(-8).toUpperCase()}</td>
                            <td>{order.itemsCount}</td>
                            <td>{formatCurrency(order.totalAmount)}</td>
                            <td>
                              <span
                                className={`status-badge small ${order.status}`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td>{formatDate(order.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Seller Analytics (only for sellers) */}
          {user?.role === "seller" && analytics?.sellerAnalytics && (
            <>
              <div className="analytics-section">
                <h4>
                  <i className="bi bi-shop"></i> Seller Performance
                </h4>
                <div className="stats-grid-small">
                  <div className="stat-card-mini">
                    <div className="stat-icon-mini">
                      <i className="bi bi-box"></i>
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Total Products</span>
                      <span className="stat-number">
                        {analytics.sellerAnalytics.products?.total || 0}
                      </span>
                    </div>
                  </div>
                  <div className="stat-card-mini success">
                    <div className="stat-icon-mini">
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Active Products</span>
                      <span className="stat-number">
                        {analytics.sellerAnalytics.products?.active || 0}
                      </span>
                    </div>
                  </div>
                  <div className="stat-card-mini info">
                    <div className="stat-icon-mini">
                      <i className="bi bi-cart-check"></i>
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Orders Received</span>
                      <span className="stat-number">
                        {analytics.sellerAnalytics.orders?.total || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Seller Orders (only orders where this user is the seller) */}
              {analytics.sellerAnalytics.orders?.recentOrders?.length > 0 && (
                <div className="analytics-section">
                  <h4>
                    <i className="bi bi-clock-history"></i> Recent Seller Orders
                  </h4>
                  <div className="recent-orders-table">
                    <table className="mini-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.sellerAnalytics.orders.recentOrders.map(
                          (order) => (
                            <tr key={order.id}>
                              <td>{order.id?.slice(-8).toUpperCase()}</td>
                              <td>{order.customer || "N/A"}</td>
                              <td>{order.productName || "N/A"}</td>
                              <td>{order.quantity || 1}</td>
                              <td>
                                {formatCurrency(
                                  order.itemAmount || order.totalAmount,
                                )}
                              </td>
                              <td>
                                <span
                                  className={`status-badge small ${order.status}`}
                                >
                                  {order.status}
                                </span>
                              </td>
                              <td>{formatDate(order.createdAt)}</td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Admin users get minimal info */}
          {user?.role === "admin" && (
            <div className="analytics-section">
              <div className="info-alert info">
                <i className="bi bi-shield-check"></i>
                <div>
                  <strong>Administrator Account</strong>
                  <p>
                    Admin users have full platform access. No order or financial
                    data is displayed.
                  </p>
                </div>
              </div>
            </div>
          )}
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

const UserRow = ({
  user,
  index,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewAnalytics,
}) => {
  const getRoleConfig = (role) => {
    const configs = {
      admin: {
        class: "role-badge admin",
        icon: "bi-shield-lock-fill",
        label: "Admin",
      },
      seller: { class: "role-badge seller", icon: "bi-shop", label: "Seller" },
      user: { class: "role-badge user", icon: "bi-person", label: "User" },
    };
    return configs[role] || configs.user;
  };

  const roleConfig = getRoleConfig(user.role);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  // Get profile image URL - FIXED for filename only storage
  const getProfileImageUrl = () => {
    if (!user.profilePicture) return null;

    const imagePath = user.profilePicture;

    // If it's already a full URL
    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // If it starts with /uploads
    if (imagePath.startsWith("/uploads")) {
      return `${process.env.NEXT_PUBLIC_BACKEND_URL}${imagePath}`;
    }

    // If it's just a filename (like 'profile-xxx.jpg')
    // Construct the full path to the profiles folder
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/profiles/${imagePath}`;
  };

  const profileImage = getProfileImageUrl();

  return (
    <tr className="user-row">
      <td className="index-cell">{index + 1}</td>
      <td className="user-cell">
        <div className="user-avatar">
          {profileImage ? (
            <img
              src={profileImage}
              alt={user.fullname}
              className="user-avatar-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
                const parent = e.target.parentElement;
                const icon = document.createElement("i");
                icon.className = "bi bi-person-circle";
                icon.style.fontSize = "44px";
                icon.style.color = "var(--gold)";
                parent.appendChild(icon);
              }}
            />
          ) : (
            <i
              className="bi bi-person-circle"
              style={{ fontSize: "44px", color: "var(--gold)" }}
            ></i>
          )}
        </div>
        <div className="user-info">
          <div className="user-name">{user.fullname || "N/A"}</div>
          <div className="user-id">ID: {user._id?.slice(-8).toUpperCase()}</div>
        </div>
      </td>
      <td className="email-cell">{user.email}</td>
      <td className="stats-cell">
        <div className="quick-stats">
          {user.role !== "admin" ? (
            <>
              <span title="Total Orders">
                <i className="bi bi-bag"></i> {user.stats?.totalOrders || 0}
              </span>
              <span title="Total Spent">
                <i className="bi bi-credit-card"></i>{" "}
                {formatCurrency(user.stats?.totalSpending || 0)}
              </span>
            </>
          ) : (
            <span className="text-muted">Admin Account</span>
          )}
        </div>
      </td>
      <td className="role-cell">
        <span className={roleConfig.class}>
          <i className={`bi ${roleConfig.icon}`}></i>
          {roleConfig.label}
        </span>
      </td>
      <td className="status-cell">
        <div className="status-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={!user.isDeleted}
              onChange={() => onToggleStatus(user)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span
            className={`status-text ${user.isDeleted ? "inactive" : "active"}`}
          >
            {user.isDeleted ? "Inactive" : "Active"}
          </span>
        </div>
      </td>
      <td className="date-cell">
        <i className="bi bi-calendar3"></i>
        <span>
          {new Date(user.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </td>
      <td className="actions-cell">
        <button
          className="action-btn analytics"
          onClick={() => onViewAnalytics(user)}
          title="View Analytics"
        >
          <i className="bi bi-graph-up"></i>
        </button>
        <button
          className="action-btn edit"
          onClick={() => onEdit(user)}
          title="Edit User"
        >
          <i className="bi bi-pencil"></i>
        </button>
        <button
          className="action-btn delete"
          onClick={() => onDelete(user)}
          title="Delete User"
        >
          <i className="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    role: "admin",
  });

  const tokenRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    tokenRef.current = localStorage.getItem("token");
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = tokenRef.current;
    if (!token) return;

    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch users");
      showToast("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      fullname: "",
      email: "",
      password: "",
      role: "admin",
    });
    setSelectedUser(null);
    setError("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");

    try {
      const token = tokenRef.current;
      await axios.post(
        `${API_URL}/create-admin`,
        {
          fullname: formData.fullname,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      await fetchUsers();
      setShowCreateModal(false);
      resetForm();
      showToast("User created successfully", "success");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to create admin";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      fullname: user.fullname || "",
      email: user.email || "",
      role: user.role || "user",
      password: "",
    });
    setError("");
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setActionLoading(true);
    setError("");

    try {
      const token = tokenRef.current;
      await axios.put(
        `${API_URL}/update/${selectedUser._id}`,
        {
          fullname: formData.fullname,
          email: formData.email,
          role: formData.role,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      await fetchUsers();
      setShowEditModal(false);
      resetForm();
      showToast("User updated successfully", "success");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to update user";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setActionLoading(true);

    try {
      const token = tokenRef.current;
      await axios.delete(`${API_URL}/delete/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
      showToast("User deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Failed to delete user",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserStatus = async (user) => {
    setActionLoading(true);
    try {
      const token = tokenRef.current;
      await axios.put(
        `${API_URL}/update/${user._id}`,
        { isDeleted: !user.isDeleted },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await fetchUsers();
      showToast(
        `User ${user.isDeleted ? "activated" : "deactivated"} successfully`,
        "success",
      );
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Failed to update user status",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openAnalytics = (user) => {
    setSelectedUser(user);
    setShowAnalyticsModal(true);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !user.isDeleted) ||
      (statusFilter === "deleted" && user.isDeleted);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    users: users.filter((u) => u.role === "user").length,
    sellers: users.filter((u) => u.role === "seller").length,
    active: users.filter((u) => !u.isDeleted).length,
    deleted: users.filter((u) => u.isDeleted).length,
    totalSpending: users.reduce(
      (sum, u) => sum + (u.stats?.totalSpending || 0),
      0,
    ),
    totalOrders: users.reduce((sum, u) => sum + (u.stats?.totalOrders || 0), 0),
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="admin-users">
        <div className="loading-container">
          <div className="gold-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="users-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="header-badge">
              <i className="bi bi-people-fill"></i>
              <span>User Management</span>
            </div>
            <h1 className="page-title">Manage Users</h1>
            <p className="page-subtitle">View and manage all platform users</p>
          </div>
          <button
            className="btn-primary-gold"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-plus-circle"></i>
            Create New User
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid-premium">
          <StatCard
            title="Total Users"
            value={stats.total}
            icon="bi-people-fill"
            color="primary"
          />
          <StatCard
            title="Active Users"
            value={stats.active}
            icon="bi-check-circle-fill"
            color="success"
          />
          <StatCard
            title="Admins"
            value={stats.admins}
            icon="bi-shield-lock-fill"
            color="danger"
          />
          <StatCard
            title="Sellers"
            value={stats.sellers}
            icon="bi-shop"
            color="warning"
          />
          <StatCard
            title="Regular Users"
            value={stats.users}
            icon="bi-person"
            color="info"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon="bi-bag-check"
            color="primary"
          />
          <StatCard
            title="Total Spending"
            value={formatCurrency(stats.totalSpending)}
            icon="bi-currency-dollar"
            color="success"
          />
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="seller">Seller</option>
            <option value="user">User</option>
          </select>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="deleted">Deleted</option>
          </select>
          <button className="reset-btn" onClick={fetchUsers}>
            <i className="bi bi-arrow-repeat"></i>
            Refresh
          </button>
        </div>

        {/* Users Table */}
        <div className="users-card">
          {error ? (
            <div className="error-container">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <p>{error}</p>
              <button className="btn-primary-gold" onClick={fetchUsers}>
                Try Again
              </button>
            </div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th style={{ width: "60px" }}>#</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Quick Stats</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined & Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <UserRow
                        key={user._id}
                        user={user}
                        index={index}
                        onEdit={openEdit}
                        onDelete={openDelete}
                        onToggleStatus={toggleUserStatus}
                        onViewAnalytics={openAnalytics}
                      />
                    ))
                  ) : (
                    <tr className="empty-row">
                      <td colSpan="8" className="empty-table-cell">
                        <i className="bi bi-inbox"></i>
                        <h5>No users found</h5>
                        <p>Try adjusting your filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowCreateModal(false);
            resetForm();
          }}
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-person-plus-fill"></i>
                Create New User
              </h5>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label>
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    name="fullname"
                    className="form-input"
                    placeholder="Enter full name"
                    value={formData.fullname}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Email <span className="required">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    className="form-input"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Password <span className="required">*</span>
                  </label>
                  <input
                    name="password"
                    type="password"
                    className="form-input"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                  />
                  <small className="form-hint">Minimum 6 characters</small>
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select
                    name="role"
                    className="form-select"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="admin">Admin</option>
                    <option value="seller">Seller</option>
                    <option value="user">User</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <span className="spinner"></span>
                  ) : (
                    "Create User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowEditModal(false);
            resetForm();
          }}
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-pencil-square"></i>
                Edit User
              </h5>
              <button
                className="modal-close"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    name="fullname"
                    className="form-input"
                    value={formData.fullname}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    name="email"
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select
                    name="role"
                    className="form-select"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="admin">Admin</option>
                    <option value="seller">Seller</option>
                    <option value="user">User</option>
                  </select>
                </div>

                <div className="info-alert info">
                  <i className="bi bi-info-circle-fill"></i>
                  <div>
                    Password cannot be changed here. Use "Forgot Password" flow.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-success"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <span className="spinner"></span>
                  ) : (
                    "Update User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-danger">
              <h5 className="modal-title">
                <i className="bi bi-exclamation-triangle-fill"></i>
                Confirm Delete
              </h5>
              <button
                className="modal-close"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this user?</p>
              <div className="info-card">
                <div className="info-row">
                  <span>Name:</span>
                  <strong>{selectedUser.fullname}</strong>
                </div>
                <div className="info-row">
                  <span>Email:</span>
                  <strong>{selectedUser.email}</strong>
                </div>
                <div className="info-row">
                  <span>Role:</span>
                  <strong>{selectedUser.role}</strong>
                </div>
              </div>
              <div className="alert-danger">
                <i className="bi bi-exclamation-circle-fill"></i>
                <div>This action cannot be undone.</div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <span className="spinner"></span>
                ) : (
                  "Yes, Delete User"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && selectedUser && (
        <UserAnalyticsModal
          user={selectedUser}
          onClose={() => {
            setShowAnalyticsModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminUsers;
