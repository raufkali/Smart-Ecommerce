"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import "./categories.css";

// ─── Toast ────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const iconMap = {
    success: "bi-check-circle-fill",
    error: "bi-exclamation-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    info: "bi-info-circle-fill",
  };
  const bgMap = {
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-warning",
    info: "bg-info",
  };

  return (
    <div
      className={`toast-notification ${bgMap[type] || "bg-primary"} text-white`}
      role="alert"
    >
      <i className={`bi ${iconMap[type] || "bi-bell-fill"} me-2`}></i>
      <span className="flex-grow-1">{message}</span>
      <button
        type="button"
        className="btn-close btn-close-white ms-3"
        onClick={onClose}
      />
      <style jsx>{`
        .toast-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          min-width: 300px;
          max-width: 400px;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
          display: flex;
          align-items: center;
          z-index: 9999;
          animation: slideIn 0.3s ease forwards;
          font-family: "DM Sans", system-ui, sans-serif;
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

// ─── Main Page ─────────────────────────────────────────────────
const CategoriesPage = () => {
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loading, setLoading] = useState({
    categories: true,
    categoryProducts: false,
  });
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });
  const closeToast = () => setToast(null);

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) setUser((await res.json()).user);
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
  }, []);

  // Fetch ONLY active categories (matches homepage)
  const fetchCategories = async () => {
    try {
      setLoading((p) => ({ ...p, categories: true }));
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/category/active`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      showToast("Failed to load categories", "error");
    } finally {
      setLoading((p) => ({ ...p, categories: false }));
    }
  };

  // Fetch products for a category
  const fetchProductsByCategory = async (categoryId) => {
    try {
      setLoading((p) => ({ ...p, categoryProducts: true }));
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/category/${categoryId}/products`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategoryProducts(data.products || []);
    } catch {
      showToast("Failed to load products for this category", "error");
    } finally {
      setLoading((p) => ({ ...p, categoryProducts: false }));
    }
  };

  const handleCategoryClick = (category) => {
    if (selectedCategory?._id === category._id) {
      setSelectedCategory(null);
      setCategoryProducts([]);
      return;
    }
    setSelectedCategory(category);
    fetchProductsByCategory(category._id);
  };

  // Add to cart
  const addToCart = async (productId, productName) => {
    if (!user) {
      showToast("Please login to add items to cart", "info");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }
    try {
      setAddingToCart((p) => ({ ...p, [productId]: true }));
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/cart/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId, quantity: 1 }),
        },
      );
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      showToast(`${productName} added to cart!`, "success");
    } catch (e) {
      showToast(e.message || "Failed to add item to cart", "error");
    } finally {
      setAddingToCart((p) => ({ ...p, [productId]: false }));
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);

  const calculateDiscount = (price, finalPrice) => {
    if (!finalPrice || finalPrice >= price) return 0;
    return Math.round(((price - finalPrice) / price) * 100);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="categories-page">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      {/* Header */}
      <div className="categories-page-header">
        <div className="container">
          <h1>Shop by Category</h1>
          <p className="lead">Browse our wide range of products by category</p>
        </div>
      </div>

      {/* ── Category Grid (Matches Homepage Style) ── */}
      <section className="categories-grid-section">
        <div className="container">
          {loading.categories ? (
            <div className="categories-loading">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="category-skeleton" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-folder-x"></i>
              <p>No categories available yet</p>
            </div>
          ) : (
            <div className="categories-grid">
              {categories.map((category) => (
                <motion.div
                  key={category._id}
                  className={`category-item ${selectedCategory?._id === category._id ? "active" : ""}`}
                  onHoverStart={() => setHoveredCategory(category._id)}
                  onHoverEnd={() => setHoveredCategory(null)}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="category-link">
                    <div className="category-image-wrapper">
                      {/* Use actual category image like homepage */}
                      <Image
                        src={
                          category.image?.startsWith("http")
                            ? category.image
                            : `${process.env.NEXT_PUBLIC_BACKEND_URL}${category.image || "/placeholder-category.jpg"}`
                        }
                        alt={category.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16.6vw"
                        className="category-image"
                        priority={categories.indexOf(category) < 4}
                      />
                      <div className="category-overlay">
                        <div className="category-content">
                          <span className="category-name">{category.name}</span>
                          {category.description && (
                            <span className="category-description">
                              {category.description.length > 30
                                ? `${category.description.substring(0, 30)}...`
                                : category.description}
                            </span>
                          )}
                          <span className="category-shop-btn">
                            {selectedCategory?._id === category._id
                              ? "Selected ✓"
                              : "Browse"}
                            <i className="bi bi-arrow-right" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Category Products ── */}
      {selectedCategory && (
        <section className="category-products-section">
          <div className="container">
            <div className="category-products-header">
              <h2>
                <span>{selectedCategory.name}</span> Products
              </h2>
              <button
                className="btn-clear-filter"
                onClick={() => {
                  setSelectedCategory(null);
                  setCategoryProducts([]);
                }}
              >
                <i className="bi bi-x me-1"></i>Clear filter
              </button>
            </div>

            {loading.categoryProducts ? (
              <div className="loading-container">
                <div className="loader-spinner" />
                <p>Loading products…</p>
              </div>
            ) : categoryProducts.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-box-seam"></i>
                <p>No products found in this category</p>
              </div>
            ) : (
              <div className="products-grid">
                {categoryProducts.map((product) => {
                  const discount = calculateDiscount(
                    product.price,
                    product.finalPrice,
                  );
                  const isAdding = addingToCart[product._id];
                  const outOfStock = product.stock <= 0;

                  return (
                    <div className="product-card" key={product._id}>
                      <div className="product-image-container">
                        <Link href={`/products/${product._id}`}>
                          <Image
                            src={
                              product.images?.[0]?.startsWith("http")
                                ? product.images[0]
                                : `${process.env.NEXT_PUBLIC_BACKEND_URL}${product.images?.[0] || "/placeholder.jpg"}`
                            }
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                            className="product-image"
                          />
                          {!product.images?.length && (
                            <div className="image-placeholder">
                              <i className="bi bi-image" />
                            </div>
                          )}
                        </Link>

                        {discount > 0 && (
                          <span className="badge-discount">
                            {discount}% OFF
                          </span>
                        )}
                        {outOfStock && (
                          <span className="badge-out-of-stock">Sold Out</span>
                        )}
                      </div>

                      <div className="product-body">
                        <span className="category-badge">
                          {selectedCategory.name}
                        </span>

                        <Link
                          href={`/products/${product._id}`}
                          className="product-title"
                        >
                          <h3>
                            {product.name.length > 40
                              ? `${product.name.substring(0, 40)}…`
                              : product.name}
                          </h3>
                        </Link>

                        <div className="product-price">
                          <span className="current-price">
                            {formatPrice(product.finalPrice || product.price)}
                          </span>
                          {product.finalPrice &&
                            product.finalPrice < product.price && (
                              <span className="original-price">
                                {formatPrice(product.price)}
                              </span>
                            )}
                        </div>

                        <button
                          className="add-to-cart-btn"
                          disabled={outOfStock || isAdding}
                          onClick={() => addToCart(product._id, product.name)}
                        >
                          {isAdding ? (
                            <>
                              <span className="spinner" /> Adding…
                            </>
                          ) : (
                            <>
                              <i className="bi bi-cart-plus" />
                              {outOfStock
                                ? "Sold Out"
                                : !user
                                  ? "Login to Buy"
                                  : "Add to Cart"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default CategoriesPage;
