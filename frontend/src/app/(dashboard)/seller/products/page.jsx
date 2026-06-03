"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "./SellerProducts.css";

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

// Stock Modal
const StockModal = ({ show, onClose, product, onUpdate }) => {
  const [stockToAdd, setStockToAdd] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (stockToAdd <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const currentStock = product.stock || 0;
      const newStock = currentStock + parseInt(stockToAdd);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${product._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            stock: newStock,
            category: product.category?._id || product.category,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update stock");
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating stock:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="bi bi-plus-circle"></i>
            Add Stock
          </h5>
          <button className="modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="info-card">
              <div className="info-row">
                <span>Product:</span>
                <strong>{product?.name}</strong>
              </div>
              <div className="info-row">
                <span>Current Stock:</span>
                <strong className="gold-text">
                  {product?.stock || 0} units
                </strong>
              </div>
            </div>

            <div className="form-group">
              <label>
                Quantity to Add <span className="required">*</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={stockToAdd}
                onChange={(e) => setStockToAdd(e.target.value)}
                min="1"
                placeholder="Enter quantity"
              />
            </div>

            {error && (
              <div className="error-message">
                <i className="bi bi-exclamation-triangle-fill"></i>
                {error}
              </div>
            )}

            <div className="info-alert info">
              <i className="bi bi-info-circle-fill"></i>
              <div>
                <strong>New stock will be:</strong>
                <p>{(product?.stock || 0) + parseInt(stockToAdd || 0)} units</p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner"></span> : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Product Modal
const ProductModal = ({ show, onClose, product, onSave, categories }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    discount: "",
    stock: "",
    isActive: true,
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        category: product.category?._id || product.category || "",
        discount: product.discount || "",
        stock: product.stock || "",
        isActive: product.isActive !== undefined ? product.isActive : true,
      });
      setExistingImages(product.images || []);
      // Load existing images as previews
      const existingPreviews = (product.images || []).map(
        (img) => `${process.env.NEXT_PUBLIC_BACKEND_URL}${img}`,
      );
      setImagePreviews(existingPreviews);
    } else {
      resetForm();
    }
  }, [product]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      discount: "",
      stock: "",
      isActive: true,
    });
    setImageFiles([]);
    setExistingImages([]);
    setImagePreviews([]);
    setError("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate file sizes (max 5MB each)
    const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      setError("Some files exceed 5MB limit");
    }

    setImageFiles((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const isExisting = index < existingImages.length;

    if (isExisting) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      const fileIndex = index - existingImages.length;
      setImageFiles((prev) => prev.filter((_, i) => i !== fileIndex));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();

      // Append text fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);

      if (formData.category) {
        formDataToSend.append("category", formData.category);
      }

      formDataToSend.append("discount", formData.discount || "0");
      formDataToSend.append("stock", formData.stock);
      formDataToSend.append("isActive", formData.isActive);

      // Append existing images URLs to keep
      existingImages.forEach((img) => {
        formDataToSend.append("existingImages", img);
      });

      // Append new images
      imageFiles.forEach((file) => {
        formDataToSend.append("images", file);
      });

      const token = localStorage.getItem("token");
      const url = product
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${product._id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/create`;

      const method = product ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save product");
      }

      onSave();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="bi bi-box-seam"></i>
            {product ? "Edit Product" : "Add New Product"}
          </h5>
          <button className="modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>
                  Product Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Category <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required={!product}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>
                Description <span className="required">*</span>
              </label>
              <textarea
                className="form-textarea"
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Price <span className="required">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Discount (%)</label>
                <input
                  type="number"
                  className="form-input"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  min="0"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>
                  Stock <span className="required">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Product Images</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
                <label htmlFor="image-upload" className="file-upload-label">
                  <i className="bi bi-cloud-upload"></i>
                  <span>Click to upload images</span>
                  <small>PNG, JPG up to 5MB each</small>
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeImage(index)}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <span>Product is Active (visible to customers)</span>
              </label>
            </div>

            {error && (
              <div className="error-message">
                <i className="bi bi-exclamation-triangle-fill"></i>
                {error}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner"></span> : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteModal = ({ show, onClose, onConfirm, productName }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header modal-header-danger">
          <h5 className="modal-title">
            <i className="bi bi-trash-fill"></i>
            Confirm Delete
          </h5>
          <button className="modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="info-alert danger">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>
              <strong>Warning!</strong>
              <p>
                Are you sure you want to delete <strong>{productName}</strong>?
              </p>
              <p className="text-danger">This action cannot be undone.</p>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            Delete Product
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Seller Products Component
const SellerProducts = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/my-products`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/category/`,
      );
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${selectedProduct._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to delete product");

      showToast("Product deleted successfully", "success");
      fetchProducts();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast("Failed to delete product", "error");
    }
  };

  const toggleStatus = async (product) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${product._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isActive: !product.isActive,
            category: product.category?._id || product.category,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to update status");

      showToast(
        `Product ${product.isActive ? "deactivated" : "activated"}`,
        "success",
      );
      fetchProducts();
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Failed to update status", "error");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "active"
          ? product.isActive
          : filterStatus === "inactive"
            ? !product.isActive
            : filterStatus === "lowStock"
              ? product.stock < 5 && product.stock > 0
              : filterStatus === "outOfStock"
                ? product.stock === 0
                : true;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: products.length,
    active: products.filter((p) => p.isActive).length,
    lowStock: products.filter((p) => p.stock < 5 && p.stock > 0).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
  };

  return (
    <div className="seller-products">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ProductModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSave={() => {
          fetchProducts();
          showToast("Product saved successfully", "success");
        }}
        categories={categories}
      />

      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        productName={selectedProduct?.name}
      />

      <StockModal
        show={showStockModal}
        onClose={() => {
          setShowStockModal(false);
          setStockProduct(null);
        }}
        product={stockProduct}
        onUpdate={() => {
          fetchProducts();
          showToast("Stock updated successfully", "success");
        }}
      />

      <div className="products-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="header-badge">
              <i className="bi bi-box-seam"></i>
              <span>Product Management</span>
            </div>
            <h1 className="page-title">My Products</h1>
            <p className="page-subtitle">Manage your product inventory</p>
          </div>
          <button
            className="btn-primary-gold"
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-plus-circle"></i>
            Add New Product
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid-premium">
          <div className="stats-card-premium stats-primary">
            <div className="stats-icon-wrapper">
              <div className="stats-icon">
                <i className="bi bi-box-seam"></i>
              </div>
            </div>
            <div className="stats-content">
              <h5 className="stats-value">{stats.total}</h5>
              <p className="stats-title">Total Products</p>
            </div>
          </div>

          <div className="stats-card-premium stats-success">
            <div className="stats-icon-wrapper">
              <div className="stats-icon">
                <i className="bi bi-check-circle"></i>
              </div>
            </div>
            <div className="stats-content">
              <h5 className="stats-value">{stats.active}</h5>
              <p className="stats-title">Active Products</p>
            </div>
          </div>

          <div className="stats-card-premium stats-warning">
            <div className="stats-icon-wrapper">
              <div className="stats-icon">
                <i className="bi bi-exclamation-triangle"></i>
              </div>
            </div>
            <div className="stats-content">
              <h5 className="stats-value">{stats.lowStock}</h5>
              <p className="stats-title">Low Stock</p>
            </div>
          </div>

          <div className="stats-card-premium stats-danger">
            <div className="stats-icon-wrapper">
              <div className="stats-icon">
                <i className="bi bi-x-circle"></i>
              </div>
            </div>
            <div className="stats-content">
              <h5 className="stats-value">{stats.outOfStock}</h5>
              <p className="stats-title">Out of Stock</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Products</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="lowStock">Low Stock (&lt;5)</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
          <button
            className="reset-btn"
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("all");
            }}
          >
            <i className="bi bi-arrow-counterclockwise"></i>
            Reset
          </button>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="loading-container">
            <div className="gold-spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-box-seam"></i>
            <h4>No products found</h4>
            <p>
              {products.length === 0
                ? "You haven't added any products yet."
                : "Try adjusting your filters"}
            </p>
            {products.length === 0 && (
              <button
                className="btn-primary-gold"
                onClick={() => setShowModal(true)}
              >
                <i className="bi bi-plus-circle"></i>
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <div className="products-card">
            <div className="products-table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>Image</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th style={{ width: "300px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id}>
                      <td>
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${product.images[0]}`}
                            alt={product.name}
                            className="product-thumb"
                          />
                        ) : (
                          <div className="product-thumb-placeholder">
                            <i className="bi bi-image"></i>
                          </div>
                        )}
                      </td>
                      <td className="product-cell">
                        <div className="product-info">
                          <span className="product-name">{product.name}</span>
                          <span className="product-description">
                            {product.description?.substring(0, 60)}...
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="category-badge">
                          {product.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td className="price-cell">
                        <div className="price-info">
                          <span className="current-price">
                            {formatPrice(product.finalPrice || product.price)}
                          </span>
                          {product.discount > 0 && (
                            <span className="original-price">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
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
                          {product.stock} units
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${product.isActive ? "active" : "inactive"}`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowModal(true);
                            }}
                            title="Edit Product"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="action-btn stock"
                            onClick={() => {
                              setStockProduct(product);
                              setShowStockModal(true);
                            }}
                            title="Add Stock"
                          >
                            <i className="bi bi-plus-circle"></i>
                          </button>
                          <button
                            className="action-btn stock-quick"
                            onClick={() => {
                              const productToUpdate = product;
                              const updateStock = async () => {
                                try {
                                  const token = localStorage.getItem("token");
                                  const newStock =
                                    (productToUpdate.stock || 0) + 10;
                                  await fetch(
                                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${productToUpdate._id}`,
                                    {
                                      method: "PUT",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: JSON.stringify({
                                        stock: newStock,
                                        category:
                                          productToUpdate.category?._id ||
                                          productToUpdate.category,
                                      }),
                                    },
                                  );
                                  fetchProducts();
                                  showToast("Added 10 stock", "success");
                                } catch (error) {
                                  showToast("Failed to add stock", "error");
                                }
                              };
                              updateStock();
                            }}
                            title="Add 10 Stock"
                          >
                            <i className="bi bi-plus-lg"></i>10
                          </button>
                          <button
                            className={`action-btn ${product.isActive ? "deactivate" : "activate"}`}
                            onClick={() => toggleStatus(product)}
                            title={product.isActive ? "Deactivate" : "Activate"}
                          >
                            <i
                              className={`bi bi-${product.isActive ? "eye-slash" : "eye"}`}
                            ></i>
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowDeleteModal(true);
                            }}
                            title="Delete Product"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerProducts;
