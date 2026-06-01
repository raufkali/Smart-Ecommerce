"use client";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin`;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    role: "admin",
  });

  // Get token safely
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const authHeaders = token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {};

  // ================= FETCH USERS =================
  const fetchUsers = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_URL}/users`, authHeaders);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ================= RESET FORM =================
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

  // ================= CREATE =================
  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");

    try {
      await axios.post(
        `${API_URL}/create-admin`,
        {
          fullname: formData.fullname,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        },
        authHeaders,
      );

      await fetchUsers();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create admin");
    } finally {
      setActionLoading(false);
    }
  };

  // ================= OPEN EDIT =================
  const openEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      fullname: user.fullname || "",
      email: user.email || "",
      role: user.role || "user",
      password: "", // Password field empty for edit
    });
    setError("");
    setShowEditModal(true);
  };

  // ================= UPDATE =================
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setActionLoading(true);
    setError("");

    try {
      await axios.put(
        `${API_URL}/update/${selectedUser._id}`,
        {
          fullname: formData.fullname,
          email: formData.email,
          role: formData.role,
        },
        authHeaders,
      );

      await fetchUsers();
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  // ================= OPEN DELETE CONFIRMATION =================
  const openDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // ================= DELETE =================
  const handleDelete = async () => {
    if (!selectedUser) return;

    setActionLoading(true);

    try {
      await axios.delete(`${API_URL}/delete/${selectedUser._id}`, authHeaders);
      await fetchUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  // ================= TOGGLE USER STATUS =================
  const toggleUserStatus = async (user) => {
    try {
      await axios.put(
        `${API_URL}/update/${user._id}`,
        { isDeleted: !user.isDeleted },
        authHeaders,
      );
      await fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to update user status");
    }
  };

  // ================= FILTER USERS =================
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

  // ================= STATISTICS =================
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    users: users.filter((u) => u.role === "user").length,
    sellers: users.filter((u) => u.role === "seller").length,
    active: users.filter((u) => !u.isDeleted).length,
    deleted: users.filter((u) => u.isDeleted).length,
  };

  // ================= RENDER =================
  return (
    <div className="container-fluid bg-light min-vh-100 p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">
            <i className="bi bi-people-fill me-2"></i>
            User Management
          </h3>
          <p className="text-muted mb-0">Manage administrators and users</p>
        </div>
        <button
          className="btn btn-primary px-4"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Create User
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-primary bg-opacity-10">
            <div className="card-body">
              <h6 className="text-primary mb-2">Total Users</h6>
              <h3 className="mb-0">{stats.total}</h3>
              <small className="text-muted">Active: {stats.active}</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-success bg-opacity-10">
            <div className="card-body">
              <h6 className="text-success mb-2">Admins</h6>
              <h3 className="mb-0">{stats.admins}</h3>
              <small className="text-muted">Full access</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-info bg-opacity-10">
            <div className="card-body">
              <h6 className="text-info mb-2">Sellers</h6>
              <h3 className="mb-0">{stats.sellers}</h3>
              <small className="text-muted">Product managers</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-warning bg-opacity-10">
            <div className="card-body">
              <h6 className="text-warning mb-2">Regular Users</h6>
              <h3 className="mb-0">{stats.users}</h3>
              <small className="text-muted">Basic access</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="seller">Seller</option>
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
        <div className="col-md-2">
          <button
            className="btn btn-outline-secondary w-100"
            onClick={fetchUsers}
          >
            <i className="bi bi-arrow-repeat me-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card shadow border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">Loading users...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger m-3">{error}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4">#</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th className="text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <tr key={user._id}>
                        <td className="px-4 fw-semibold">{index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                              <i className="bi bi-person-circle text-primary"></i>
                            </div>
                            <div>
                              <div className="fw-semibold">{user.fullname}</div>
                              <small className="text-muted">
                                ID: {user._id?.slice(-6)}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span
                            className={`badge ${
                              user.role === "admin"
                                ? "bg-primary"
                                : user.role === "seller"
                                  ? "bg-info"
                                  : "bg-secondary"
                            } px-3 py-2`}
                          >
                            <i
                              className={`bi ${
                                user.role === "admin"
                                  ? "bi-shield-lock"
                                  : user.role === "seller"
                                    ? "bi-shop"
                                    : "bi-person"
                              } me-2`}
                            ></i>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={!user.isDeleted}
                              onChange={() => toggleUserStatus(user)}
                              id={`status-${user._id}`}
                            />
                            <label
                              className={`form-check-label ${
                                user.isDeleted ? "text-danger" : "text-success"
                              }`}
                              htmlFor={`status-${user._id}`}
                            >
                              {user.isDeleted ? "Inactive" : "Active"}
                            </label>
                          </div>
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </small>
                        </td>
                        <td className="text-end px-4">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => openEdit(user)}
                            title="Edit user"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => openDelete(user)}
                            title="Delete user"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                        <h5 className="text-muted">No users found</h5>
                        <p className="text-muted mb-0">
                          Try adjusting your filters
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ================= CREATE MODAL ================= */}
      {showCreateModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus-fill me-2"></i>
                  Create New Admin
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                />
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input
                      name="fullname"
                      className="form-control"
                      placeholder="Enter full name"
                      value={formData.fullname}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      name="email"
                      type="email"
                      className="form-control"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      name="password"
                      type="password"
                      className="form-control"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength="6"
                    />
                    <small className="text-muted">Minimum 6 characters</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
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
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Creating...
                      </>
                    ) : (
                      "Create Admin"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {showEditModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-pencil-square me-2"></i>
                  Edit User
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                />
              </div>
              <form onSubmit={handleUpdate}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input
                      name="fullname"
                      className="form-control"
                      value={formData.fullname}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      name="email"
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
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
                  <div className="alert alert-info mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    Password cannot be changed here. Use "Forgot Password" flow.
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Updating...
                      </>
                    ) : (
                      "Update User"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {showDeleteModal && selectedUser && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Confirm Delete
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this user?</p>
                <div className="bg-light p-3 rounded">
                  <p className="mb-1">
                    <strong>Name:</strong> {selectedUser.fullname}
                  </p>
                  <p className="mb-1">
                    <strong>Email:</strong> {selectedUser.email}
                  </p>
                  <p className="mb-0">
                    <strong>Role:</strong> {selectedUser.role}
                  </p>
                </div>
                <p className="text-danger mt-3 mb-0">
                  <i className="bi bi-exclamation-circle me-2"></i>
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Deleting...
                    </>
                  ) : (
                    "Yes, Delete User"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
