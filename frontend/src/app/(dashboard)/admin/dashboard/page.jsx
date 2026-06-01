"use client";

import { useEffect, useState } from "react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    categories: 0,
    products: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const res = await fetch(`${backendURL}/admin/dashboard`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
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

        // Set Stats
        setStats({
          users: allUsers.length,
          orders: allOrders.length,
          categories: allCategories.length,
          products: allProducts.length,
        });

        // Sort latest 5 orders
        const sortedOrders = [...allOrders]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        setRecentOrders(sortedOrders);
      } catch (error) {
        console.error("Dashboard Error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [backendURL]);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-dark"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <h3 className="mb-4 fw-bold">Admin Overview</h3>

      {/* STAT CARDS */}
      <div className="row g-4 mb-5">
        <DashboardCard title="Total Users" value={stats.users} />
        <DashboardCard title="Total Orders" value={stats.orders} />
        <DashboardCard title="Total Categories" value={stats.categories} />
        <DashboardCard title="Total Products" value={stats.products} />
      </div>

      {/* RECENT ORDERS */}
      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Recent Orders</h5>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No recent orders
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>#{order._id?.slice(-6)}</td>
                    <td>{order.user?.fullName || "N/A"}</td>
                    <td>
                      <span
                        className={`badge ${
                          order.orderStatus === "delivered"
                            ? "bg-success"
                            : order.orderStatus === "pending"
                              ? "bg-warning text-dark"
                              : order.orderStatus === "cancelled"
                                ? "bg-danger"
                                : "bg-secondary"
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>${order.totalPrice || 0}</td>
                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ---------- Reusable Card ---------- */
function DashboardCard({ title, value }) {
  return (
    <div className="col-xl-3 col-md-6">
      <div className="card shadow-sm border-0 h-100">
        <div className="card-body">
          <h6 className="text-muted">{title}</h6>
          <h2 className="fw-bold">{value}</h2>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
