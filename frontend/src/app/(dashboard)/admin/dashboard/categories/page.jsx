"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

const CategoriesPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  // Get token and setup headers
  const [token, setToken] = useState(null);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    // Access localStorage only on client side
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

  // Fetch categories
  const fetchCategories = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/category/`, authHeaders);
      setCategories(response.data.categories || response.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      // Handle error (you might want to show a toast notification)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCategories();
    }
  }, [token]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Reset form and close modal
  const resetModal = () => {
    setFormData({
      name: "",
      description: "",
      isActive: true,
    });
    setSelectedCategory(null);
    setModalMode("create");
    setShowModal(false);
  };

  // Open modal for create
  const handleOpenCreate = () => {
    setModalMode("create");
    setShowModal(true);
  };

  // Open modal for edit
  const handleOpenEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      isActive: category.isActive,
    });
    setModalMode("edit");
    setShowModal(true);
  };

  // Handle create category
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${backendUrl}/category/create`, formData, authHeaders);
      fetchCategories(); // Refresh the list
      resetModal();
      // You might want to show success message
    } catch (err) {
      console.error("Error creating category:", err);
      // Handle error
    }
  };

  // Handle update category
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedCategory) return;

    try {
      await axios.put(
        `${backendUrl}/category/update/${selectedCategory.id}`,
        formData,
        authHeaders,
      );
      fetchCategories(); // Refresh the list
      resetModal();
      // You might want to show success message
    } catch (err) {
      console.error("Error updating category:", err);
      // Handle error
    }
  };

  // Handle delete category
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      await axios.delete(`${backendUrl}/category/delete/${id}`, authHeaders);
      fetchCategories(); // Refresh the list
      // You might want to show success message
    } catch (err) {
      console.error("Error deleting category:", err);
      // Handle error
    }
  };

  // Toggle category active status
  const handleToggleActive = async (category) => {
    try {
      await axios.put(
        `${backendUrl}/category/update/${category.id}`,
        { ...category, isActive: !category.isActive },
        authHeaders,
      );
      fetchCategories(); // Refresh the list
    } catch (err) {
      console.error("Error toggling category status:", err);
    }
  };

  return (
    <div
      className="container p-4 bg-light rounded"
      style={{ minHeight: "80vh" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Category Management</h2>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <i className="bi bi-plus-lg me-2"></i>
          Create Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="table-responsive">
        <table className="table table-hover table-bordered align-middle">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : categories.length > 0 ? (
              categories.map((category, index) => (
                <tr key={category.id || index}>
                  <td>{index + 1}</td>
                  <td>{category.name}</td>
                  <td>{category.description || "-"}</td>
                  <td>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={category.isActive}
                        onChange={() => handleToggleActive(category)}
                        id={`active-${category.id}`}
                      />
                      <label
                        className={`form-check-label ${category.isActive ? "text-success" : "text-danger"}`}
                        htmlFor={`active-${category.id}`}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </label>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex gap-2 justify-content-center">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleOpenEdit(category)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(category.id)}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  No categories found. Click "Create Category" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form
                onSubmit={modalMode === "create" ? handleCreate : handleUpdate}
              >
                <div className="modal-header">
                  <h5 className="modal-title">
                    {modalMode === "create"
                      ? "Create New Category"
                      : "Edit Category"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={resetModal}
                    aria-label="Close"
                  />
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                      Category Name <span className="text-danger">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="form-control"
                      placeholder="Enter category name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      className="form-control"
                      rows="3"
                      placeholder="Enter category description (optional)"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        className="form-check-input"
                        checked={formData.isActive}
                        onChange={handleChange}
                      />
                      <label htmlFor="isActive" className="form-check-label">
                        Active Status
                      </label>
                    </div>
                    <small className="text-muted">
                      Inactive categories will not be visible to users
                    </small>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {modalMode === "create"
                      ? "Create Category"
                      : "Update Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
