"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import "./productDetail.css";

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
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
      style={{ background: config.bg }}
    >
      <i className={`bi ${config.icon}`}></i>
      <span>{message}</span>
      <button onClick={onClose} className="toast-close">
        <i className="bi bi-x-lg"></i>
      </button>
    </motion.div>
  );
};

const ProductDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [user, setUser] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const closeToast = () => setToast(null);

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            localStorage.removeItem("token");
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      }
    };
    fetchUser();
  }, []);

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${productId}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch product details");
        }

        const data = await response.json();
        setProduct(data.product || data);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Failed to load product details. Please try again later.");
        showToast("Failed to load product details", "error");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  // Add to cart
  const addToCart = async () => {
    if (!user) {
      showToast("Please login to add items to cart", "info");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }

    try {
      setAddingToCart(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/cart/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product._id,
            quantity: quantity,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add to cart");
      }

      showToast(`${quantity} × ${product.name} added to cart!`, "success");
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error.message.includes("low on Stock")) {
        showToast(`Only ${product.stock} items available!`, "warning");
      } else {
        showToast(error.message || "Failed to add item to cart", "error");
      }
    } finally {
      setAddingToCart(false);
    }
  };

  // Buy now
  const buyNow = async () => {
    if (!user) {
      showToast("Please login to continue", "info");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }

    try {
      setAddingToCart(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/cart/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product._id,
            quantity: quantity,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add to cart");
      }

      showToast("Redirecting to checkout...", "success");
      setTimeout(() => router.push("/cart"), 1000);
    } catch (error) {
      console.error("Error during buy now:", error);
      showToast(error.message || "Failed to process request", "error");
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const calculateDiscount = (price, finalPrice) => {
    if (!finalPrice || finalPrice >= price) return 0;
    return Math.round(((price - finalPrice) / price) * 100);
  };

  const increaseQuantity = () => {
    if (quantity < (product?.stock || 10)) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.jpg";
    if (imagePath.startsWith("http")) return imagePath;
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}${imagePath}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader-spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <i className="bi bi-exclamation-triangle-fill"></i>
        </div>
        <p>{error || "Product not found"}</p>
        <Link href="/" className="cta-button primary">
          <i className="bi bi-arrow-left"></i> Back to Home
        </Link>
      </div>
    );
  }

  const discount = calculateDiscount(product.price, product.finalPrice);
  const productImages =
    product.images && product.images.length > 0 ? product.images : [];

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
            <i className="bi bi-chevron-right"></i>
            <Link href="/products">Products</Link>
            <i className="bi bi-chevron-right"></i>
            <span>{product.name}</span>
          </nav>

          <div className="product-detail-grid">
            {/* Product Images Section */}
            <div className="product-gallery">
              <div className="product-main-image">
                <img
                  src={getImageUrl(
                    productImages[selectedImage] || product.images?.[0],
                  )}
                  alt={product.name}
                />
                {discount > 0 && (
                  <span className="product-discount-badge">-{discount}%</span>
                )}
              </div>

              {productImages.length > 1 && (
                <div className="product-thumbnails">
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      className={`product-thumbnail ${
                        selectedImage === index ? "active" : ""
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img
                        src={getImageUrl(img)}
                        alt={`${product.name} ${index + 1}`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info Section */}
            <div className="product-info-card">
              <span className="product-category">
                {product.category?.name || "Premium Product"}
              </span>

              <h1 className="product-title">{product.name}</h1>

              <div className="product-price-wrapper">
                <div className="product-current-price">
                  {formatPrice(product.finalPrice || product.price)}
                </div>
                {product.finalPrice && product.finalPrice < product.price && (
                  <div className="product-original-price">
                    {formatPrice(product.price)}
                  </div>
                )}
              </div>

              <div className="product-stock-info">
                {product.stock > 0 ? (
                  <>
                    <span className="in-stock">
                      <i className="bi bi-check-circle-fill"></i> In Stock
                    </span>
                    {product.stock < 10 && (
                      <span className="low-stock">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        Only {product.stock} left
                      </span>
                    )}
                  </>
                ) : (
                  <span className="out-of-stock">
                    <i className="bi bi-x-circle-fill"></i> Out of Stock
                  </span>
                )}
              </div>

              <div className="product-description-section">
                <h3>Description</h3>
                <p>{product.description || "No description available."}</p>
              </div>

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div className="product-quantity-section">
                  <label>Quantity</label>
                  <div className="quantity-selector">
                    <button
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1 || addingToCart}
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <span>{quantity}</span>
                    <button
                      onClick={increaseQuantity}
                      disabled={quantity >= product.stock || addingToCart}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                  <span className="max-stock">Max {product.stock}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="product-action-buttons">
                <button
                  className="add-to-cart-btn"
                  onClick={addToCart}
                  disabled={product.stock <= 0 || !user || addingToCart}
                >
                  {addingToCart ? (
                    <>
                      <span className="spinner-small"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cart-plus"></i>
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
                      <span className="spinner-small"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-lightning-charge"></i>
                      Buy Now
                    </>
                  )}
                </button>
              </div>

              {/* Product Features */}
              <div className="product-features-list">
                <div className="feature">
                  <i className="bi bi-truck"></i>
                  <span>Free Shipping</span>
                </div>
                <div className="feature">
                  <i className="bi bi-arrow-repeat"></i>
                  <span>30 Days Return</span>
                </div>
                <div className="feature">
                  <i className="bi bi-shield-check"></i>
                  <span>Secure Payment</span>
                </div>
              </div>

              {/* Seller Info */}
              {product.sellerId && (
                <div className="product-seller-info">
                  <i className="bi bi-shop"></i>
                  <span>Sold by: {product.sellerId?.fullname || "Store"}</span>
                </div>
              )}

              {/* Product ID */}
              <div className="product-sku">
                <span>SKU: {product._id}</span>
              </div>

              {/* Login Prompt */}
              {!user && (
                <div className="product-login-warning">
                  <i className="bi bi-info-circle-fill"></i>
                  <span>
                    Please <Link href="/login">login</Link> to add items to cart
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(0, 0, 0, 0.2);
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
