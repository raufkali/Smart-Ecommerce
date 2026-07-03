"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Image from "next/image";
import "./AdminCategories.css";

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
const StatCard = ({ title, value, icon, color }) => {
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
      </div>
    </div>
  );
};

// Category Row Component
const CategoryRow = ({
  category,
  index,
  onEdit,
  onDelete,
  onToggleStatus,
  backendUrl,
}) => {
  const categoryId = category._id || category.id;

  // Get image URL
  const getImageUrl = () => {
    if (!category.image) return null;
    if (category.image.startsWith("http")) return category.image;
    return `${category.image}`;
  };

  return (
    <tr className="category-row">
      <td className="index-cell">{index + 1}</td>
      <td className="name-cell">
        <div className="category-info">
          <div className="category-avatar">
            {getImageUrl() ? (
              <Image
                src={getImageUrl()}
                alt={category.name}
                width={40}
                height={40}
                className="category-avatar-img"
              />
            ) : (
              <div className="category-avatar-placeholder">
                <i className="bi bi-tag-fill"></i>
              </div>
            )}
          </div>
          <span className="category-name">{category.name}</span>
        </div>
      </td>
      <td className="description-cell">
        {category.description || (
          <span className="text-muted">No description</span>
        )}
      </td>
      <td className="status-cell">
        <div className="status-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={category.isActive === true}
              onChange={() => onToggleStatus(category)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span
            className={`status-text ${category.isActive === true ? "active" : "inactive"}`}
          >
            {category.isActive === true ? "Active" : "Inactive"}
          </span>
        </div>
      </td>
      <td className="actions-cell">
        <button
          className="action-btn edit"
          onClick={() => onEdit(category)}
          title="Edit Category"
        >
          <i className="bi bi-pencil"></i>
        </button>
        <button
          className="action-btn delete"
          onClick={() => onDelete(category)}
          title="Delete Category"
        >
          <i className="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  );
};
// Image Upload Component
const ImageUpload = ({
  imagePreview,
  onImageChange,
  onRemoveImage,
  loading,
}) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (20MB max)
      if (file.size > 20 * 1024 * 1024) {
        alert("File is too large. Maximum size is 20MB.");
        return;
      }
      onImageChange(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("File is too large. Maximum size is 20MB.");
        return;
      }
      onImageChange(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="image-upload-container">
      {imagePreview ? (
        <div className="image-preview-wrapper">
          <div className="image-preview">
            <Image
              src={imagePreview}
              alt="Category preview"
              width={200}
              height={200}
              className="preview-image"
            />
            <button
              type="button"
              className="remove-image-btn"
              onClick={onRemoveImage}
              disabled={loading}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      ) : (
        <div
          className="image-drop-zone"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            style={{ display: "none" }}
          />
          <i className="bi bi-cloud-upload"></i>
          <h4>Upload Category Image</h4>
          <p>Drag & drop or click to select</p>
          <span className="file-types">JPG, PNG, GIF, WEBP (Max 20MB)</span>
        </div>
      )}
    </div>
  );
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  const tokenRef = useRef(null);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    tokenRef.current = localStorage.getItem("token");
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const token = tokenRef.current;
    if (!token) {
      showToast("Please login to manage categories", "error");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${backendUrl}/category/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle different response structures
      let categoriesData = [];
      if (response.data && response.data.categories) {
        categoriesData = response.data.categories;
      } else if (response.data && Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data && response.data.data) {
        categoriesData = response.data.data;
      }

      // Ensure isActive is properly set (default to true if missing)
      categoriesData = categoriesData.map((cat) => ({
        ...cat,
        isActive: cat.isActive !== undefined ? cat.isActive : true,
      }));

      setCategories(categoriesData);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(err.response?.data?.message || "Failed to fetch categories");
      showToast("Failed to fetch categories", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const resetModal = () => {
    setFormData({
      name: "",
      description: "",
      isActive: true,
    });
    setSelectedCategory(null);
    setModalMode("create");
    setError("");
    setImageFile(null);
    setImagePreview(null);
    setShowModal(false);
  };

  const handleOpenCreate = () => {
    setModalMode("create");
    setFormData({ name: "", description: "", isActive: true });
    setError("");
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const handleOpenEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      isActive: category.isActive !== undefined ? category.isActive : true,
    });

    // Set existing image preview
    if (category.image) {
      const imageUrl = category.image.startsWith("http")
        ? category.image
        : `${backendUrl}${category.image}`;
      setImagePreview(imageUrl);
    } else {
      setImagePreview(null);
    }
    setImageFile(null);
    setModalMode("edit");
    setError("");
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");

    try {
      const token = tokenRef.current;
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("isActive", formData.isActive);

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      await axios.post(`${backendUrl}/category/create`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchCategories();
      resetModal();
      showToast("Category created successfully", "success");
    } catch (err) {
      console.error("Error creating category:", err);
      const msg = err.response?.data?.message || "Failed to create category";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setActionLoading(true);
    setError("");

    const categoryId = selectedCategory._id || selectedCategory.id;

    try {
      const token = tokenRef.current;
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("isActive", formData.isActive);

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      await axios.put(
        `${backendUrl}/category/update/${categoryId}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      await fetchCategories();
      resetModal();
      showToast("Category updated successfully", "success");
    } catch (err) {
      console.error("Error updating category:", err);
      const msg = err.response?.data?.message || "Failed to update category";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (category) => {
    if (
      !window.confirm(`Are you sure you want to delete "${category.name}"?`)
    ) {
      return;
    }

    const categoryId = category._id || category.id;

    try {
      const token = tokenRef.current;
      await axios.delete(`${backendUrl}/category/delete/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCategories();
      showToast("Category deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting category:", err);
      showToast(
        err.response?.data?.message || "Failed to delete category",
        "error",
      );
    }
  };

  const handleToggleActive = async (category) => {
    const categoryId = category._id || category.id;
    const newStatus = !category.isActive;

    try {
      const token = tokenRef.current;
      const formDataToSend = new FormData();
      formDataToSend.append("name", category.name);
      formDataToSend.append("description", category.description || "");
      formDataToSend.append("isActive", newStatus);

      await axios.put(
        `${backendUrl}/category/update/${categoryId}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      await fetchCategories();
      showToast(
        `Category ${newStatus ? "activated" : "deactivated"} successfully`,
        "success",
      );
    } catch (err) {
      console.error("Error toggling category status:", err);
      showToast(
        err.response?.data?.message || "Failed to update category status",
        "error",
      );
    }
  };

  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      searchTerm === "" ||
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description &&
        category.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && category.isActive === true) ||
      (statusFilter === "inactive" && category.isActive === false);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: categories.length,
    active: categories.filter((c) => c.isActive === true).length,
    inactive: categories.filter((c) => c.isActive === false).length,
  };

  if (loading) {
    return (
      <div className="admin-categories">
        <div className="loading-container">
          <div className="gold-spinner"></div>
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-categories">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="categories-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="header-badge">
              <i className="bi bi-tags-fill"></i>
              <span>Category Management</span>
            </div>
            <h1 className="page-title">Manage Categories</h1>
            <p className="page-subtitle">
              Organize your products with categories
            </p>
          </div>
          <button className="btn-primary-gold" onClick={handleOpenCreate}>
            <i className="bi bi-plus-circle"></i>
            Create Category
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid-premium">
          <StatCard
            title="Total Categories"
            value={stats.total}
            icon="bi-tags-fill"
            color="primary"
          />
          <StatCard
            title="Active"
            value={stats.active}
            icon="bi-check-circle-fill"
            color="success"
          />
          <StatCard
            title="Inactive"
            value={stats.inactive}
            icon="bi-x-circle-fill"
            color="danger"
          />
          <StatCard
            title="Products Count"
            value={categories.reduce(
              (sum, cat) => sum + (cat.productCount || 0),
              0,
            )}
            icon="bi-box-seam"
            color="warning"
          />
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="reset-btn" onClick={fetchCategories}>
            <i className="bi bi-arrow-repeat"></i>
            Refresh
          </button>
        </div>

        {/* Categories Table */}
        <div className="categories-card">
          {error ? (
            <div className="error-container">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <p>{error}</p>
              <button className="btn-primary-gold" onClick={fetchCategories}>
                Try Again
              </button>
            </div>
          ) : (
            <div className="categories-table-container">
              <table className="categories-table">
                <thead>
                  <tr>
                    <th style={{ width: "60px" }}>#</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th style={{ width: "100px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category, index) => (
                      <CategoryRow
                        key={category._id || category.id || index}
                        category={category}
                        index={index}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleActive}
                        backendUrl={backendUrl}
                      />
                    ))
                  ) : (
                    <tr className="empty-row">
                      <td colSpan="5" className="empty-table-cell">
                        <i className="bi bi-inbox"></i>
                        <h5>No categories found</h5>
                        <p>
                          {searchTerm || statusFilter !== "all"
                            ? "Try adjusting your filters"
                            : 'Click "Create Category" to add your first category'}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i
                  className={`bi ${modalMode === "create" ? "bi-plus-circle" : "bi-pencil-square"}`}
                ></i>
                {modalMode === "create"
                  ? "Create New Category"
                  : "Edit Category"}
              </h5>
              <button className="modal-close" onClick={resetModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form
              onSubmit={modalMode === "create" ? handleCreate : handleUpdate}
            >
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label>
                    Category Name <span className="required">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    className="form-input"
                    placeholder="Enter category name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    className="form-textarea"
                    rows="3"
                    placeholder="Enter category description (optional)"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Category Image</label>
                  <ImageUpload
                    imagePreview={imagePreview}
                    onImageChange={handleImageChange}
                    onRemoveImage={handleRemoveImage}
                    loading={actionLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      name="isActive"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={handleChange}
                    />
                    <span>Active Status</span>
                  </label>
                  <small className="form-hint">
                    Inactive categories will not be visible to users
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={resetModal}
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
                  ) : modalMode === "create" ? (
                    "Create Category"
                  ) : (
                    "Update Category"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
