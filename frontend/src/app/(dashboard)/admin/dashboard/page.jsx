"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./AdminDashboard.css";

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
const StatCard = ({ title, value, icon, color, trend }) => {
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
        {trend && (
          <div className={`stat-trend ${trend.direction}`}>
            <i className={`bi bi-arrow-${trend.direction}`}></i>
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
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

// Recent Order Row Component
// Recent Order Row Component
const RecentOrderRow = ({ order }) => {
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        class: "status-badge warning",
        icon: "bi-hourglass-split",
        label: "Pending",
      },
      confirmed: {
        class: "status-badge info",
        icon: "bi-check2-circle",
        label: "Confirmed",
      },
      processing: {
        class: "status-badge info",
        icon: "bi-gear",
        label: "Processing",
      },
      shipped: {
        class: "status-badge primary",
        icon: "bi-truck",
        label: "Shipped",
      },
      out_for_delivery: {
        class: "status-badge primary",
        icon: "bi-bicycle",
        label: "Out for Delivery",
      },
      delivered: {
        class: "status-badge success",
        icon: "bi-check-circle",
        label: "Delivered",
      },
      cancelled: {
        class: "status-badge danger",
        icon: "bi-x-circle",
        label: "Cancelled",
      },
    };
    return (
      configs[status] || {
        class: "status-badge secondary",
        icon: "bi-question-circle",
        label: status,
      }
    );
  };

  const config = getStatusConfig(order.orderStatus);
  const user = order.user || {};
  const userName = user.fullname || user.fullName || "Guest";
  const profileImageUrl = getProfileImageUrl(user.profilePicture);

  return (
    <tr>
      <td className="order-id-cell">
        <Link
          href={`/admin/dashboard/orders/${order._id}`}
          className="order-link"
        >
          #{order._id?.slice(-8).toUpperCase()}
        </Link>
      </td>
      <td className="customer-cell">
        <div className="customer-info">
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={userName}
              className="customer-avatar-small"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
                const parent = e.target.parentElement;
                const icon = document.createElement("i");
                icon.className = "bi bi-person-circle";
                icon.style.fontSize = "24px";
                icon.style.color = "var(--gold)";
                parent.insertBefore(icon, e.target);
                e.target.remove();
              }}
            />
          ) : (
            <i className="bi bi-person-circle"></i>
          )}
          <span>{userName}</span>
        </div>
      </td>
      <td className="status-cell">
        <span className={config.class}>
          <i className={`bi ${config.icon}`}></i>
          {config.label}
        </span>
      </td>
      <td className="amount-cell">
        <span className="order-amount">
          ${(order.totalPrice || 0).toFixed(2)}
        </span>
      </td>
      <td className="date-cell">
        <i className="bi bi-calendar3"></i>
        {order.createdAt
          ? new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "N/A"}
      </td>
      {/* <td className="action-cell">
        <Link
          href={`/admin/dashboard/orders/${order._id}`}
          className="view-details-link"
        >
          <i className="bi bi-eye"></i>
          View
        </Link>
      </td> */}
    </tr>
  );
};
// Main Admin Dashboard Component
const AdminDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    categories: 0,
    products: 0,
    pendingOrders: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch(`${backendURL}/admin/dashboard`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
          }
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await res.json();

        if (!data.success) {
          throw new Error("Backend returned unsuccessful response");
        }

        const {
          allUsers = [],
          allOrders = [],
          allCategories = [],
          allProducts = [],
        } = data.items || {};

        // Calculate additional stats
        const pendingOrders = allOrders.filter(
          (o) => o.orderStatus === "pending",
        ).length;

        const totalRevenue = allOrders.reduce(
          (sum, o) => sum + (o.totalPrice || 0),
          0,
        );

        // Set Stats
        setStats({
          users: allUsers.length,
          orders: allOrders.length,
          categories: allCategories.length,
          products: allProducts.length,
          pendingOrders,
          revenue: totalRevenue,
        });

        // Sort latest 5 orders
        const sortedOrders = [...allOrders]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setRecentOrders(sortedOrders);

        // Get recent users (last 5)
        const sortedUsers = [...allUsers]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setRecentUsers(sortedUsers);

        // Get top products (mock for now - would need order items aggregation)
        const productSales = new Map();
        allOrders.forEach((order) => {
          order.orderItems?.forEach((item) => {
            const productId = item.product?._id || item.product;
            const productName = item.name;
            const quantity = item.quantity;
            productSales.set(productId, {
              name: productName,
              sales: (productSales.get(productId)?.sales || 0) + quantity,
              revenue:
                (productSales.get(productId)?.revenue || 0) +
                item.price * quantity,
            });
          });
        });

        const topProductsArray = Array.from(productSales.values())
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5);
        setTopProducts(topProductsArray);
      } catch (error) {
        console.error("Dashboard Error:", error.message);
        showToast("Failed to load dashboard data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [backendURL, router]);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="gold-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="dashboard-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="header-badge">
              <i className="bi bi-shield-lock-fill"></i>
              <span>Admin Portal</span>
            </div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">
              Overview of your e-commerce platform
            </p>
          </div>
          <div className="header-actions">
            <Link href="/admin/dashboard/users" className="btn-outline-gold">
              <i className="bi bi-people-fill"></i>
              Manage Users
            </Link>
            <Link href="/admin/dashboard/orders" className="btn-primary-gold">
              <i className="bi bi-box-seam"></i>
              View All Orders
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid-premium">
          <StatCard
            title="Total Users"
            value={stats.users}
            icon="bi-people-fill"
            color="primary"
          />
          <StatCard
            title="Total Orders"
            value={stats.orders}
            icon="bi-receipt"
            color="info"
          />
          <StatCard
            title="Total Products"
            value={stats.products}
            icon="bi-box-seam"
            color="success"
          />
          <StatCard
            title="Total Categories"
            value={stats.categories}
            icon="bi-tags"
            color="warning"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon="bi-hourglass-split"
            color="danger"
          />
          <StatCard
            title="Revenue"
            value={`$${stats.revenue.toLocaleString()}`}
            icon="bi-currency-dollar"
            color="gold"
          />
        </div>

        {/* Recent Orders Table */}
        <div className="dashboard-card full-width">
          <div className="card-header-custom">
            <h5 className="card-title-custom">
              <i className="bi bi-clock-history"></i>
              Recent Orders
            </h5>
            <Link href="/admin/dashboard/orders" className="view-all-link">
              View All Orders
              <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
          <div className="card-body no-padding">
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Date</th>
                    {/* <th>Action</th> */}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr className="empty-row">
                      <td colSpan="6" className="empty-table-cell">
                        <i className="bi bi-inbox"></i>
                        <span>No recent orders</span>
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <RecentOrderRow key={order._id} order={order} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Row - Recent Users & Top Products */}
        <div className="dashboard-row">
          {/* Recent Users */}
          <div className="dashboard-col half">
            <div className="dashboard-card">
              <div className="card-header-custom">
                <h5 className="card-title-custom">
                  <i className="bi bi-person-plus-fill"></i>
                  New Users
                </h5>
                <Link href="/admin/dashboard/users" className="view-all-link">
                  View All
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
              <div className="card-body">
                <div className="users-list">
                  {recentUsers.length === 0 ? (
                    <div className="empty-state-small">
                      <i className="bi bi-people"></i>
                      <p>No users yet</p>
                    </div>
                  ) : (
                    recentUsers.map((user) => {
                      const profileImageUrl = getProfileImageUrl(
                        user.profilePicture,
                      );
                      const userName = user.fullname || user.fullName || "User";

                      return (
                        <div key={user._id} className="user-item">
                          <div className="user-avatar">
                            {profileImageUrl ? (
                              <img
                                src={profileImageUrl}
                                alt={userName}
                                className="user-avatar-img"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = "none";
                                  const parent = e.target.parentElement;
                                  const icon = document.createElement("i");
                                  icon.className = "bi bi-person-circle";
                                  icon.style.fontSize = "32px";
                                  icon.style.color = "var(--gold)";
                                  parent.appendChild(icon);
                                  e.target.remove();
                                }}
                              />
                            ) : (
                              <i className="bi bi-person-circle"></i>
                            )}
                          </div>
                          <div className="user-info">
                            <div className="user-name">{userName}</div>
                            <div className="user-email">{user.email}</div>
                          </div>
                          <div className="user-role">
                            <span
                              className={`role-badge ${user.role === "admin" ? "admin" : user.role === "seller" ? "seller" : "user"}`}
                            >
                              {user.role || "user"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="dashboard-col half">
            <div className="dashboard-card">
              <div className="card-header-custom">
                <h5 className="card-title-custom">
                  <i className="bi bi-trophy-fill"></i>
                  Top Products
                </h5>
                <Link
                  href="/admin/dashboard/products"
                  className="view-all-link"
                >
                  View All
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
              <div className="card-body">
                <div className="products-list">
                  {topProducts.length === 0 ? (
                    <div className="empty-state-small">
                      <i className="bi bi-box"></i>
                      <p>No product data yet</p>
                    </div>
                  ) : (
                    topProducts.map((product, index) => (
                      <div key={index} className="product-item">
                        <div className="product-rank">
                          <span
                            className={`rank-badge ${index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : ""}`}
                          >
                            #{index + 1}
                          </span>
                        </div>
                        <div className="product-info">
                          <div className="product-name">{product.name}</div>
                          <div className="product-stats">
                            <span>
                              <i className="bi bi-cart"></i>
                              {product.sales} sold
                            </span>
                            <span>
                              <i className="bi bi-currency-dollar"></i>$
                              {product.revenue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
