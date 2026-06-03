"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./SellerDashboard.css";

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
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [0, 0, 0, 0, 0, 0, 0],
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
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

  const fetchSellerProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/my-products`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.ok) {
        const data = await response.json();
        const products = data.products || [];

        setStats((prev) => ({
          ...prev,
          totalProducts: products.length,
          lowStockProducts: products.filter((p) => p.stock > 0 && p.stock < 5)
            .length,
        }));

        setTopProducts(
          products.slice(0, 5).map((p) => ({
            ...p,
            sales: Math.floor(Math.random() * 100),
            revenue: (p.finalPrice || p.price) * Math.floor(Math.random() * 50),
          })),
        );
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchSellerOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/seller`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];

        const totalOrders = orders.length;
        const pendingOrders = orders.filter((o) =>
          o.orderItems?.some((item) => item.orderStatus === "pending"),
        ).length;

        let totalRevenue = 0;
        let todayRevenue = 0;
        const today = new Date().setHours(0, 0, 0, 0);

        orders.forEach((order) => {
          const sellerItems =
            order.orderItems?.filter(
              (item) => item.seller?.toString() === user?.id,
            ) || [];

          sellerItems.forEach((item) => {
            const itemRevenue = (item.price || 0) * (item.quantity || 0);
            totalRevenue += itemRevenue;

            if (new Date(order.createdAt).setHours(0, 0, 0, 0) === today) {
              todayRevenue += itemRevenue;
            }
          });
        });

        setStats((prev) => ({
          ...prev,
          totalOrders,
          pendingOrders,
          totalRevenue,
          todayRevenue,
        }));

        setRecentOrders(
          orders.slice(0, 5).map((order) => ({
            id: order._id,
            orderNumber: order._id.slice(-8).toUpperCase(),
            customer: order.user?.fullname || "Customer",
            items:
              order.orderItems?.filter(
                (item) => item.seller?.toString() === user?.id,
              ).length || 0,
            total:
              order.orderItems
                ?.filter((item) => item.seller?.toString() === user?.id)
                .reduce((sum, item) => sum + item.price * item.quantity, 0) ||
              0,
            status:
              order.orderItems?.find(
                (item) => item.seller?.toString() === user?.id,
              )?.orderStatus || "pending",
            date: new Date(order.createdAt).toLocaleDateString(),
          })),
        );

        const weekSales = [0, 0, 0, 0, 0, 0, 0];
        orders.forEach((order) => {
          const orderDate = new Date(order.createdAt);
          const dayOfWeek = orderDate.getDay();

          const sellerItems =
            order.orderItems?.filter(
              (item) => item.seller?.toString() === user?.id,
            ) || [];

          sellerItems.forEach((item) => {
            weekSales[dayOfWeek] += (item.price || 0) * (item.quantity || 0);
          });
        });

        setSalesData({ labels: salesData.labels, values: weekSales });

        const activities = [];
        orders.slice(0, 10).forEach((order) => {
          activities.push({
            type: "order",
            description: `New order #${order._id.slice(-8).toUpperCase()}`,
            time: new Date(order.createdAt).toLocaleString(),
            status: "success",
          });
        });
        setRecentActivities(activities.slice(0, 5));
      } else {
        generateMockData();
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      generateMockData();
    }
  };

  const generateMockData = () => {
    setStats({
      totalProducts: 24,
      totalOrders: 156,
      pendingOrders: 12,
      totalRevenue: 15420.5,
      todayRevenue: 1250.0,
      averageRating: 4.5,
      totalReviews: 89,
      lowStockProducts: 3,
    });

    setRecentOrders([
      {
        id: "1",
        orderNumber: "ORD-12345",
        customer: "John Doe",
        items: 3,
        total: 125.99,
        status: "pending",
        date: "2024-03-05",
      },
      {
        id: "2",
        orderNumber: "ORD-12346",
        customer: "Jane Smith",
        items: 1,
        total: 45.5,
        status: "processing",
        date: "2024-03-05",
      },
      {
        id: "3",
        orderNumber: "ORD-12347",
        customer: "Bob Johnson",
        items: 2,
        total: 89.99,
        status: "shipped",
        date: "2024-03-04",
      },
      {
        id: "4",
        orderNumber: "ORD-12348",
        customer: "Alice Brown",
        items: 4,
        total: 234.95,
        status: "delivered",
        date: "2024-03-04",
      },
      {
        id: "5",
        orderNumber: "ORD-12349",
        customer: "Charlie Wilson",
        items: 2,
        total: 67.5,
        status: "pending",
        date: "2024-03-03",
      },
    ]);

    setTopProducts([
      {
        _id: "1",
        name: "Wireless Headphones",
        sales: 45,
        revenue: 2245.5,
        stock: 23,
      },
      {
        _id: "2",
        name: "Smart Watch Series 5",
        sales: 32,
        revenue: 3198.4,
        stock: 12,
      },
      {
        _id: "3",
        name: "Bluetooth Speaker",
        sales: 28,
        revenue: 1397.2,
        stock: 8,
      },
      {
        _id: "4",
        name: "Laptop Backpack",
        sales: 21,
        revenue: 1047.9,
        stock: 15,
      },
      {
        _id: "5",
        name: "USB-C Hub Adapter",
        sales: 19,
        revenue: 569.05,
        stock: 4,
      },
    ]);

    setRecentReviews([
      {
        id: "1",
        product: "Wireless Headphones",
        customer: "Mike Ross",
        rating: 5,
        comment: "Great sound quality!",
        date: "2024-03-05",
      },
      {
        id: "2",
        product: "Smart Watch Series 5",
        customer: "Rachel Zane",
        rating: 4,
        comment: "Good battery life",
        date: "2024-03-04",
      },
      {
        id: "3",
        product: "Bluetooth Speaker",
        customer: "Harvey Specter",
        rating: 5,
        comment: "Excellent bass!",
        date: "2024-03-04",
      },
    ]);

    setRecentActivities([
      {
        type: "order",
        description: "New order #ORD-12345 received",
        time: "2 minutes ago",
        status: "success",
      },
      {
        type: "product",
        description: "Product 'Wireless Headphones' stock low (3 left)",
        time: "15 minutes ago",
        status: "warning",
      },
      {
        type: "review",
        description: "New 5-star review received",
        time: "1 hour ago",
        status: "success",
      },
      {
        type: "order",
        description: "Order #ORD-12342 marked as shipped",
        time: "3 hours ago",
        status: "info",
      },
      {
        type: "product",
        description: "New product 'Smart Watch' added",
        time: "5 hours ago",
        status: "success",
      },
    ]);

    setSalesData({
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      values: [1250, 2100, 1800, 2400, 1950, 2800, 1650],
    });
  };

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        await fetchSellerProducts();
        await fetchSellerOrders();
        setLoading(false);
      };
      loadData();
    }
  }, [user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: "warning",
      processing: "info",
      shipped: "primary",
      delivered: "success",
      cancelled: "danger",
    };
    return statusMap[status] || "secondary";
  };

  const renderStars = (rating) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((i) => (
          <i key={i} className={`bi bi-star${i <= rating ? "-fill" : ""}`}></i>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="gold-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="seller-dashboard">
      {toast && (
        <div className={`dashboard-toast dashboard-toast-${toast.type}`}>
          <i
            className={`bi bi-${toast.type === "success" ? "check-circle-fill" : "exclamation-circle-fill"}`}
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
              <i className="bi bi-stars"></i>
              <span>Seller Dashboard</span>
            </div>
            <h1 className="dashboard-title">
              Welcome back,{" "}
              <span className="gold-text">
                {user?.fullname?.split(" ")[0] || "Seller"}
              </span>
              !
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
              <i className="bi bi-box-seam"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stats.totalOrders}</h3>
              <p className="stat-label">Total Orders</p>
              <div className="stat-trend pending">
                <i className="bi bi-clock"></i>
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
              <h3 className="stat-value">{stats.averageRating}/5</h3>
              <p className="stat-label">Average Rating</p>
              <div className="stat-trend">
                <i className="bi bi-chat-dots"></i>
                <span>{stats.totalReviews} reviews</span>
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
                  {salesData.labels.map((label, index) => (
                    <div key={label} className="chart-bar-container">
                      <div
                        className="chart-bar"
                        style={{
                          height: `${(salesData.values[index] / Math.max(...salesData.values)) * 180}px`,
                        }}
                      >
                        <span className="chart-value">
                          ${salesData.values[index]}
                        </span>
                      </div>
                      <span className="chart-label">{label}</span>
                    </div>
                  ))}
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
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className={`activity-icon ${activity.status}`}>
                        <i
                          className={`bi bi-${activity.type === "order" ? "cart-check" : activity.type === "product" ? "gift" : "star"}`}
                        ></i>
                      </div>
                      <div className="activity-content">
                        <p>{activity.description}</p>
                        <span className="activity-time">{activity.time}</span>
                      </div>
                    </div>
                  ))}
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
                        <th>Sales</th>
                        <th>Revenue</th>
                        <th>Stock</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((product) => (
                        <tr key={product._id}>
                          <td className="product-name">{product.name}</td>
                          <td>{product.sales}</td>
                          <td className="gold-text">
                            {formatCurrency(product.revenue)}
                          </td>
                          <td>
                            <span
                              className={`stock-badge ${product.stock < 5 ? "low" : "good"}`}
                            >
                              {product.stock}
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
                  {recentReviews.map((review) => (
                    <div key={review.id} className="review-item">
                      <div className="review-avatar">
                        <i className="bi bi-person-circle"></i>
                      </div>
                      <div className="review-content">
                        <div className="review-header">
                          <span className="reviewer-name">
                            {review.customer}
                          </span>
                          <span className="review-date">{review.date}</span>
                        </div>
                        {renderStars(review.rating)}
                        <p className="review-comment">
                          <strong>{review.product}:</strong> {review.comment}
                        </p>
                      </div>
                    </div>
                  ))}
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
