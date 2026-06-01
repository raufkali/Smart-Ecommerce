"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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

// Quick Stock Update Modal
const StockModal = ({ show, onClose, product, onUpdate }) => {
  const [stockToAdd, setStockToAdd] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const currentStock = product.stock || 0;
      const newStock = currentStock + parseInt(stockToAdd);

      // ✅ FIX: Send existing category along with stock
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
            category: product.category?._id || product.category, // Send existing category
          }),
        },
      );
    } catch (error) {
      console.error("Error updating stock:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Stock</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <p className="mb-3">
                <strong>Product:</strong> {product?.name}
              </p>
              <p className="mb-3">
                <strong>Current Stock:</strong> {product?.stock || 0}
              </p>
              <div className="mb-3">
                <label className="form-label">Quantity to Add</label>
                <input
                  type="number"
                  className="form-control"
                  value={stockToAdd}
                  onChange={(e) => setStockToAdd(e.target.value)}
                  min="1"
                  required
                  placeholder="Enter quantity"
                />
              </div>
              <p className="text-info small">
                <i className="bi bi-info-circle me-1"></i>
                New stock will be:{" "}
                {(product?.stock || 0) + parseInt(stockToAdd || 0)}
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !stockToAdd}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Updating...
                  </>
                ) : (
                  "Add Stock"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Product Modal Component
const ProductModal = ({ show, onClose, product, onSave, categories }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    discount: "",
    stock: "",
    isActive: true,
    images: [],
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);

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
        images: product.images || [],
      });
      setImagePreviews(product.images || []);
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
      images: [],
    });
    setImageFiles([]);
    setImagePreviews([]);
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
    setImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Append text fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);

      // ✅ Fix: Only append category if it exists
      if (formData.category) {
        formDataToSend.append("category", formData.category);
      }

      formDataToSend.append("discount", formData.discount || "0");
      formDataToSend.append("stock", formData.stock);
      formDataToSend.append("isActive", formData.isActive);

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

      const responseText = await response.text();

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || "Failed to save product");
        } catch (e) {
          throw new Error(responseText || "Failed to save product");
        }
      }

      const data = JSON.parse(responseText);
      console.log("Product saved:", data);
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        discount: "",
        stock: "",
        isActive: true,
        images: [],
      });
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {product ? "Edit Product" : "Add New Product"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required={!product} // Required only for new products
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

              <div className="mb-3">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-control"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Price *</label>
                  <input
                    type="number"
                    className="form-control"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Discount (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Stock *</label>
                  <input
                    type="number"
                    className="form-control"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Product Images</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                />
                <small className="text-muted">
                  You can upload up to 5 images (max 5MB each)
                </small>
              </div>

              {imagePreviews.length > 0 && (
                <div className="mb-3">
                  <label className="form-label">Image Previews</label>
                  <div className="d-flex flex-wrap gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="position-relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: "80px",
                            height: "80px",
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger position-absolute top-0 end-0"
                          style={{ padding: "0 4px", fontSize: "10px" }}
                          onClick={() => removeImage(index)}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="isActive">
                    Product is Active (visible to customers)
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Saving...
                  </>
                ) : (
                  "Save Product"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteModal = ({ show, onClose, onConfirm, productName }) => {
  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Confirm Delete</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <p>
              Are you sure you want to delete <strong>{productName}</strong>?
            </p>
            <p className="text-danger small">This action cannot be undone.</p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={onConfirm}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  const showToast = (message, type = "success") => setToast({ message, type });
  const closeToast = () => setToast(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
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

  // Fetch categories
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

  // Delete product
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

  // Toggle product status
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
          body: JSON.stringify({ isActive: !product.isActive }),
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

  // Quick add stock
  const addStock = async (product, quantity = 10) => {
    try {
      const token = localStorage.getItem("token");
      const newStock = (product.stock || 0) + quantity;

      // ✅ FIX: Send existing category along with stock
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
            category: product.category?._id || product.category, // Send existing category
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add stock");
      }

      showToast(`Added ${quantity} stock to ${product.name}`, "success");
      fetchProducts();
    } catch (error) {
      console.error("Error adding stock:", error);
      showToast(error.message, "error");
    }
  };

  // Filter products
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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <div className="container-fluid py-4">
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      {/* Modals */}
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

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-2">My Products</h1>
          <p className="text-muted mb-0">Manage your product inventory</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Product
        </button>
      </div>

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Products</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="lowStock">Low Stock (&lt;5)</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
        </div>
        <div className="col-md-2">
          <button
            className="btn btn-outline-secondary w-100"
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("all");
            }}
          >
            <i className="bi bi-arrow-counterclockwise me-2"></i>
            Reset
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-primary bg-opacity-10">
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Products</h6>
              <h3 className="fw-bold mb-0">{products.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-success bg-opacity-10">
            <div className="card-body">
              <h6 className="text-muted mb-2">Active Products</h6>
              <h3 className="fw-bold mb-0">
                {products.filter((p) => p.isActive).length}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-warning bg-opacity-10">
            <div className="card-body">
              <h6 className="text-muted mb-2">Low Stock</h6>
              <h3 className="fw-bold mb-0">
                {products.filter((p) => p.stock < 5 && p.stock > 0).length}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-danger bg-opacity-10">
            <div className="card-body">
              <h6 className="text-muted mb-2">Out of Stock</h6>
              <h3 className="fw-bold mb-0">
                {products.filter((p) => p.stock === 0).length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <h5 className="text-muted">Loading products...</h5>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-3">
          <i className="bi bi-box-seam display-1 text-muted"></i>
          <h5 className="mt-3 text-muted">No products found</h5>
          <button
            className="btn btn-primary mt-3"
            onClick={() => setShowModal(true)}
          >
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th style={{ width: "80px" }}>Image</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th style={{ width: "280px" }}>Actions</th>
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
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                        />
                      ) : (
                        <div
                          className="bg-light d-flex align-items-center justify-content-center"
                          style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "4px",
                          }}
                        >
                          <i className="bi bi-image text-muted"></i>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="fw-semibold">{product.name}</div>
                      <small className="text-muted">
                        {product.description?.substring(0, 50)}...
                      </small>
                    </td>
                    <td>{product.category?.name || "Uncategorized"}</td>
                    <td>
                      <div className="fw-bold text-primary">
                        {formatPrice(product.finalPrice || product.price)}
                      </div>
                      {product.discount > 0 && (
                        <small className="text-muted text-decoration-line-through">
                          {formatPrice(product.price)}
                        </small>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge bg-${
                          product.stock === 0
                            ? "danger"
                            : product.stock < 5
                              ? "warning"
                              : "success"
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge bg-${product.isActive ? "success" : "secondary"}`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowModal(true);
                          }}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>

                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => {
                            setStockProduct(product);
                            setShowStockModal(true);
                          }}
                          title="Add Stock"
                        >
                          <i className="bi bi-plus-circle"></i>
                        </button>

                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => addStock(product, 10)}
                          title="Add 10 Stock"
                        >
                          <i className="bi bi-plus-lg"></i>10
                        </button>

                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => toggleStatus(product)}
                          title={product.isActive ? "Deactivate" : "Activate"}
                        >
                          <i
                            className={`bi bi-${product.isActive ? "eye-slash" : "eye"}`}
                          ></i>
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowDeleteModal(true);
                          }}
                          title="Delete"
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

      <style jsx>{`
        .table th {
          font-weight: 600;
          font-size: 0.9rem;
          background-color: #f8f9fa;
        }
        .table td {
          font-size: 0.9rem;
          vertical-align: middle;
        }
        .btn-group .btn {
          padding: 0.25rem 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default SellerProducts;
