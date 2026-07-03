"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./SellerDashboard.css";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SellerDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
    lowStockProducts: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [salesData, setSalesData] = useState({
    labels: DAY_LABELS,
    values: [0, 0, 0, 0, 0, 0, 0],
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setUser(data.user);
          setStats((prev) => ({
            ...prev,
            averageRating: data.user.averageRating ?? 0,
            totalReviews: data.user.numReviews ?? 0,
          }));
        } else {
          localStorage.removeItem("token");
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        showToast("Failed to load user data", "error");
      }
    };

    fetchUser();
  }, [router]);

  // ─── Products ──────────────────────────────────────────────────────────────

  const fetchSellerProducts = useCallback(async (token) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/my-products`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.ok) return;

      const data = await response.json();
      const products = data.products || [];

      setStats((prev) => ({
        ...prev,
        totalProducts: products.length,
        lowStockProducts: products.filter((p) => p.stock > 0 && p.stock < 5)
          .length,
      }));

      const sorted = [...products].sort((a, b) => b.stock - a.stock);
      setTopProducts(
        sorted.slice(0, 5).map((p) => ({
          _id: p._id,
          name: p.name,
          stock: p.stock,
          price: p.finalPrice ?? p.price,
          sales: 0,
          revenue: 0,
        })),
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }, []);

  // ─── Orders ────────────────────────────────────────────────────────────────

  const fetchSellerOrders = useCallback(async (token, sellerId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/seller`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.ok) {
        console.log("No orders found, using demo data");
        return;
      }

      const data = await response.json();
      const orders = data.orders || [];

      const todayMidnight = new Date().setHours(0, 0, 0, 0);
      let totalRevenue = 0;
      let todayRevenue = 0;
      let pendingOrdersCount = 0;

      const productSalesMap = {};
      const weekSales = [0, 0, 0, 0, 0, 0, 0];
      const activities = [];

      orders.forEach((order) => {
        // Filter seller items - try multiple possible field names
        const sellerItems =
          order.orderItems?.filter((item) => {
            // Check for seller ID in different possible locations
            const itemSellerId =
              item.seller?._id?.toString() ||
              item.seller?.toString() ||
              item.sellerId?.toString();

            return itemSellerId === sellerId;
          }) || [];

        sellerItems.forEach((item) => {
          const itemRevenue = (item.price || 0) * (item.quantity || 0);
          totalRevenue += itemRevenue;

          if (
            new Date(order.createdAt).setHours(0, 0, 0, 0) === todayMidnight
          ) {
            todayRevenue += itemRevenue;
          }

          const dayIdx = new Date(order.createdAt).getDay();
          weekSales[dayIdx] += itemRevenue;

          const pid = item.product?._id?.toString() || item.product?.toString();
          if (pid) {
            if (!productSalesMap[pid]) {
              productSalesMap[pid] = { sales: 0, revenue: 0 };
            }
            productSalesMap[pid].sales += item.quantity || 0;
            productSalesMap[pid].revenue += itemRevenue;
          }
        });

        // Count pending orders for this seller
        if (sellerItems.length > 0) {
          const hasPending = sellerItems.some(
            (item) =>
              item.orderStatus === "pending" || item.status === "pending",
          );
          if (hasPending) pendingOrdersCount++;

          // Add activity for order
          const orderStatus =
            sellerItems[0]?.orderStatus || sellerItems[0]?.status || "pending";
          activities.push({
            type: "order",
            description: `Order #${order._id.slice(-6).toUpperCase()} - ${orderStatus}`,
            time: timeAgo(order.createdAt),
            status:
              orderStatus === "delivered"
                ? "success"
                : orderStatus === "cancelled"
                  ? "danger"
                  : "pending",
          });
        }
      });

      setStats((prev) => ({
        ...prev,
        totalOrders: orders.length,
        pendingOrders: pendingOrdersCount,
        totalRevenue,
        todayRevenue,
      }));

      setSalesData({ labels: DAY_LABELS, values: weekSales });

      // Enrich top products with real sales data
      setTopProducts((prev) =>
        prev.map((p) => {
          const pid = p._id?.toString();
          const agg = productSalesMap[pid];
          return agg ? { ...p, sales: agg.sales, revenue: agg.revenue } : p;
        }),
      );

      // Recent orders (last 5) - IMPROVED VERSION
      const filteredOrders = orders.filter((order) => {
        // Only include orders that have items belonging to this seller
        const hasSellerItems = order.orderItems?.some((item) => {
          const itemSellerId =
            item.seller?._id?.toString() ||
            item.seller?.toString() ||
            item.sellerId?.toString();
          return itemSellerId === sellerId;
        });
        return hasSellerItems;
      });

      setRecentOrders(
        filteredOrders.slice(0, 5).map((order) => {
          // Get only seller's items from this order
          const sellerItems =
            order.orderItems?.filter((item) => {
              const itemSellerId =
                item.seller?._id?.toString() ||
                item.seller?.toString() ||
                item.sellerId?.toString();
              return itemSellerId === sellerId;
            }) || [];

          // Calculate total for seller's items only
          const orderTotal = sellerItems.reduce(
            (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
            0,
          );

          // Get status from first seller item
          const orderStatus =
            sellerItems[0]?.orderStatus || sellerItems[0]?.status || "pending";

          // Get customer name from multiple possible fields
          const customerName =
            order.user?.fullname ||
            order.user?.name ||
            order.customerName ||
            "Customer";

          return {
            id: order._id,
            orderNumber: order.orderNumber || order._id.slice(-8).toUpperCase(),
            customer: customerName,
            items: sellerItems.reduce(
              (sum, item) => sum + (item.quantity || 0),
              0,
            ),
            total: orderTotal,
            status: orderStatus,
            date: new Date(order.createdAt).toLocaleDateString(),
          };
        }),
      );

      setRecentActivities(activities.slice(0, 8));
    } catch (error) {
      console.error("Error fetching orders:", error);
      setSalesData({ labels: DAY_LABELS, values: [0, 0, 0, 0, 0, 0, 0] });
      setRecentActivities([]);
    }
  }, []);

  // ─── Reviews ───────────────────────────────────────────────────────────────

  const fetchSellerReviews = useCallback(async (token, sellerId) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reviews/User/${sellerId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.ok) return;

      const data = await response.json();
      const reviews = data.reviews || [];

      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
            reviews.length
          : 0;

      setStats((prev) => ({
        ...prev,
        totalReviews: reviews.length,
        averageRating: avgRating,
      }));

      setRecentReviews(
        reviews.slice(0, 5).map((review) => ({
          id: review._id,
          product: review.product?.name || "Seller review",
          customer: review.reviewerId?.fullname || "Customer",
          rating: review.rating || 0,
          comment: review.comment || "No comment provided",
          date: new Date(review.createdAt).toLocaleDateString(),
          createdAt: review.createdAt,
        })),
      );

      // Add review activities
      const reviewActivities = reviews.slice(0, 5).map((r) => ({
        type: "review",
        description: `${r.reviewerId?.fullname || "Someone"} left a ${r.rating}★ review`,
        time: timeAgo(r.createdAt),
        status:
          r.rating >= 4 ? "success" : r.rating >= 3 ? "pending" : "danger",
      }));

      setRecentActivities((prev) => {
        const combined = [...reviewActivities, ...prev]
          .sort((a, b) => {
            // Sort by time (assuming timeAgo strings might not sort well)
            // Keep original order as fallback
            return 0;
          })
          .slice(0, 8);
        return combined;
      });
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }, []);

  // ─── Orchestrate all fetches once user is ready ────────────────────────────

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      await Promise.all([
        fetchSellerProducts(token),
        fetchSellerOrders(token, user.id),
        fetchSellerReviews(token, user.id),
      ]);
      setLoading(false);
    };

    loadData();
  }, [user, fetchSellerProducts, fetchSellerOrders, fetchSellerReviews]);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const timeAgo = (dateString) => {
    if (!dateString) return "just now";
    const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);

  const renderStars = (rating) => {
    const clamped = Math.max(0, Math.min(5, rating || 0));
    const full = Math.floor(clamped);
    const half = clamped % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);

    return (
      <div className="stars-container">
        {[...Array(full)].map((_, i) => (
          <i key={`f${i}`} className="bi bi-star-fill"></i>
        ))}
        {half && <i className="bi bi-star-half"></i>}
        {[...Array(empty)].map((_, i) => (
          <i key={`e${i}`} className="bi bi-star"></i>
        ))}
        <span className="rating-value">{clamped.toFixed(1)}</span>
      </div>
    );
  };

  const getActivityIcon = (type, status) => {
    if (type === "order") {
      if (status === "success") return "bi bi-check-circle-fill";
      if (status === "danger") return "bi bi-x-circle-fill";
      return "bi bi-cart-check";
    }
    if (type === "review") {
      if (status === "success") return "bi bi-star-fill";
      if (status === "danger") return "bi bi-star";
      return "bi bi-chat-dots";
    }
    return "bi bi-bell";
  };

  const getActivityIconColor = (status) => {
    if (status === "success") return "success";
    if (status === "danger") return "danger";
    return "pending";
  };

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="gold-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="seller-dashboard">
      {toast && (
        <div className={`dashboard-toast dashboard-toast-${toast.type}`}>
          <i
            className={`bi bi-${
              toast.type === "success"
                ? "check-circle-fill"
                : "exclamation-circle-fill"
            }`}
          ></i>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="toast-close-btn">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <div className="greeting-badge">
              <i className="bi bi-shop"></i>
              <span>Seller Dashboard</span>
            </div>
            <h2 className="dashboard-title">
              Welcome back, <span className="gold-text">{user?.fullname}</span>
            </h2>
            <p className="dashboard-subtitle">
              Here's what's happening with your store today.
            </p>
          </div>
          <div className="header-actions">
            <Link href="/seller/products/add" className="btn-primary-gold">
              <i className="bi bi-plus-circle"></i>
              <span>Add Product</span>
            </Link>
            <Link href="/seller/orders" className="btn-outline-gold">
              <i className="bi bi-box-seam"></i>
              <span>View Orders</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon revenue">
              <i className="bi bi-currency-dollar"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">
                {formatCurrency(stats.totalRevenue)}
              </h3>
              <p className="stat-label">Total Revenue</p>
              <div className="stat-trend positive">
                <i className="bi bi-arrow-up-short"></i>
                <span>{formatCurrency(stats.todayRevenue)} today</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orders">
              <i className="bi bi-cart-check"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stats.totalOrders}</h3>
              <p className="stat-label">Total Orders</p>
              <div className="stat-trend pending">
                <i className="bi bi-clock-history"></i>
                <span>{stats.pendingOrders} pending</span>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon products">
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stats.totalProducts}</h3>
              <p className="stat-label">Products</p>
              {stats.lowStockProducts > 0 && (
                <div className="stat-trend warning">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{stats.lowStockProducts} low stock</span>
                </div>
              )}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon reviews">
              <i className="bi bi-star-fill"></i>
            </div>
            <div className="stat-content">
              <div className="rating-display">
                <h3 className="stat-value">{stats.averageRating.toFixed(1)}</h3>
                <div className="rating-stars">
                  {renderStars(stats.averageRating)}
                </div>
              </div>
              <p className="stat-label">Seller Rating</p>
              <div className="stat-trend">
                <i className="bi bi-chat-dots"></i>
                <span>
                  {stats.totalReviews} review
                  {stats.totalReviews !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="dashboard-row">
          <div className="dashboard-col large">
            <div className="dashboard-card mw-same">
              <div className="card-header">
                <h5 className="card-title">
                  <i className="bi bi-graph-up"></i>
                  Weekly Sales
                </h5>
                <div className="card-header-decoration"></div>
              </div>
              <div className="card-body">
                {salesData.values.some((v) => v > 0) ? (
                  <div className="sales-chart">
                    {salesData.labels.map((label, index) => {
                      const maxValue = Math.max(...salesData.values, 1);
                      const height = (salesData.values[index] / maxValue) * 180;
                      return (
                        <div key={label} className="chart-bar-container">
                          <div
                            className="chart-bar"
                            style={{ height: `${height}px` }}
                          >
                            {salesData.values[index] > 0 && (
                              <span className="chart-value">
                                ${salesData.values[index].toFixed(0)}
                              </span>
                            )}
                          </div>
                          <span className="chart-label">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-chart">
                    <i className="bi bi-bar-chart-steps"></i>
                    <p>No sales data available</p>
                    <span>
                      Orders will appear here once you make your first sale
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-col small">
            <div className="dashboard-card mw-same">
              <div className="card-header">
                <h5 className="card-title">
                  <i className="bi bi-activity"></i>
                  Recent Activity
                </h5>
                <div className="card-header-decoration"></div>
              </div>
              <div className="card-body">
                <div className="activity-timeline">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div key={index} className="activity-item">
                        <div
                          className={`activity-icon ${getActivityIconColor(activity.status)}`}
                        >
                          <i
                            className={getActivityIcon(
                              activity.type,
                              activity.status,
                            )}
                          ></i>
                        </div>
                        <div className="activity-content">
                          <p>{activity.description}</p>
                          <span className="activity-time">{activity.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-activity">
                      <i className="bi bi-inbox"></i>
                      <p>No recent activity</p>
                      <span>New orders and reviews will appear here</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="dashboard-card full-width">
          <div className="card-header">
            <h5 className="card-title">
              <i className="bi bi-receipt"></i>
              Recent Orders
            </h5>
            <Link href="/seller/orders" className="view-all-link">
              View All <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
          <div className="card-body no-padding">
            {recentOrders.length > 0 ? (
              <div className="dashboard-table-container">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="order-number">{order.orderNumber}</td>
                        <td>{order.customer}</td>
                        <td>{order.items}</td>
                        <td className="gold-text">
                          {formatCurrency(order.total)}
                        </td>
                        <td>
                          <span className={`status-badge ${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{order.date}</td>
                        <td>
                          <Link
                            href={`/seller/orders/${order.id}`}
                            className="table-action-btn"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-table">
                <i className="bi bi-inbox"></i>
                <p>No orders yet</p>
                <span>When customers place orders, they'll appear here</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="dashboard-row">
          <div className="dashboard-col half">
            <div className="dashboard-card">
              <div className="card-header">
                <h5 className="card-title">
                  <i className="bi bi-trophy-fill"></i>
                  Top Products
                </h5>
                <Link href="/seller/products" className="view-all-link">
                  View All <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
              <div className="card-body no-padding">
                {topProducts.length > 0 ? (
                  <div className="dashboard-table-container">
                    <table className="dashboard-table compact">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Units Sold</th>
                          <th>Revenue</th>
                          <th>Stock</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((product) => (
                          <tr key={product._id}>
                            <td className="product-name">{product.name}</td>
                            <td>{product.sales || 0}</td>
                            <td className="gold-text">{product.rating || 0}</td>
                            <td>
                              <span
                                className={`stock-badge ${
                                  product.stock === 0
                                    ? "out"
                                    : product.stock < 5
                                      ? "low"
                                      : "good"
                                }`}
                              >
                                {product.stock === 0
                                  ? "Out of stock"
                                  : `${product.stock} units`}
                              </span>
                            </td>
                            <td>
                              <Link
                                href={`/seller/products/${product._id}`}
                                className="table-action-btn"
                              >
                                Edit
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-table">
                    <i className="bi bi-box"></i>
                    <p>No products yet</p>
                    <span>Add your first product to get started</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-col half">
            <div className="dashboard-card">
              <div className="card-header">
                <h5 className="card-title">
                  <i className="bi bi-chat-dots-fill"></i>
                  Recent Reviews
                </h5>
                <Link href="/seller/reviews" className="view-all-link">
                  View All <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
              <div className="card-body">
                <div className="reviews-list">
                  {recentReviews.length > 0 ? (
                    recentReviews.map((review) => (
                      <div key={review.id} className="review-item">
                        <div className="review-avatar">
                          <i className="bi bi-person-circle"></i>
                        </div>
                        <div className="review-content">
                          <div className="review-header">
                            <div>
                              <span className="reviewer-name">
                                {review.customer}
                              </span>
                              {review.product &&
                                review.product !== "Seller review" && (
                                  <span className="review-product">
                                    on <strong>{review.product}</strong>
                                  </span>
                                )}
                            </div>
                            <span className="review-date">{review.date}</span>
                          </div>
                          <div className="review-rating">
                            {renderStars(review.rating)}
                          </div>
                          <p className="review-comment">"{review.comment}"</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-reviews">
                      <i className="bi bi-chat-dots"></i>
                      <p>No reviews yet</p>
                      <span>
                        When customers review you, they'll appear here
                      </span>
                    </div>
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

export default SellerDashboard;
