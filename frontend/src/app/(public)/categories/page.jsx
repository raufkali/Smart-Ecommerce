"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import "./categories.css";

// ─── Category icon map ────────────────────────────────────────
// Maps keywords in category name → Bootstrap icon class
const getCategoryIcon = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("electron") || n.includes("tech") || n.includes("gadget"))
    return "bi-laptop";
  if (
    n.includes("cloth") ||
    n.includes("fashion") ||
    n.includes("wear") ||
    n.includes("apparel")
  )
    return "bi-bag";
  if (n.includes("book") || n.includes("stationer")) return "bi-book";
  if (n.includes("home") || n.includes("furniture") || n.includes("decor"))
    return "bi-house-door";
  if (n.includes("sport") || n.includes("fitness") || n.includes("gym"))
    return "bi-trophy";
  if (n.includes("beauty") || n.includes("cosmetic") || n.includes("skin"))
    return "bi-stars";
  if (n.includes("food") || n.includes("grocery") || n.includes("kitchen"))
    return "bi-basket";
  if (n.includes("toy") || n.includes("kid") || n.includes("child"))
    return "bi-balloon";
  if (n.includes("jewel") || n.includes("accessory") || n.includes("watch"))
    return "bi-gem";
  if (n.includes("health") || n.includes("medical") || n.includes("pharma"))
    return "bi-heart-pulse";
  if (n.includes("auto") || n.includes("car") || n.includes("vehicle"))
    return "bi-car-front";
  if (n.includes("pet") || n.includes("animal")) return "bi-heart";
  if (n.includes("music") || n.includes("instrument"))
    return "bi-music-note-beamed";
  if (n.includes("garden") || n.includes("outdoor") || n.includes("plant"))
    return "bi-tree";
  if (n.includes("tool") || n.includes("hardware")) return "bi-tools";
  if (n.includes("art") || n.includes("craft")) return "bi-palette";
  if (n.includes("travel") || n.includes("luggage") || n.includes("bag"))
    return "bi-suitcase";
  return "bi-grid";
};

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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading((p) => ({ ...p, categories: true }));
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/category/`,
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
    <div className="categories-page container-fluid py-5">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      {/* Header */}
      <div className="row mb-4 categories-page-header">
        <div className="col-12">
          <h1 className="mb-2">Shop by Category</h1>
          <p className="lead mb-0">
            Browse our wide range of products by category
          </p>
        </div>
      </div>

      {/* ── Category Pills ── */}
      <div className="mb-5">
        <span className="section-label">Categories</span>
        <div className="d-flex align-items-center justify-content-between mb-1">
          <h2 className="section-title">Browse All</h2>
        </div>
        <hr className="section-divider" />

        {loading.categories ? (
          <div className="cat-loading">
            <div className="spinner-gold"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="cat-empty">
            <i className="bi bi-folder-x"></i>
            No categories available yet
          </div>
        ) : (
          <div className="category-pills-row">
            {/* "All" pill */}
            {selectedCategory && (
              <div
                className="category-pill category-pill-all"
                onClick={() => {
                  setSelectedCategory(null);
                  setCategoryProducts([]);
                }}
              >
                <div className="category-pill-icon">
                  <i className="bi bi-x-lg" style={{ fontSize: "0.75rem" }}></i>
                </div>
                <span className="category-pill-name">Clear</span>
              </div>
            )}

            {categories.map((cat) => (
              <div
                key={cat._id}
                className={`category-pill ${selectedCategory?._id === cat._id ? "active" : ""}`}
                onClick={() => handleCategoryClick(cat)}
              >
                <div className="category-pill-icon">
                  <i className={`bi ${getCategoryIcon(cat.name)}`}></i>
                </div>
                <span className="category-pill-name">{cat.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Category Products ── */}
      {selectedCategory && (
        <div className="mb-5">
          <div className="category-products-header">
            <h3 className="category-products-title">
              <span>{selectedCategory.name}</span> Products
            </h3>
            <button
              className="btn btn-clear-filter"
              onClick={() => {
                setSelectedCategory(null);
                setCategoryProducts([]);
              }}
            >
              <i className="bi bi-x me-1"></i>Clear filter
            </button>
          </div>

          {loading.categoryProducts ? (
            <div className="cat-loading">
              <div className="spinner-gold"></div>
              <p style={{ color: "#9a9080", fontSize: "0.875rem" }}>
                Loading products…
              </p>
            </div>
          ) : categoryProducts.length === 0 ? (
            <div className="cat-empty">
              <i className="bi bi-box-seam"></i>
              No products found in this category
            </div>
          ) : (
            <div className="row g-4">
              {categoryProducts.map((product) => {
                const discount = calculateDiscount(
                  product.price,
                  product.finalPrice,
                );
                const isAdding = addingToCart[product._id];
                const outOfStock = product.stock <= 0;

                return (
                  <div className="col-6 col-md-4 col-lg-3" key={product._id}>
                    <div className="cat-product-card h-100">
                      {/* Image */}
                      {product.images?.length > 0 ? (
                        <div className="cat-product-img">
                          <Image
                            src={
                              product.images?.[0]?.startsWith("http")
                                ? product.images[0]
                                : `${process.env.NEXT_PUBLIC_BACKEND_URL}${product.images?.[0] || "/placeholder.jpg"}`
                            }
                            alt={product.name}
                            fill
                            style={{ objectFit: "cover", cursor: "pointer" }}
                            onClick={() =>
                              router.push(`/products/${product._id}`)
                            }
                          />
                          {discount > 0 && (
                            <span className="cat-badge-discount">
                              {discount}% OFF
                            </span>
                          )}
                          {outOfStock && (
                            <span className="cat-badge-out">Out of Stock</span>
                          )}
                        </div>
                      ) : (
                        <div
                          className="cat-product-img-placeholder"
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            router.push(`/products/${product._id}`)
                          }
                        >
                          <i className="bi bi-image"></i>
                          {discount > 0 && (
                            <span className="cat-badge-discount">
                              {discount}% OFF
                            </span>
                          )}
                          {outOfStock && (
                            <span className="cat-badge-out">Out of Stock</span>
                          )}
                        </div>
                      )}

                      {/* Body */}
                      <div className="cat-product-body">
                        <Link
                          href={`/products/${product._id}`}
                          className="cat-product-name"
                        >
                          {product.name.length > 35
                            ? product.name.substring(0, 35) + "…"
                            : product.name}
                        </Link>

                        <div className="d-flex align-items-baseline">
                          <span className="cat-product-price">
                            {formatPrice(product.finalPrice || product.price)}
                          </span>
                          {product.finalPrice &&
                            product.finalPrice < product.price && (
                              <span className="cat-product-price-old">
                                {formatPrice(product.price)}
                              </span>
                            )}
                        </div>

                        <div className="cat-product-actions">
                          <button
                            className="btn-cat-view"
                            onClick={() =>
                              router.push(`/products/${product._id}`)
                            }
                          >
                            <i className="bi bi-eye me-1"></i>View
                          </button>
                          <button
                            className={`btn-cat-cart ${!user ? "btn-login-state" : ""}`}
                            disabled={outOfStock || isAdding}
                            onClick={() => addToCart(product._id, product.name)}
                          >
                            {isAdding ? (
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                              ></span>
                            ) : (
                              <>
                                <i
                                  className={`bi ${outOfStock ? "bi-x-circle" : "bi-cart-plus"} me-1`}
                                ></i>
                                {outOfStock
                                  ? "Sold out"
                                  : !user
                                    ? "Login"
                                    : "Add"}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
