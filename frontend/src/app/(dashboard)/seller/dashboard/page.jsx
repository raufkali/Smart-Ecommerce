"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return "bi-check-circle-fill";
      case "error":
        return "bi-exclamation-circle-fill";
      case "warning":
        return "bi-exclamation-triangle-fill";
      case "info":
        return "bi-info-circle-fill";
      default:
        return "bi-bell-fill";
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-success";
      case "error":
        return "bg-danger";
      case "warning":
        return "bg-warning";
      case "info":
        return "bg-info";
      default:
        return "bg-primary";
    }
  };

  return (
    <div
      className={`toast-notification ${getBgColor()} text-white`}
      role="alert"
    >
      <i className={`bi ${getIcon()} me-2`}></i>
      <span className="flex-grow-1">{message}</span>
      <button
        type="button"
        className="btn-close btn-close-white ms-3"
        onClick={onClose}
        aria-label="Close"
      ></button>

      <style jsx>{`
        .toast-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          min-width: 300px;
          max-width: 400px;
          padding: 1rem 1.25rem;
          border-radius: 0.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          z-index: 9999;
          animation: slideIn 0.3s ease forwards;
        }

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

const SellerDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Dashboard data states
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

  // Chart data (simplified for now)
  const [salesData, setSalesData] = useState({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [0, 0, 0, 0, 0, 0, 0],
  });

  // Show toast function
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Close toast function
  const closeToast = () => {
    setToast(null);
  };

  // Fetch user data
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
            headers: {
              Authorization: `Bearer ${token}`,
            },
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

  // Fetch seller's products
  const fetchSellerProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/my-products`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const products = data.products || [];

        // Update stats
        setStats((prev) => ({
          ...prev,
          totalProducts: products.length,
          lowStockProducts: products.filter((p) => p.stock > 0 && p.stock < 5)
            .length,
        }));

        // Set top products (by sales - you'll need to implement this based on your order data)
        setTopProducts(
          products.slice(0, 5).map((p) => ({
            ...p,
            sales: Math.floor(Math.random() * 100), // Placeholder until you have actual sales data
            revenue: (p.finalPrice || p.price) * Math.floor(Math.random() * 50),
          })),
        );
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Fetch seller's orders
  const fetchSellerOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/seller`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];

        // Calculate order stats
        const totalOrders = orders.length;
        const pendingOrders = orders.filter((o) =>
          o.orderItems?.some((item) => item.orderStatus === "pending"),
        ).length;

        // Calculate revenue (only from this seller's items)
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

        // Set recent orders
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

        // Generate sales data for the week
        const weekSales = [0, 0, 0, 0, 0, 0, 0];
        orders.forEach((order) => {
          const orderDate = new Date(order.createdAt);
          const dayOfWeek = orderDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

          const sellerItems =
            order.orderItems?.filter(
              (item) => item.seller?.toString() === user?.id,
            ) || [];

          sellerItems.forEach((item) => {
            weekSales[dayOfWeek] += (item.price || 0) * (item.quantity || 0);
          });
        });

        setSalesData({
          labels: salesData.labels,
          values: weekSales,
        });

        // Generate recent activities
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
        // If endpoint doesn't exist yet, use mock data
        generateMockData();
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      generateMockData();
    }
  };

  // Generate mock data for demonstration
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
      labels: salesData.labels,
      values: [1250, 2100, 1800, 2400, 1950, 2800, 1650],
    });
  };

  // Load all data
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get status badge color
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

  // Get rating stars
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`bi bi-star${i <= rating ? "-fill" : ""} text-warning`}
          style={{ fontSize: "0.9rem" }}
        ></i>,
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="container-fluid py-4 text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="text-muted">Loading dashboard data...</h5>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Toast Notifications */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      {/* Welcome Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 fw-bold mb-2">
                Welcome back, {user?.fullname?.split(" ")[0] || "Seller"}! 👋
              </h1>
              <p className="text-muted mb-0">
                Here's what's happening with your store today.
              </p>
            </div>
            <div>
              <Link
                href="/seller/products/add"
                className="btn btn-primary me-2"
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add Product
              </Link>
              <Link href="/seller/orders" className="btn btn-outline-primary">
                <i className="bi bi-box-seam me-2"></i>
                View Orders
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        {/* Total Revenue */}
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-currency-dollar text-primary fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Total Revenue</h6>
                  <h3 className="fw-bold mb-0">
                    {formatCurrency(stats.totalRevenue)}
                  </h3>
                  <small className="text-success">
                    <i className="bi bi-arrow-up me-1"></i>
                    {formatCurrency(stats.todayRevenue)} today
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-success bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-box-seam text-success fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Total Orders</h6>
                  <h3 className="fw-bold mb-0">{stats.totalOrders}</h3>
                  <small className="text-warning">
                    <i className="bi bi-clock me-1"></i>
                    {stats.pendingOrders} pending
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-info bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-grid text-info fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Products</h6>
                  <h3 className="fw-bold mb-0">{stats.totalProducts}</h3>
                  {stats.lowStockProducts > 0 && (
                    <small className="text-danger">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      {stats.lowStockProducts} low stock
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-star text-warning fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Average Rating</h6>
                  <h3 className="fw-bold mb-0">{stats.averageRating}/5</h3>
                  <small className="text-muted">
                    {stats.totalReviews} reviews
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables Row */}
      <div className="row g-4 mb-4">
        {/* Sales Chart */}
        <div className="col-xl-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="card-title fw-semibold mb-0">Weekly Sales</h5>
            </div>
            <div className="card-body">
              <div
                style={{ height: "300px" }}
                className="d-flex align-items-end justify-content-between"
              >
                {salesData.labels.map((label, index) => (
                  <div
                    key={label}
                    className="text-center"
                    style={{ width: "12%" }}
                  >
                    <div
                      className="bg-primary rounded mb-2"
                      style={{
                        height: `${(salesData.values[index] / Math.max(...salesData.values)) * 200}px`,
                        minHeight: "20px",
                        transition: "height 0.3s ease",
                      }}
                    ></div>
                    <small className="text-muted">{label}</small>
                    <div className="small fw-bold">
                      ${salesData.values[index]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="card-title fw-semibold mb-0">Recent Activity</h5>
            </div>
            <div className="card-body">
              <div className="timeline">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="d-flex mb-3">
                    <div className="flex-shrink-0 me-3">
                      <div
                        className={`bg-${activity.status} bg-opacity-10 rounded-circle p-2`}
                      >
                        <i
                          className={`bi ${
                            activity.type === "order"
                              ? "bi-box-seam"
                              : activity.type === "product"
                                ? "bi-grid"
                                : "bi-star"
                          } text-${activity.status}`}
                        ></i>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <p className="mb-1 small">{activity.description}</p>
                      <small className="text-muted">{activity.time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="card-title fw-semibold mb-0">Recent Orders</h5>
              <Link
                href="/seller/orders"
                className="btn btn-sm btn-outline-primary"
              >
                View All
              </Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
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
                        <td>
                          <Link
                            href={`/seller/orders/${order.id}`}
                            className="text-decoration-none"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td>{order.customer}</td>
                        <td>{order.items}</td>
                        <td>{formatCurrency(order.total)}</td>
                        <td>
                          <span
                            className={`badge bg-${getStatusBadge(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>{order.date}</td>
                        <td>
                          <Link
                            href={`/seller/orders/${order.id}`}
                            className="btn btn-sm btn-outline-primary"
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
        </div>
      </div>

      {/* Bottom Row - Top Products and Reviews */}
      <div className="row g-4">
        {/* Top Products */}
        <div className="col-xl-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="card-title fw-semibold mb-0">Top Products</h5>
              <Link
                href="/seller/products"
                className="btn btn-sm btn-outline-primary"
              >
                View All
              </Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
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
                        <td>
                          <Link
                            href={`/seller/products/${product._id}`}
                            className="text-decoration-none"
                          >
                            {product.name}
                          </Link>
                        </td>
                        <td>{product.sales}</td>
                        <td>{formatCurrency(product.revenue)}</td>
                        <td>
                          <span
                            className={`badge bg-${product.stock < 5 ? "danger" : "success"}`}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td>
                          <Link
                            href={`/seller/products/`}
                            className="btn btn-sm btn-outline-primary"
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

        {/* Recent Reviews */}
        <div className="col-xl-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="card-title fw-semibold mb-0">Recent Reviews</h5>
              <Link
                href="/seller/reviews"
                className="btn btn-sm btn-outline-primary"
              >
                View All
              </Link>
            </div>
            <div className="card-body">
              {recentReviews.map((review) => (
                <div key={review.id} className="d-flex mb-3 pb-3 border-bottom">
                  <div className="flex-shrink-0 me-3">
                    <div className="bg-light rounded-circle p-2">
                      <i className="bi bi-person-circle fs-4"></i>
                    </div>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h6 className="mb-0">{review.customer}</h6>
                      <small className="text-muted">{review.date}</small>
                    </div>
                    <div className="mb-1">{renderStars(review.rating)}</div>
                    <p className="mb-1 small">
                      <strong>{review.product}:</strong> {review.comment}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .timeline {
          max-height: 300px;
          overflow-y: auto;
        }

        .timeline::-webkit-scrollbar {
          width: 5px;
        }

        .timeline::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .timeline::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 5px;
        }

        .timeline::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .table th {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .table td {
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default SellerDashboard;
