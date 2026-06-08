"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import "./productDetail.css";

/* ─── Toast ─────────────────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const cfg = {
    success: { bg: "#10b981", icon: "bi-check-circle-fill" },
    error: { bg: "#ef4444", icon: "bi-exclamation-circle-fill" },
    warning: { bg: "#f59e0b", icon: "bi-exclamation-triangle-fill" },
    info: { bg: "#3b82f6", icon: "bi-info-circle-fill" },
  }[type] || { bg: "#6b7280", icon: "bi-bell-fill" };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="toast-notification"
      style={{ background: cfg.bg }}
    >
      <i className={`bi ${cfg.icon}`}></i>
      <span>{message}</span>
      <button onClick={onClose} className="toast-close">
        <i className="bi bi-x-lg"></i>
      </button>
    </motion.div>
  );
};

/* ─── Star display (read-only) ───────────────────────────────── */
const Stars = ({ rating = 0, size = 14 }) => (
  <div className="stars">
    {[1, 2, 3, 4, 5].map((s) => (
      <i
        key={s}
        className={`bi ${s <= Math.round(rating) ? "bi-star-fill filled" : "bi-star"}`}
        style={{ fontSize: size }}
      />
    ))}
  </div>
);

/* ─── Rating Breakdown bars ──────────────────────────────────── */
const RatingBreakdown = ({ reviews = [], total = 0 }) => {
  const safeTotal = total || 1;
  return (
    <div className="rating-breakdown">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter(
          (r) => Math.round(r.rating) === star,
        ).length;
        return (
          <div className="rbd-row" key={star}>
            <span className="rbd-label">
              {star}{" "}
              <i
                className="bi bi-star-fill"
                style={{ fontSize: 9, color: "var(--gold)" }}
              />
            </span>
            <div className="rbd-bar-bg">
              <div
                className="rbd-bar-fill"
                style={{ width: `${(count / safeTotal) * 100}%` }}
              />
            </div>
            <span className="rbd-count">{count}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Skeleton loader for reviews ───────────────────────────── */
const ReviewSkeleton = () => (
  <>
    {[1, 2, 3].map((i) => (
      <div className="review-skeleton" key={i}>
        <div className="skeleton-line short" />
        <div className="skeleton-line medium" />
        <div className="skeleton-line full" />
        <div className="skeleton-line medium" />
      </div>
    ))}
  </>
);

/* ─── Main Page ──────────────────────────────────────────────── */
const ProductDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [user, setUser] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [toast, setToast] = useState(null);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Seller
  const [seller, setSeller] = useState(null);
  const [totalOrders, setTotalOrders] = useState(null);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });
  const closeToast = () => setToast(null);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  /* ── Fetch user ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setUser(d.user))
      .catch(console.error);
  }, []);

  /* ── Fetch product ── */
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`${API}/products/${productId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setProduct(d.product || d))
      .catch(() => {
        setError("Failed to load product.");
        showToast("Failed to load product", "error");
      })
      .finally(() => setLoading(false));
  }, [productId]);

  /* ── Fetch seller details ── */
  useEffect(() => {
    if (!product?.sellerId) return;
    const sid = product.sellerId?._id || product.sellerId;

    // Try to get full seller profile
    fetch(`${API}/users/${sid}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSeller(d.user || d))
      .catch(() => {});

    // Optional seller order stats — silently ignore if endpoint missing
    fetch(`${API}/orders/seller/${sid}/stats`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (d) => d && setTotalOrders(d.totalOrders ?? d.totalPurchases ?? null),
      )
      .catch(() => {});
  }, [product]);

  /* ── Fetch reviews ── */
  const fetchReviews = useCallback(
    async (page = 1, append = false) => {
      if (!productId) return;
      setReviewLoading(true);
      try {
        // Fix: Use the correct endpoint format - targetType is "Product"
        const res = await fetch(
          `${API}/reviews/Product/${productId}?page=${page}&limit=6`,
        );
        const data = await res.json();

        if (data.success) {
          const list = data.reviews || [];
          setReviews((prev) => (append ? [...prev, ...list] : list));
          setHasMore(data.pagination ? page < data.pagination.pages : false);
          setReviewPage(page);
        } else {
          console.error("Reviews fetch failed:", data.message);
          setReviews([]);
        }
      } catch (err) {
        console.error("Reviews fetch failed:", err);
        setReviews([]);
      } finally {
        setReviewLoading(false);
      }
    },
    [API, productId], // Added API to dependencies
  );

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  /* ── Add to cart ── */
  const addToCart = async () => {
    if (!user) {
      showToast("Please login to add items to cart", "info");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }
    try {
      setAddingToCart(true);
      const res = await fetch(`${API}/cart/add`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ productId: product._id, quantity }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || "Failed");
      }
      showToast(`${quantity} × ${product.name} added to cart!`, "success");
    } catch (err) {
      showToast(
        err.message.includes("low on Stock")
          ? `Only ${product.stock} items available!`
          : err.message,
        "warning",
      );
    } finally {
      setAddingToCart(false);
    }
  };

  /* ── Buy now ── */
  const buyNow = async () => {
    if (!user) {
      showToast("Please login to continue", "info");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }
    try {
      setAddingToCart(true);
      const res = await fetch(`${API}/cart/add`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ productId: product._id, quantity }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || "Failed");
      }
      showToast("Redirecting to checkout…", "success");
      setTimeout(() => router.push("/cart"), 900);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAddingToCart(false);
    }
  };

  /* ── Helpers ── */
  const fmt = (p) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(p);
  const discount = product
    ? Math.round(
        ((product.price - (product.finalPrice || product.price)) /
          product.price) *
          100,
      )
    : 0;
  const images = product?.images?.length ? product.images : [];
  const getImg = (img) => {
    if (!img) return "/placeholder.jpg";
    if (img.startsWith("http")) return img;
    return `${API}${img}`;
  };
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  const initials = (name = "") =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const sellerData = seller || product?.sellerId || {};
  const sellerName = sellerData?.fullname || "Store";

  if (loading)
    return (
      <div className="loading-container">
        <div className="loader-spinner" />
        <p>Loading product…</p>
      </div>
    );

  if (error || !product)
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <i className="bi bi-exclamation-triangle-fill" />
        </div>
        <p>{error || "Product not found"}</p>
        <Link href="/" className="cta-button primary">
          <i className="bi bi-arrow-left" /> Back to Home
        </Link>
      </div>
    );

  return (
    <>
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        )}
      </AnimatePresence>

      <div className="product-detail-page">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="product-breadcrumb">
            <Link href="/">Home</Link>
            <i className="bi bi-chevron-right" />
            <Link href="/products">Products</Link>
            <i className="bi bi-chevron-right" />
            <span>{product.name}</span>
          </nav>

          {/* ── Top grid ── */}
          <div className="product-detail-grid">
            {/* Gallery */}
            <div className="product-gallery">
              <div className="product-main-image">
                <img
                  src={getImg(images[selectedImage] || images[0])}
                  alt={product.name}
                />
                {discount > 0 && (
                  <span className="product-discount-badge">-{discount}%</span>
                )}
              </div>
              {images.length > 1 && (
                <div className="product-thumbnails">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      className={`product-thumbnail ${selectedImage === i ? "active" : ""}`}
                      onClick={() => setSelectedImage(i)}
                    >
                      <img src={getImg(img)} alt={`${product.name} ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="product-info-card">
              <span className="product-category">
                {product.category?.name || "Premium Product"}
              </span>
              <h1 className="product-title">{product.name}</h1>

              {/* Rating summary pill */}
              {product.numReviews > 0 && (
                <div className="product-rating-summary">
                  <span className="rating-score">
                    {(product.averageRating || 0).toFixed(1)}
                  </span>
                  <div className="rating-stars-wrap">
                    <Stars rating={product.averageRating} size={15} />
                    <span className="rating-count">
                      {product.numReviews} review
                      {product.numReviews !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="product-price-wrapper">
                <div className="product-current-price">
                  {fmt(product.finalPrice || product.price)}
                </div>
                {product.finalPrice && product.finalPrice < product.price && (
                  <>
                    <div className="product-original-price">
                      {fmt(product.price)}
                    </div>
                    {discount > 0 && (
                      <span className="product-discount-tag">
                        {discount}% OFF
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Stock */}
              <div className="product-stock-info">
                {product.stock > 0 ? (
                  <>
                    <span className="in-stock">
                      <i className="bi bi-check-circle-fill" /> In Stock
                    </span>
                    {product.stock < 10 && (
                      <span className="low-stock">
                        <i className="bi bi-exclamation-triangle-fill" /> Only{" "}
                        {product.stock} left
                      </span>
                    )}
                  </>
                ) : (
                  <span className="out-of-stock">
                    <i className="bi bi-x-circle-fill" /> Out of Stock
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="product-description-section">
                <h3>Description</h3>
                <p>{product.description || "No description available."}</p>
              </div>

              {/* Quantity */}
              {product.stock > 0 && (
                <div className="product-quantity-section">
                  <label>Quantity</label>
                  <div className="quantity-selector">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || addingToCart}
                    >
                      <i className="bi bi-dash" />
                    </button>
                    <span>{quantity}</span>
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(product.stock, q + 1))
                      }
                      disabled={quantity >= product.stock || addingToCart}
                    >
                      <i className="bi bi-plus" />
                    </button>
                  </div>
                  <span className="max-stock">Max {product.stock}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="product-action-buttons">
                <button
                  className="add-to-cart-btn"
                  onClick={addToCart}
                  disabled={product.stock <= 0 || !user || addingToCart}
                >
                  {addingToCart ? (
                    <>
                      <span className="spinner-small" />
                      Adding…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cart-plus" />
                      {!user ? "Login to Add" : "Add to Cart"}
                    </>
                  )}
                </button>
                <button
                  className="buy-now-btn"
                  onClick={buyNow}
                  disabled={product.stock <= 0 || !user || addingToCart}
                >
                  {addingToCart ? (
                    <>
                      <span className="spinner-small" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-lightning-charge" />
                      Buy Now
                    </>
                  )}
                </button>
              </div>

              {/* Features */}
              <div className="product-features-list">
                <div className="feature">
                  <i className="bi bi-truck" />
                  <span>Free Shipping</span>
                </div>
                <div className="feature">
                  <i className="bi bi-arrow-repeat" />
                  <span>30-Day Return</span>
                </div>
                <div className="feature">
                  <i className="bi bi-shield-check" />
                  <span>Secure Payment</span>
                </div>
              </div>

              {/* Seller quick line */}
              <div className="product-seller-info">
                <i className="bi bi-shop" />
                <span>
                  Sold by: <strong>{sellerName}</strong>
                </span>
              </div>

              <div className="product-sku">
                <span>SKU: {product._id}</span>
              </div>

              {!user && (
                <div className="product-login-warning">
                  <i className="bi bi-info-circle-fill" />
                  <span>
                    Please <Link href="/login">login</Link> to add items to cart
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ══ Sections below ══ */}
          <div className="product-sections">
            {/* ── Seller Card ── */}
            <div className="section-card bg-white">
              <div className="section-header">
                <div className="section-header__left">
                  <div className="section-header__icon">
                    <i className="bi bi-shop" />
                  </div>
                  <h2>About the Seller</h2>
                </div>
              </div>
              <div className="seller-card-body">
                <div className="seller-avatar">{initials(sellerName)}</div>
                <div className="seller-details">
                  <div className="seller-name">{sellerName}</div>
                  <span className="seller-role">Verified Seller</span>
                  <div className="seller-stats">
                    {/* Average rating */}
                    <div className="seller-stat">
                      <span className="seller-stat__val">
                        {(sellerData?.averageRating || 0).toFixed(1)}
                      </span>
                      <span className="seller-stat__label">Avg Rating</span>
                    </div>
                    {/* Seller reviews */}
                    <div className="seller-stat">
                      <span className="seller-stat__val">
                        {sellerData?.numReviews || 0}
                      </span>
                      <span className="seller-stat__label">Reviews</span>
                    </div>
                    {/* Total orders — only if available */}
                    {totalOrders !== null && (
                      <div className="seller-stat">
                        <span className="seller-stat__val">
                          {totalOrders.toLocaleString()}
                        </span>
                        <span className="seller-stat__label">Orders Sold</span>
                      </div>
                    )}
                    {/* Member since */}
                    {sellerData?.createdAt && (
                      <div className="seller-stat">
                        <span className="seller-stat__val">
                          {new Date(sellerData.createdAt).getFullYear()}
                        </span>
                        <span className="seller-stat__label">Member Since</span>
                      </div>
                    )}
                  </div>
                  {/* Seller star row */}
                  {sellerData?.averageRating > 0 && (
                    <div className="seller-stars-row">
                      <Stars rating={sellerData.averageRating} size={13} />
                      <span>({sellerData.numReviews || 0} seller reviews)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Reviews ── */}
            <div className="section-card shadow-sm bg-white">
              <div className="section-header">
                <div className="section-header__left">
                  <div className="section-header__icon">
                    <i className="bi bi-star-half" />
                  </div>
                  <h2>Customer Reviews</h2>
                </div>
                {product.numReviews > 0 && (
                  <span className="section-badge">
                    {product.numReviews} review
                    {product.numReviews !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="reviews-body">
                {/* Overview: big score + breakdown */}
                {product.numReviews > 0 && (
                  <div className="reviews-overview">
                    <div className="reviews-score-big">
                      <span className="reviews-score-big__num">
                        {(product.averageRating || 0).toFixed(1)}
                      </span>
                      <Stars rating={product.averageRating} size={17} />
                      <span className="reviews-score-big__count">
                        {product.numReviews} review
                        {product.numReviews !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <RatingBreakdown
                      reviews={reviews}
                      total={product.numReviews}
                    />
                  </div>
                )}

                {/* List */}
                {reviewLoading && reviews.length === 0 ? (
                  <ReviewSkeleton />
                ) : reviews.length === 0 ? (
                  <div className="reviews-empty">
                    <i className="bi bi-chat-square-text" />
                    <p>No reviews yet for this product.</p>
                  </div>
                ) : (
                  <div className="review-list shadow-sm rounded">
                    {reviews.map((r) => {
                      // Fix: The field is reviewerId, not userId
                      const name =
                        r.reviewerId?.fullname ||
                        r.userId?.fullname || // fallback for backward compatibility
                        r.userName ||
                        "Verified Buyer";
                      return (
                        <div className="review-item" key={r._id}>
                          <div className="review-item__header">
                            <div className="review-item__user">
                              <div className="review-avatar">
                                {initials(name)}
                              </div>
                              <div>
                                <div className="review-user-name">{name}</div>
                                <div className="review-date">
                                  {fmtDate(r.createdAt)}
                                </div>
                              </div>
                            </div>
                            <div className="review-item__stars">
                              <Stars rating={r.rating} size={13} />
                            </div>
                          </div>
                          {r.comment && (
                            <p className="review-comment">{r.comment}</p>
                          )}
                          {r.verifiedPurchase !== false && (
                            <span className="verified-badge">
                              <i className="bi bi-patch-check-fill" /> Verified
                              Purchase
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Load more */}
                {hasMore && (
                  <button
                    className="load-more-btn"
                    onClick={() => fetchReviews(reviewPage + 1, true)}
                    disabled={reviewLoading}
                  >
                    {reviewLoading ? (
                      <>
                        <span className="spinner-small" />
                        Loading…
                      </>
                    ) : (
                      <>
                        <i className="bi bi-chevron-down" />
                        Load More Reviews
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* end product-sections */}
        </div>
      </div>

      <style jsx>{`
        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(0, 0, 0, 0.15);
          border-top-color: currentColor;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

export default ProductDetailPage;
