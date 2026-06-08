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
          setUser(data.user);
          // Seed rating from auth response immediately so stats card isn't blank
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

      // Sort by stock desc as a proxy for popularity; no random values
      const sorted = [...products].sort((a, b) => b.stock - a.stock);
      setTopProducts(
        sorted.slice(0, 5).map((p) => ({
          _id: p._id,
          name: p.name,
          stock: p.stock,
          price: p.finalPrice ?? p.price,
          // Real sales/revenue will be filled in by fetchSellerOrders
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
        generateMockData();
        return;
      }

      const data = await response.json();
      const orders = data.orders || [];

      const todayMidnight = new Date().setHours(0, 0, 0, 0);
      let totalRevenue = 0;
      let todayRevenue = 0;
      const pendingOrders = orders.filter((o) =>
        o.orderItems?.some(
          (item) =>
            item.seller?._id?.toString() === sellerId &&
            item.orderStatus === "pending",
        ),
      ).length;

      // Per-product sales accumulator for top-products enrichment
      const productSalesMap = {}; // productId → { sales, revenue }

      // Weekly sales (indexed Sun=0 … Sat=6)
      const weekSales = [0, 0, 0, 0, 0, 0, 0];

      // Recent-activity feed built from orders
      const activities = [];

      orders.forEach((order) => {
        const sellerItems =
          order.orderItems?.filter(
            (item) => item.seller?._id?.toString() === sellerId,
          ) || [];

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
            if (!productSalesMap[pid])
              productSalesMap[pid] = { sales: 0, revenue: 0 };
            productSalesMap[pid].sales += item.quantity || 0;
            productSalesMap[pid].revenue += itemRevenue;
          }
        });

        if (sellerItems.length > 0) {
          const status = sellerItems[0].orderStatus || "pending";
          activities.push({
            type: "order",
            description: `Order #${order._id.slice(-6).toUpperCase()} — ${status}`,
            time: timeAgo(order.createdAt),
            status:
              status === "delivered"
                ? "success"
                : status === "cancelled"
                  ? "danger"
                  : "pending",
          });
        }
      });

      setStats((prev) => ({
        ...prev,
        totalOrders: orders.length,
        pendingOrders,
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

      // Recent orders (last 5)
      setRecentOrders(
        orders.slice(0, 5).map((order) => {
          const sellerItems =
            order.orderItems?.filter(
              (item) => item.seller?._id?.toString() === sellerId,
            ) || [];
          const orderTotal = sellerItems.reduce(
            (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
            0,
          );
          return {
            id: order._id,
            orderNumber: order._id.slice(-8).toUpperCase(),
            customer: order.user?.fullname || "Customer",
            items: sellerItems.length,
            total: orderTotal,
            status: sellerItems[0]?.orderStatus || "pending",
            date: new Date(order.createdAt).toLocaleDateString(),
          };
        }),
      );

      // Activity feed (latest 5)
      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      console.error("Error fetching orders:", error);
      generateMockData();
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

      // Compute average from fetched reviews (more accurate than cached user field)
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
          // reviewTarget on seller reviews is typically the seller, not a product
          product: review.product?.name || "Seller review",
          customer: review.reviewerId?.fullname || "Customer",
          rating: review.rating || 0,
          comment: review.comment || "No comment provided",
          date: new Date(review.createdAt).toLocaleDateString(),
        })),
      );

      // Merge review activities into the feed
      const reviewActivities = reviews.slice(0, 3).map((r) => ({
        type: "review",
        description: `${r.reviewerId?.fullname || "Someone"} left you a ${r.rating}★ review`,
        time: timeAgo(r.createdAt),
        status:
          r.rating >= 4 ? "success" : r.rating >= 3 ? "pending" : "danger",
      }));

      setRecentActivities((prev) => {
        const combined = [...reviewActivities, ...prev]
          .sort((a, b) => 0) // keep insertion order; already sorted newest-first
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

  const generateMockData = () => {
    setRecentOrders((prev) =>
      prev.length
        ? prev
        : [
            {
              id: "mock-1",
              orderNumber: "ORD-DEMO01",
              customer: "Sample Customer",
              items: 2,
              total: 79.99,
              status: "pending",
              date: new Date().toLocaleDateString(),
            },
          ],
    );

    setTopProducts((prev) =>
      prev.length
        ? prev
        : [
            {
              _id: "mock-1",
              name: "Sample Product",
              sales: 0,
              revenue: 0,
              stock: 10,
              price: 0,
            },
          ],
    );

    setRecentActivities((prev) =>
      prev.length
        ? prev
        : [
            {
              type: "order",
              description: "Welcome to your seller dashboard",
              time: "Just now",
              status: "success",
            },
          ],
    );
  };

  const timeAgo = (dateString) => {
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

  const activityIcon = (type) => {
    if (type === "order") return "cart-check";
    if (type === "review") return "star";
    return "gift";
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
            <h1 className="dashboard-title">
              Welcome back,{" "}
              <span className="gold-text">
                {user?.fullname?.split(" ")[0] || "Seller"}
              </span>
            </h1>
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
            <div className="dashboard-card">
              <div className="card-header">
                <h5 className="card-title">
                  <i className="bi bi-graph-up"></i>
                  Weekly Sales
                </h5>
                <div className="card-header-decoration"></div>
              </div>
              <div className="card-body">
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
              </div>
            </div>
          </div>

          <div className="dashboard-col small">
            <div className="dashboard-card">
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
                        <div className={`activity-icon ${activity.status}`}>
                          <i
                            className={`bi bi-${activityIcon(activity.type)}`}
                          ></i>
                        </div>
                        <div className="activity-content">
                          <p>{activity.description}</p>
                          <span className="activity-time">{activity.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-reviews">
                      <i className="bi bi-activity"></i>
                      <p>No activity yet</p>
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
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No orders yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                      {topProducts.length > 0 ? (
                        topProducts.map((product) => (
                          <tr key={product._id}>
                            <td className="product-name">{product.name}</td>
                            <td>{product.sales}</td>
                            <td className="gold-text">
                              {formatCurrency(product.revenue)}
                            </td>
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
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center">
                            No products yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
                    <div className="no-reviews">
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
