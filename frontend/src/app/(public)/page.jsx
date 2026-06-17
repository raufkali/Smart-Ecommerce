"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import "./homepage.css";
import BackendImage from "@/app/components/BackendImage";

// ── Custom Hooks ────────────────────────────────────────────────────────────
const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);
  const close = useCallback(() => setToast(null), []);
  return { toast, show, close };
};

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [hasToken, setHasToken] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setHasToken(!!token);
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            if (["admin", "seller"].includes(data.user.role)) {
              router.push(`/${data.user.role}/dashboard`);
            }
          } else {
            localStorage.removeItem("token");
          }
        })
        .catch(() => localStorage.removeItem("token"));
    }
  }, [router]);
  return { user, hasToken };
};

// ── Toast Component ─────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  const config = {
    success: { bg: "#10b981", icon: "✅" },
    error: { bg: "#ef4444", icon: "❌" },
    warning: { bg: "#f59e0b", icon: "⚠️" },
    info: { bg: "#3b82f6", icon: "ℹ️" },
  }[type] || { bg: "#6b7280", icon: "🔔" };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="toast-container"
      style={{ background: config.bg }}
    >
      <span style={{ fontSize: 18 }}>{config.icon}</span>
      <span>{message}</span>
      <button onClick={onClose} className="toast-close">
        ×
      </button>
    </motion.div>
  );
};

// ── Product Card (Professional, not too wide) ───────────────────────────────
const ProductCard = React.memo(
  ({
    product,
    user,
    hasToken,
    addingToCart,
    onAddToCart,
    onLoginPrompt,
    formatPrice,
    calculateDiscount,
  }) => {
    const discount = calculateDiscount(product.price, product.finalPrice);
    const isAdding = addingToCart[product._id];
    const outOfStock = product.stock <= 0;
    const lowStock = !outOfStock && product.stock < 5;

    const handleAddToCart = () => {
      if (!user || !hasToken) {
        onLoginPrompt();
        return;
      }
      onAddToCart(product._id, product.name);
    };

    return (
      <motion.div
        className="product-card"
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
      >
        <div className="product-image-container">
          <Link href={`/products/${product._id}`} className="product-link">
            <Image
              src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${product.images?.[0] || "/placeholder.jpg"}`}
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
            <span className="badge-discount">{discount}% OFF</span>
          )}
          {outOfStock ? (
            <span className="badge-out-of-stock">Sold Out</span>
          ) : (
            lowStock && (
              <span className="badge-low-stock">{product.stock} left</span>
            )
          )}
        </div>

        <div className="product-body">
          <Link href="/categories" className="category-badge">
            {product.category?.name || "Uncategorized"}
          </Link>

          <Link href={`/products/${product._id}`} className="product-title">
            <h3>
              {product.name.length > 40
                ? `${product.name.substring(0, 40)}…`
                : product.name}
            </h3>
          </Link>

          <p className="product-description">
            {product.description?.substring(0, 65) ||
              "No description available"}
            …
          </p>

          <div className="product-price">
            <span className="current-price">
              {formatPrice(product.finalPrice || product.price)}
            </span>
            {product.finalPrice && product.finalPrice < product.price && (
              <span className="original-price">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <button
            className="add-to-cart-btn"
            disabled={outOfStock || isAdding}
            onClick={handleAddToCart}
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
                  : !user || !hasToken
                    ? "Login to Buy"
                    : "Add to Cart"}
              </>
            )}
          </button>
        </div>
      </motion.div>
    );
  },
);

// ── Hero Banner with Glassmorphism Effect ───────────────────────────────────
const HeroBanner = ({ banners, currentSlide, onSlideChange }) => {
  return (
    <section className="hero-section">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
          className="hero-slide"
        >
          <Image
            src={banners[currentSlide].img}
            alt={banners[currentSlide].title}
            fill
            priority
            sizes="100vw"
            className="hero-image"
            style={{ objectFit: "cover" }}
          />
          {/* Glassmorphism overlay */}
          <div className="hero-glass-overlay" />
          <div className="hero-content">
            <motion.span
              className="hero-badge"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {banners[currentSlide].subtitle}
            </motion.span>
            <motion.h1
              className="hero-title"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {banners[currentSlide].title}
            </motion.h1>
            <motion.p
              className="hero-description"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {banners[currentSlide].desc}
            </motion.p>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Link href={banners[currentSlide].link} className="hero-cta">
                {banners[currentSlide].btn}
                <i className="bi bi-arrow-right" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="hero-nav">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`nav-dot ${index === currentSlide ? "active" : ""}`}
            onClick={() => onSlideChange(index)}
          />
        ))}
      </div>

      <button
        className="nav-arrow prev"
        onClick={() =>
          onSlideChange((currentSlide - 1 + banners.length) % banners.length)
        }
      >
        <i className="bi bi-chevron-left" />
      </button>
      <button
        className="nav-arrow next"
        onClick={() => onSlideChange((currentSlide + 1) % banners.length)}
      >
        <i className="bi bi-chevron-right" />
      </button>
    </section>
  );
};

// ── Featured Product Spotlight Carousel - Enhanced ─────────────────────────
const FeaturedProductSpotlight = ({
  products,
  formatPrice,
  onAddToCart,
  user,
  hasToken,
  addingToCart,
  onLoginPrompt,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    if (!isHovered && products.length > 0) {
      setProgressWidth(0);
      const timer = setTimeout(() => setProgressWidth(100), 100);

      const interval = setInterval(() => {
        setCurrentIndex((prev) => {
          setProgressWidth(0);
          const timer2 = setTimeout(() => setProgressWidth(100), 100);
          return (prev + 1) % products.length;
        });
      }, 6000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [isHovered, products.length]);

  if (!products.length) return null;

  const product = products[currentIndex];
  const discount =
    product.discount > 0
      ? Math.round(((product.price - product.finalPrice) / product.price) * 100)
      : 0;
  const isAdding = addingToCart[product._id];
  const outOfStock = product.stock <= 0;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    setProgressWidth(0);
    setTimeout(() => setProgressWidth(100), 100);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
    setProgressWidth(0);
    setTimeout(() => setProgressWidth(100), 100);
  };

  return (
    <section
      className="spotlight-section"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="container">
        <div className="spotlight-header">
          <h2>Featured Product Spotlight</h2>
          <p>Discover our handpicked selection of premium products</p>
        </div>

        <div className="spotlight-carousel">
          <motion.div
            key={product._id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="spotlight-card"
          >
            {/* Fixed image container */}
            <div className="spotlight-image-container">
              <Image
                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${product.images?.[0] || "/placeholder.jpg"}`}
                alt={product.name}
                width={600}
                height={600}
                className="spotlight-img"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {discount > 0 && (
                <span className="spotlight-discount">-{discount}% OFF</span>
              )}
            </div>

            <div className="spotlight-content">
              <span className="spotlight-category">
                {product.category?.name || "Premium Collection"}
              </span>
              <h3 className="spotlight-title">{product.name}</h3>
              <p className="spotlight-description">
                {product.description?.substring(0, 120) ||
                  "Discover excellence with this premium product, crafted for those who appreciate quality and style."}
              </p>

              <div className="spotlight-price">
                <span className="spotlight-current">
                  {formatPrice(product.finalPrice || product.price)}
                </span>
                {product.finalPrice && product.finalPrice < product.price && (
                  <span className="spotlight-original">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>

              <div className="spotlight-features">
                <div className="feature-item">
                  <i className="bi bi-shield-check" />
                  <span>Quality Guaranteed</span>
                </div>
                <div className="feature-item">
                  <i className="bi bi-truck" />
                  <span>Free Shipping</span>
                </div>
                <div className="feature-item">
                  <i className="bi bi-arrow-repeat" />
                  <span>30-Day Returns</span>
                </div>
              </div>

              <div className="spotlight-actions">
                <button
                  className="spotlight-cart-btn"
                  disabled={outOfStock || isAdding}
                  onClick={() => {
                    if (!user || !hasToken) {
                      onLoginPrompt();
                      return;
                    }
                    onAddToCart(product._id, product.name);
                  }}
                >
                  {isAdding ? (
                    <>
                      <span className="spinner" /> Adding...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cart-plus" />
                      {outOfStock ? "Sold Out" : "Add to Cart"}
                    </>
                  )}
                </button>
                <Link
                  href={`/products/${product._id}`}
                  className="spotlight-view-btn"
                >
                  View Details <i className="bi bi-arrow-right" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Progress bar */}
          {!isHovered && (
            <div className="spotlight-progress">
              <div
                className={`spotlight-progress-bar ${progressWidth === 100 ? "animating" : ""}`}
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          )}
        </div>

        <div className="spotlight-nav">
          <button className="spotlight-nav-btn prev" onClick={handlePrev}>
            <i className="bi bi-chevron-left" />
          </button>
          <div className="spotlight-dots">
            {products.map((_, idx) => (
              <button
                key={idx}
                className={`spotlight-dot ${idx === currentIndex ? "active" : ""}`}
                onClick={() => {
                  setCurrentIndex(idx);
                  setProgressWidth(0);
                  setTimeout(() => setProgressWidth(100), 100);
                }}
              />
            ))}
          </div>
          <button className="spotlight-nav-btn next" onClick={handleNext}>
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      </div>
    </section>
  );
};

// ── Section Header ─────────────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, href, centered = false }) => (
  <header className={`section-header ${centered ? "centered" : ""}`}>
    <div>
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
    {href && !centered && (
      <Link href={href} className="view-all-btn">
        View All <i className="bi bi-arrow-right" />
      </Link>
    )}
  </header>
);

// ── Products Grid ──────────────────────────────────────────────────────────
const ProductsGrid = ({ products, loading, ...props }) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader-spinner" />
        <p>Loading products…</p>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📦</div>
        <p>No products available</p>
      </div>
    );
  }

  return (
    <div className="products-grid">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} {...props} />
      ))}
    </div>
  );
};

// ── Main HomePage Component ─────────────────────────────────────────────────
const HomePage = () => {
  const router = useRouter();
  const { toast, show, close } = useToast();
  const { user, hasToken } = useAuth();

  const [data, setData] = useState({
    featuredProducts: [],
    discountedProducts: [],
    newArrivals: [],
    categories: [],
    spotlightProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = useMemo(
    () => [
      {
        id: 1,
        title: "Summer Sale Extravaganza",
        subtitle: "Up to 50% OFF",
        desc: "Shop the hottest trends of the season with massive discounts",
        btn: "Shop Now",
        link: "/products",
        img: "/img/banner1.jpg",
      },
      {
        id: 2,
        title: "New Arrivals",
        subtitle: "Fresh Drops",
        desc: "Be the first to grab these exclusive new items",
        btn: "Explore New",
        link: "/products?sort=newest",
        img: "/img/banner2.jpg",
      },
      {
        id: 3,
        title: "Tech Deals",
        subtitle: "Best Prices",
        desc: "Latest gadgets with up to 30% discount this week only",
        btn: "Shop Tech",
        link: "/products?category=electronics",
        img: "/img/banner3.jpg",
      },
    ],
    [],
  );

  const formatPrice = useCallback(
    (price) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price),
    [],
  );

  const calculateDiscount = useCallback((price, finalPrice) => {
    if (!finalPrice || finalPrice >= price) return 0;
    return Math.round(((price - finalPrice) / price) * 100);
  }, []);

  const addToCart = useCallback(
    async (productId, productName) => {
      try {
        setAddingToCart((prev) => ({ ...prev, [productId]: true }));
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

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Failed to add to cart");
        }
        show(`${productName} added to cart!`, "success");
      } catch (error) {
        show(error.message || "Failed to add item", "error");
      } finally {
        setAddingToCart((prev) => ({ ...prev, [productId]: false }));
      }
    },
    [show],
  );

  const onLoginPrompt = useCallback(() => {
    show("Please login to add items to cart", "info");
    setTimeout(() => router.push("/login"), 1500);
  }, [router, show]);

  useEffect(() => {
    const interval = setInterval(
      () => setCurrentSlide((prev) => (prev + 1) % banners.length),
      10000,
    );
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/?isActive=true`,
          ),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/category/`),
        ]);

        const products = productsRes.ok
          ? (await productsRes.json()).products || []
          : [];
        const categories = categoriesRes.ok
          ? (await categoriesRes.json()).categories || []
          : [];

        // Get 5 random products for spotlight
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        const spotlightProducts = shuffled.slice(0, 5);

        setData({
          featuredProducts: products.slice(0, 8),
          discountedProducts: products
            .filter((p) => p.discount > 0)
            .slice(0, 8),
          newArrivals: [...products]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 8),
          categories: categories.slice(0, 8),
          spotlightProducts,
        });
      } catch (error) {
        console.error("Failed to fetch data:", error);
        show("Failed to load products", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [show]);

  const cardProps = useMemo(
    () => ({
      user,
      hasToken,
      addingToCart,
      onAddToCart: addToCart,
      onLoginPrompt,
      formatPrice,
      calculateDiscount,
    }),
    [
      user,
      hasToken,
      addingToCart,
      addToCart,
      onLoginPrompt,
      formatPrice,
      calculateDiscount,
    ],
  );

  const getCategoryIcon = (name = "") => {
    const icons = {
      electronic: "laptop",
      electronics: "laptop",
      tech: "cpu",
      cloth: "t-shirt",
      clothing: "t-shirt",
      fashion: "bag",
      book: "book",
      books: "book",
      home: "house",
      furniture: "chair",
      kitchen: "cup-hot",
      sport: "bicycle",
      sports: "basketball",
      fitness: "heart-pulse",
    };
    const key = Object.keys(icons).find((k) => name.toLowerCase().includes(k));
    return icons[key] || "grid";
  };

  return (
    <main className="homepage">
      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={close} />
        )}
      </AnimatePresence>

      <HeroBanner
        banners={banners}
        currentSlide={currentSlide}
        onSlideChange={setCurrentSlide}
      />

      {/* Trust Bar */}
      <section className="trust-bar">
        <div className="container">
          <div className="row g-0 text-center">
            {[
              { icon: "bi-truck", label: "Free Shipping over $50" },
              { icon: "bi-arrow-repeat", label: "30-Day Returns" },
              { icon: "bi-shield-check", label: "Secure Payment" },
              { icon: "bi-headset", label: "24/7 Support" },
            ].map((item, i) => (
              <div key={i} className="col-6 col-md-3">
                <div className="trust-item">
                  <i className={`bi ${item.icon}`} />
                  <span>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Product Spotlight (NEW!) */}
      <FeaturedProductSpotlight
        products={data.spotlightProducts}
        formatPrice={formatPrice}
        onAddToCart={addToCart}
        user={user}
        hasToken={hasToken}
        addingToCart={addingToCart}
        onLoginPrompt={onLoginPrompt}
      />

      {/* Categories */}
      <section className="categories-section container-fluid py-4">
        <div className="row g-3 d-flex align-items-stretch justify-content-center">
          {data.categories.map((category) => (
            <div
              key={category._id}
              className="col-xl-1 col-lg-1 col-md-2 col-5"
            >
              <Link
                href={`/products?category=${category._id}`}
                className="category-card"
              >
                <div className="category-icon">
                  <i className={`bi bi-${getCategoryIcon(category.name)}`} />
                  {/* <p className="category-name">{category.name}</p> */}
                  {category.description && (
                    <span className="category-description">
                      {category.description.length > 35
                        ? `${category.description.substring(0, 35)}...`
                        : category.description}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Best Deals */}
      {data.discountedProducts.length > 0 && (
        <section className="deals-section container-fluid p-5">
          <SectionHeader
            title="Best Deals"
            subtitle="Limited time discounts"
            href="/products?discount=true"
          />
          <ProductsGrid
            products={data.discountedProducts}
            loading={loading}
            {...cardProps}
          />
        </section>
      )}

      {/* New Arrivals */}
      <section
        className="new-arrivals-section py-5"
        style={{ background: "#f8fafc" }}
      >
        <div className="container">
          <SectionHeader
            title="New Arrivals"
            subtitle="Fresh from our suppliers"
            href="/products?sort=newest"
          />
          <ProductsGrid
            products={data.newArrivals}
            loading={loading}
            {...cardProps}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="cta-section py-5"
        style={{
          background: "linear-gradient(135deg, #1C4D8D 0%, #2563eb 100%)",
        }}
      >
        <div className="container text-center">
          <h2 className="cta-title">Ready to start shopping?</h2>
          <p className="cta-subtitle">
            Join 50K+ happy customers who trust ShopNest
          </p>
          <div className="cta-buttons">
            <Link href="/products" className="cta-button primary">
              <i className="bi bi-bag" /> Browse Products
            </Link>
            {!hasToken && (
              <Link href="/login" className="cta-button secondary">
                <i className="bi bi-person" /> Create Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
