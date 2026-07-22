"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import "./productDetail.css";
import ReactMarkDown from "react-markdown";

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
  const [token, setToken] = useState(null);
  const [creatingChat, setCreatingChat] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Seller
  const [seller, setSeller] = useState(null);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });
  const closeToast = () => setToast(null);

  // Get token on client side
  useEffect(() => {
    const authToken = localStorage.getItem("token");
    setToken(authToken);
  }, []);

  // Helper function to get profile picture URL
  const getProfilePictureUrl = (profilePic) => {
    if (!profilePic) return null;
    if (profilePic.startsWith("http")) return profilePic;
    return `${API}/uploads/profiles/${profilePic}`;
  };

  // Helper function to get product image URL
  const getImageUrl = (img) => {
    if (!img) return "/placeholder.jpg";
    if (img.startsWith("http")) return img;
    if (img.startsWith("/uploads")) return `${API}${img}`;
    return `${API}/uploads/products/${img}`;
  };

  /* ── Fetch user ── */
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setUser(d.user))
      .catch(console.error);
  }, [token, API]);

  /* ── Fetch product ── */
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`${API}/products/${productId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        const productData = d.product || d;
        setProduct(productData);

        // If product has sellerId, fetch seller data
        if (productData.sellerId) {
          const sellerId =
            typeof productData.sellerId === "object"
              ? productData.sellerId._id
              : productData.sellerId;

          if (sellerId) {
            fetchSellerData(sellerId);
          }
        }
      })
      .catch(() => {
        setError("Failed to load product.");
        showToast("Failed to load product", "error");
      })
      .finally(() => setLoading(false));
  }, [productId, API]);

  // Function to fetch seller data
  const fetchSellerData = async (sellerId) => {
    try {
      if (product?.sellerId && typeof product.sellerId === "object") {
        setSeller(product.sellerId);
        return;
      }

      if (token) {
        const profileRes = await fetch(`${API}/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const userData = profileData.user || profileData;
          if (userData._id === sellerId || userData.id === sellerId) {
            setSeller(userData);
            return;
          }
        }
      }

      setSeller({
        _id: sellerId,
        fullname: `Seller ${sellerId.slice(-6)}`,
        profilePicture: null,
        averageRating: 0,
        numReviews: 0,
        createdAt: new Date().toISOString(),
        totalProducts: 0,
        responseRate: 98,
        verified: false,
      });
    } catch (error) {
      console.error("Error fetching seller:", error);
      setSeller({
        _id: sellerId,
        fullname: "Shop Owner",
        profilePicture: null,
        averageRating: 0,
        numReviews: 0,
        createdAt: new Date().toISOString(),
        totalProducts: 0,
        responseRate: 98,
        verified: false,
      });
    }
  };

  // Function to create or get chat and redirect
  const startChatWithSeller = async () => {
    if (!token) {
      showToast("Please login to chat with seller", "info");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }

    if (!seller?._id) {
      showToast("Seller information not available", "error");
      return;
    }

    setCreatingChat(true);
    try {
      const checkResponse = await fetch(`${API}/chat/seller/${seller._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let chatId = null;

      if (checkResponse.ok) {
        const data = await checkResponse.json();
        if (data.chat) {
          chatId = data.chat._id;
        }
      }

      if (!chatId) {
        const createResponse = await fetch(`${API}/chat/create-seller-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sellerId: seller._id,
            productId: product._id,
            productName: product.name,
          }),
        });

        if (createResponse.ok) {
          const data = await createResponse.json();
          chatId = data.chat._id;
        }
      }

      if (chatId) {
        let chatRoute = "/chat";
        if (user?.role === "admin") {
          chatRoute = "/admin/chat";
        } else if (user?.role === "seller") {
          chatRoute = "/seller/chat";
        }
        router.push(`${chatRoute}?chat=${chatId}`);
      } else {
        throw new Error("Failed to create or find chat");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      showToast("Failed to start chat. Please try again.", "error");
    } finally {
      setCreatingChat(false);
    }
  };

  /* ── Fetch reviews ── */
  const fetchReviews = useCallback(
    async (page = 1, append = false) => {
      if (!productId) return;
      setReviewLoading(true);
      try {
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
    [API, productId],
  );

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  /* ── Add to cart ── */
  const addToCart = async () => {
    if (!token) {
      showToast("Please login to add items to cart", "info");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }
    try {
      setAddingToCart(true);
      const res = await fetch(`${API}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product._id, quantity }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || "Failed");
      }
      showToast(`${quantity} × ${product.name} added to cart!`, "success");
      window.dispatchEvent(new Event("cartUpdate"));
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
    if (!token) {
      showToast("Please login to continue", "info");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }
    try {
      setAddingToCart(true);
      const res = await fetch(`${API}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
  const getImg = (img) => getImageUrl(img);
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

  const sellerData = seller || {};
  const sellerName = sellerData?.fullname || "Shop Owner";
  const sellerProfilePic = getProfilePictureUrl(sellerData?.profilePicture);
  const sellerRating = sellerData?.averageRating || 0;
  const sellerReviewCount = sellerData?.numReviews || 0;

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
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/placeholder.jpg";
                  }}
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
                      <img
                        src={getImg(img)}
                        alt={`${product.name} ${i + 1}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder.jpg";
                        }}
                      />
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
                <div>
                  <ReactMarkDown>
                    {product.description || "No description available."}
                  </ReactMarkDown>
                </div>
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
                  disabled={product.stock <= 0 || !token || addingToCart}
                >
                  {addingToCart ? (
                    <>
                      <span className="spinner-small" />
                      Adding…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cart-plus" />
                      {!token ? "Login to Add" : "Add to Cart"}
                    </>
                  )}
                </button>
                <button
                  className="buy-now-btn"
                  onClick={buyNow}
                  disabled={product.stock <= 0 || !token || addingToCart}
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

              {/* ── Seller Section (Inline) ── */}
              <div className="product-seller-section">
                <div className="product-seller-info">
                  <span className="seller-label">Sold by:</span>
                  <span className="seller-name-link">{sellerName}</span>

                  {sellerRating > 0 && (
                    <div className="seller-rating-mini">
                      <div className="stars-mini">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <i
                            key={s}
                            className={`bi ${s <= Math.round(sellerRating) ? "bi-star-fill filled" : "bi-star"}`}
                          />
                        ))}
                      </div>
                      <span className="rating-num">
                        {sellerRating.toFixed(1)}
                      </span>
                      <span className="review-count">
                        ({sellerReviewCount})
                      </span>
                    </div>
                  )}

                  {sellerData?.verified && (
                    <span className="seller-badge">
                      <i className="bi bi-patch-check-fill" /> Verified
                    </span>
                  )}
                </div>

                {token && seller?._id && user?._id !== seller?._id && (
                  <button
                    className="chat-with-seller-btn"
                    onClick={startChatWithSeller}
                    disabled={creatingChat}
                  >
                    {creatingChat ? (
                      <>
                        <span className="spinner-small"></span>
                        Starting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-chat-dots"></i>
                        Contact Seller
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="product-sku">
                <span>SKU: {product._id.slice(-8).toUpperCase()}</span>
              </div>

              {!token && (
                <div className="product-login-warning">
                  <i className="bi bi-info-circle-fill" />
                  <span>
                    Please <Link href="/login">login</Link> to add items to cart
                    or chat with seller
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ══ Sections below ══ */}
          <div className="product-sections">
            {/* ── Seller Card (Amazon-style) ── */}
            <div className="section-card">
              <div className="section-header">
                <div className="section-header__left">
                  <div className="section-header__icon">
                    <i className="bi bi-shop" />
                  </div>
                  <h2>About the Seller</h2>
                </div>
                {sellerReviewCount > 0 && (
                  <span className="section-badge">
                    {sellerReviewCount}{" "}
                    {sellerReviewCount === 1 ? "rating" : "ratings"}
                  </span>
                )}
              </div>

              <div className="seller-card-body">
                {/* Avatar */}
                <div className="seller-avatar-wrapper">
                  <div className="seller-avatar">
                    {sellerProfilePic ? (
                      <img
                        src={sellerProfilePic}
                        alt={sellerName}
                        className="seller-avatar-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML =
                            initials(sellerName);
                          e.target.parentElement.classList.add(
                            "avatar-fallback",
                          );
                        }}
                      />
                    ) : (
                      initials(sellerName)
                    )}
                  </div>
                  <span className="seller-badge-text">Verified Seller</span>
                </div>

                {/* Details */}
                <div className="seller-details">
                  <div className="seller-details-top">
                    <div className="seller-name-section">
                      <h3 className="seller-name">{sellerName}</h3>
                      <span className="seller-role-badge">Top Rated</span>
                    </div>

                    {sellerRating > 0 && (
                      <div className="seller-rating-row">
                        <div className="stars">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <i
                              key={s}
                              className={`bi ${s <= Math.round(sellerRating) ? "bi-star-fill filled" : "bi-star"}`}
                            />
                          ))}
                        </div>
                        <span className="rating-text">
                          <strong>{sellerRating.toFixed(1)}</strong> average
                          from {sellerReviewCount}{" "}
                          {sellerReviewCount === 1 ? "rating" : "ratings"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="seller-stats-grid">
                    <div className="seller-stat-item">
                      <span className="stat-value">{sellerReviewCount}</span>
                      <span className="stat-label">Total Reviews</span>
                    </div>
                    {sellerData?.createdAt && (
                      <div className="seller-stat-item">
                        <span className="stat-value">
                          {new Date(sellerData.createdAt).getFullYear()}
                        </span>
                        <span className="stat-label">Member Since</span>
                      </div>
                    )}
                    <div className="seller-stat-item">
                      <span className="stat-value">
                        {sellerData?.totalProducts ||
                          product?.sellerProducts ||
                          0}
                      </span>
                      <span className="stat-label">Products</span>
                    </div>
                    <div className="seller-stat-item">
                      <span className="stat-value">
                        {sellerData?.responseRate || 98}%
                      </span>
                      <span className="stat-label">Response Rate</span>
                    </div>
                  </div>

                  {/* Action Buttons - Only Chat */}
                  <div className="seller-actions">
                    {token && seller?._id && user?._id !== seller?._id && (
                      <button
                        className="seller-action-btn primary"
                        onClick={startChatWithSeller}
                        disabled={creatingChat}
                      >
                        {creatingChat ? (
                          <>
                            <span className="spinner-small"></span>
                            Starting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-chat-dots-fill"></i>
                            Message Seller
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Reviews ── */}
            <div className="section-card">
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

                {reviewLoading && reviews.length === 0 ? (
                  <ReviewSkeleton />
                ) : reviews.length === 0 ? (
                  <div className="reviews-empty">
                    <i className="bi bi-chat-square-text" />
                    <p>No reviews yet for this product.</p>
                  </div>
                ) : (
                  <div className="review-list">
                    {reviews.map((r) => {
                      const name =
                        r.reviewerId?.fullname ||
                        r.userId?.fullname ||
                        r.userName ||
                        "Verified Buyer";
                      const reviewerProfilePic = getProfilePictureUrl(
                        r.reviewerId?.profilePicture ||
                          r.userId?.profilePicture,
                      );

                      return (
                        <div className="review-item" key={r._id}>
                          <div className="review-item__header">
                            <div className="review-item__user">
                              <div className="review-avatar">
                                {reviewerProfilePic ? (
                                  <img
                                    src={reviewerProfilePic}
                                    alt={name}
                                    className="reviewer-avatar-img"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = "none";
                                      e.target.parentElement.innerHTML =
                                        initials(name);
                                    }}
                                  />
                                ) : (
                                  initials(name)
                                )}
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
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;
