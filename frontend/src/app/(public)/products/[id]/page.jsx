"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
// Custom Toast Component (you can move this to a separate file later)
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
        aria-label="Close"
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

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .toast-notification.closing {
          animation: slideOut 0.3s ease forwards;
        }
      `}</style>
    </div>
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
  const [isClient, setIsClient] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null);

  // Show toast function
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Close toast function
  const closeToast = () => {
    if (toast) {
      const toastElement = document.querySelector(".toast-notification");
      if (toastElement) {
        toastElement.style.animation = "slideOut 0.3s ease forwards";
        setTimeout(() => {
          setToast(null);
        }, 300);
      } else {
        setToast(null);
      }
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch user if logged in
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token expired or invalid
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

  // Add to cart function using backend API
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

      // Show success toast with quantity
      showToast(
        `${quantity} × ${product.name} added to cart successfully!`,
        "success",
      );

      // Optional: Add a mini cart animation or update cart count in navbar
    } catch (error) {
      console.error("Error adding to cart:", error);

      // Show appropriate error message
      if (error.message.includes("low on Stock")) {
        showToast(
          `Sorry, only ${product.stock} items available in stock!`,
          "warning",
        );
      } else if (error.message.includes("Product Not found")) {
        showToast("Product not found", "error");
      } else {
        showToast(error.message || "Failed to add item to cart", "error");
      }
    } finally {
      setAddingToCart(false);
    }
  };

  // Buy now function
  const buyNow = async () => {
    if (!user) {
      showToast("Please login to continue", "info");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }

    try {
      setAddingToCart(true);

      // First add to cart
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

      // Then redirect to checkout/cart page
      showToast("Redirecting to checkout...", "success");
      setTimeout(() => router.push("/cart"), 1000);
    } catch (error) {
      console.error("Error during buy now:", error);
      showToast(error.message || "Failed to process request", "error");
    } finally {
      setAddingToCart(false);
    }
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Calculate discount percentage
  const calculateDiscount = (price, finalPrice) => {
    if (!finalPrice || finalPrice >= price) return 0;
    return Math.round(((price - finalPrice) / price) * 100);
  };

  // Handle quantity change
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

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="text-muted">Loading product details...</h5>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error || "Product not found"}</div>
        <Link href="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  const discount = calculateDiscount(product.price, product.finalPrice);
  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : ["https://via.placeholder.com/600"];

  return (
    <div className="container py-5">
      {/* Toast Notifications */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/">Home</Link>
          </li>
          <li className="breadcrumb-item">
            <Link href="/products">Products</Link>
          </li>
          <li className="breadcrumb-item">
            <Link href={`/categories/${product.category?._id}`}>
              {product.category?.name || "Category"}
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="row">
        {/* Product Images */}
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm">
            {/* Main Image */}
            <div style={{ height: "400px", width: "100%" }}>
              <Image
                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${product.images[selectedImage]}`}
                alt={product.name}
                className="img-fluid rounded"
                fill
                style={{
                  objectFit: "contain",
                  padding: "20px",
                }}
              />
            </div>

            {/* Thumbnail Images */}
            {productImages.length > 1 && (
              <div className="d-flex gap-2 p-3 border-top overflow-auto">
                {productImages.map((img, index) => (
                  <div
                    key={index}
                    className={`border rounded cursor-pointer p-1 ${
                      selectedImage === index ? "border-primary border-2" : ""
                    }`}
                    style={{
                      width: "70px",
                      height: "70px",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm p-4">
            {/* Title */}
            <h1 className="h2 fw-bold mb-3">{product.name}</h1>

            {/* Seller Info */}
            {product.sellerId && (
              <div className="mb-3">
                <small className="text-muted">
                  <i className="bi bi-shop me-1"></i>
                  Sold by:{" "}
                  <strong>{product.sellerId?.fullname || "Store"}</strong>
                </small>
              </div>
            )}

            {/* Price */}
            <div className="mb-4">
              <span className="h2 fw-bold text-primary">
                {formatPrice(product.finalPrice || product.price)}
              </span>
              {product.finalPrice && product.finalPrice < product.price && (
                <>
                  <span className="text-muted text-decoration-line-through ms-3">
                    {formatPrice(product.price)}
                  </span>
                  <span className="badge bg-danger ms-3 px-3 py-2">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-4">
              {product.stock > 0 ? (
                <>
                  <span className="badge bg-success bg-opacity-10 text-success px-3 py-2">
                    <i className="bi bi-check-circle me-2"></i>
                    In Stock
                  </span>
                  {product.stock < 10 && (
                    <span className="badge bg-warning bg-opacity-10 text-warning ms-2 px-3 py-2">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Only {product.stock} left
                    </span>
                  )}
                </>
              ) : (
                <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2">
                  <i className="bi bi-x-circle me-2"></i>
                  Out of Stock
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mb-4">
              <h5 className="fw-semibold mb-2">Description</h5>
              <p className="text-muted" style={{ whiteSpace: "pre-line" }}>
                {product.description || "No description available."}
              </p>
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="mb-4">
                <label className="form-label fw-semibold">Quantity</label>
                <div className="d-flex align-items-center">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1 || addingToCart}
                  >
                    <i className="bi bi-dash"></i>
                  </button>
                  <span
                    className="mx-3 fs-5 fw-semibold"
                    style={{ minWidth: "40px", textAlign: "center" }}
                  >
                    {quantity}
                  </span>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={increaseQuantity}
                    disabled={quantity >= product.stock || addingToCart}
                  >
                    <i className="bi bi-plus"></i>
                  </button>
                  <span className="ms-3 text-muted">(Max {product.stock})</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="d-flex gap-3 mb-4">
              <button
                className="btn btn-outline-primary flex-grow-1 py-3 position-relative"
                onClick={addToCart}
                disabled={product.stock <= 0 || !user || addingToCart}
              >
                {addingToCart ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="bi bi-cart-plus me-2"></i>
                    {!user ? "Login to Add" : "Add to Cart"}
                  </>
                )}
              </button>
              <button
                className="btn btn-primary flex-grow-1 py-3"
                onClick={buyNow}
                disabled={product.stock <= 0 || !user || addingToCart}
              >
                {addingToCart ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-lightning-charge me-2"></i>
                    Buy Now
                  </>
                )}
              </button>
            </div>

            {/* Product Meta */}
            <div className="border-top pt-4">
              <div className="row g-3">
                <div className="col-6">
                  <small className="text-muted d-block">
                    <i className="bi bi-truck me-2"></i>
                    Free Shipping
                  </small>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">
                    <i className="bi bi-arrow-repeat me-2"></i>
                    30 Days Return
                  </small>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">
                    <i className="bi bi-shield-check me-2"></i>
                    Secure Payment
                  </small>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">
                    <i className="bi bi-tag me-2"></i>
                    {product.category?.name || "Uncategorized"}
                  </small>
                </div>
              </div>
            </div>

            {/* Product ID */}
            <div className="mt-3 text-end">
              <small className="text-muted">Product ID: {product._id}</small>
            </div>

            {/* Login prompt for guests */}
            {!user && (
              <div className="mt-3 alert alert-info py-2 mb-0">
                <i className="bi bi-info-circle me-2"></i>
                <small>
                  Please{" "}
                  <Link href="/login" className="alert-link">
                    login
                  </Link>{" "}
                  to add items to cart
                </small>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .hover-shadow {
          transition: all 0.3s ease;
        }
        .hover-shadow:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default ProductDetailPage;
