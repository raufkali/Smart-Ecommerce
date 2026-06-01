"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import "./Products.css";

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
      className={`toast-notification toast-luxury ${bgMap[type] || "bg-primary"} text-white`}
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
          border-radius: 0.5rem;
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

// ─── Main Page ─────────────────────────────────────────────────
const ProductsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});

  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    minPrice: "",
    maxPrice: "",
    inStock: false,
    search: searchParams.get("search") || "",
  });

  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;

  const showToast = (message, type = "success") => setToast({ message, type });
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/category/`,
      );
      if (res.ok) setCategories((await res.json()).categories || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const q = new URLSearchParams();
      if (filters.category) q.append("category", filters.category);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/products/?${q.toString()}`,
      );
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      let all = data.products || data;

      // Client-side filters (fallback)
      if (filters.category)
        all = all.filter(
          (p) =>
            p.category?._id === filters.category ||
            p.category === filters.category,
        );
      if (filters.minPrice)
        all = all.filter(
          (p) => (p.finalPrice || p.price) >= Number(filters.minPrice),
        );
      if (filters.maxPrice)
        all = all.filter(
          (p) => (p.finalPrice || p.price) <= Number(filters.maxPrice),
        );
      if (filters.inStock) all = all.filter((p) => p.stock > 0);
      if (filters.search) {
        const term = filters.search.toLowerCase();
        all = all.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.description?.toLowerCase().includes(term),
        );
      }

      const sortFns = {
        "price-low": (a, b) =>
          (a.finalPrice || a.price) - (b.finalPrice || b.price),
        "price-high": (a, b) =>
          (b.finalPrice || b.price) - (a.finalPrice || a.price),
        "name-asc": (a, b) => a.name.localeCompare(b.name),
        "name-desc": (a, b) => b.name.localeCompare(a.name),
        newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      };
      all.sort(sortFns[sortBy] || sortFns.newest);

      setTotalProducts(all.length);
      setTotalPages(Math.ceil(all.length / productsPerPage));
      const start = (currentPage - 1) * productsPerPage;
      setProducts(all.slice(start, start + productsPerPage));
    } catch (e) {
      setError("Failed to load products. Please try again later.");
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, currentPage, productsPerPage]);

  // Add to cart
  const addToCart = async (productId, productName) => {
    if (!user) {
      showToast("Please login to add items to cart", "info");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }
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
        const err = await res.json();
        throw new Error(err.message || "Failed to add to cart");
      }
      showToast(`${productName} added to cart!`, "success");
    } catch (e) {
      showToast(e.message || "Failed to add item to cart", "error");
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      inStock: false,
      search: "",
    });
    setSortBy("newest");
    setCurrentPage(1);
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

  // Stock bar fill %: cap at 100, low = under 20%
  const stockBarWidth = (stock, max = 50) => Math.min((stock / max) * 100, 100);

  const priceRanges = [
    { label: "Under $25", min: 0, max: 25 },
    { label: "$25 – $50", min: 25, max: 50 },
    { label: "$50 – $100", min: 50, max: 100 },
    { label: "$100 – $200", min: 100, max: 200 },
    { label: "Over $200", min: 200, max: null },
  ];

  const hasActiveFilters =
    filters.category ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.inStock ||
    filters.search;

  useEffect(() => {
    fetchCategories();
  }, []);
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="products-page container-fluid py-5">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      {/* Header */}
      <div className="row mb-4 products-page-header">
        <div className="col-12">
          <h1 className="mb-2">All Products</h1>
          <p className="lead mb-0">Browse our complete collection</p>
        </div>
      </div>

      {/* Search */}
      <div className="row mb-5">
        <div className="col-md-8 mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchProducts();
            }}
            className="d-flex gap-2"
          >
            <div className="input-group products-search-group flex-grow-1">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search products by name or description…"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <button type="submit" className="btn btn-gold">
              <span>Search</span>
            </button>
          </form>
        </div>
      </div>

      <div className="row">
        {/* ── Sidebar ── */}
        <div className="col-lg-3 mb-4">
          <div className="card filter-card border-0">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="filter-card-title">
                  <i className="bi bi-sliders me-2 text-gold"></i>Filters
                </span>
                <button className="btn btn-filter-reset" onClick={clearFilters}>
                  <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
                </button>
              </div>

              <hr className="filter-divider" />

              {/* Category */}
              <div className="mb-4">
                <span className="filter-section-label">Category</span>
                <select
                  className="form-select"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <hr className="filter-divider" />

              {/* Price Range */}
              <div className="mb-4">
                <span className="filter-section-label">Price Range</span>
                <div className="d-flex gap-2 mb-3">
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Min $"
                    name="minPrice"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    min="0"
                  />
                  <span
                    className="align-self-center text-muted"
                    style={{ fontSize: "0.8rem" }}
                  >
                    –
                  </span>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Max $"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    min="0"
                  />
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {priceRanges.map((range, i) => (
                    <button
                      key={i}
                      className={`btn btn-price-range ${
                        Number(filters.minPrice) === range.min &&
                        (range.max
                          ? Number(filters.maxPrice) === range.max
                          : !filters.maxPrice)
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          minPrice: range.min,
                          maxPrice: range.max || "",
                        }))
                      }
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="filter-divider" />

              {/* In Stock */}
              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="inStock"
                    name="inStock"
                    checked={filters.inStock}
                    onChange={handleFilterChange}
                  />
                  <label
                    className="form-check-label form-label mb-0"
                    htmlFor="inStock"
                  >
                    In Stock Only
                  </label>
                </div>
              </div>

              {/* Active Badges */}
              {hasActiveFilters && (
                <>
                  <hr className="filter-divider" />
                  <span className="filter-section-label">Active</span>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {filters.category && (
                      <span className="active-filter-badge">
                        {
                          categories.find((c) => c._id === filters.category)
                            ?.name
                        }
                        <button
                          className="btn-close-badge"
                          onClick={() =>
                            setFilters((p) => ({ ...p, category: "" }))
                          }
                        >
                          ✕
                        </button>
                      </span>
                    )}
                    {(filters.minPrice || filters.maxPrice) && (
                      <span className="active-filter-badge">
                        ${filters.minPrice || "0"} – ${filters.maxPrice || "∞"}
                        <button
                          className="btn-close-badge"
                          onClick={() =>
                            setFilters((p) => ({
                              ...p,
                              minPrice: "",
                              maxPrice: "",
                            }))
                          }
                        >
                          ✕
                        </button>
                      </span>
                    )}
                    {filters.inStock && (
                      <span className="active-filter-badge">
                        In Stock
                        <button
                          className="btn-close-badge"
                          onClick={() =>
                            setFilters((p) => ({ ...p, inStock: false }))
                          }
                        >
                          ✕
                        </button>
                      </span>
                    )}
                    {filters.search && (
                      <span className="active-filter-badge">
                        "{filters.search}"
                        <button
                          className="btn-close-badge"
                          onClick={() =>
                            setFilters((p) => ({ ...p, search: "" }))
                          }
                        >
                          ✕
                        </button>
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="col-lg-9">
          {/* Toolbar */}
          <div className="d-flex justify-content-between align-items-center products-toolbar">
            <p className="products-count-text mb-0">
              Showing <strong>{products.length}</strong> of{" "}
              <strong>{totalProducts}</strong> products
            </p>
            <div className="d-flex align-items-center gap-2">
              <label
                htmlFor="sortBy"
                className="products-count-text mb-0 small"
              >
                Sort:
              </label>
              <select
                id="sortBy"
                className="form-select sort-select"
                style={{ width: "auto" }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="name-asc">Name: A → Z</option>
                <option value="name-desc">Name: Z → A</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="products-loading">
              <div className="spinner-gold"></div>
              <p className="loading-text">Loading products…</p>
            </div>
          ) : error ? (
            <div className="alert-luxury-danger">{error}</div>
          ) : products.length === 0 ? (
            <div className="products-empty">
              <i className="bi bi-box-seam products-empty-icon"></i>
              <h5>No products found</h5>
              <p>Try adjusting your filters or search criteria</p>
              <button className="btn btn-gold mt-2" onClick={clearFilters}>
                <span>Clear Filters</span>
              </button>
            </div>
          ) : (
            <>
              <div className="row g-4">
                {products.map((product) => {
                  const discount = calculateDiscount(
                    product.price,
                    product.finalPrice,
                  );
                  const isAdding = addingToCart[product._id];
                  const outOfStock = product.stock <= 0;
                  const lowStock = product.stock > 0 && product.stock < 5;
                  const barWidth = stockBarWidth(product.stock);

                  return (
                    <div className="col-md-6 col-xl-4" key={product._id}>
                      <div className="card product-card h-100 border-0">
                        {/* Image */}
                        <Link href={`/products/${product._id}`}>
                          {product.images?.length > 0 ? (
                            <div className="product-img-wrapper">
                              <Image
                                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${product.images[0]}`}
                                alt={product.name}
                                fill
                                style={{
                                  objectFit: "cover",
                                  cursor: "pointer",
                                }}
                              />
                              {/* Hover actions */}
                              <div className="product-img-actions">
                                <span
                                  className="product-img-action-btn"
                                  title="Quick view"
                                >
                                  <i className="bi bi-eye"></i>
                                </span>
                                <span
                                  className="product-img-action-btn"
                                  title="Wishlist"
                                >
                                  <i className="bi bi-heart"></i>
                                </span>
                              </div>
                              {discount > 0 && (
                                <span className="badge-discount">
                                  {discount}% OFF
                                </span>
                              )}
                              {outOfStock && (
                                <span className="badge-out-of-stock">
                                  Out of Stock
                                </span>
                              )}
                              {lowStock && (
                                <span className="badge-low-stock">
                                  Only {product.stock} left
                                </span>
                              )}
                            </div>
                          ) : (
                            <div
                              className="product-img-placeholder"
                              style={{ cursor: "pointer" }}
                            >
                              <i className="bi bi-image"></i>
                              {discount > 0 && (
                                <span className="badge-discount">
                                  {discount}% OFF
                                </span>
                              )}
                              {outOfStock && (
                                <span className="badge-out-of-stock">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          )}
                        </Link>

                        {/* Body */}
                        <div className="card-body">
                          <Link
                            href={`/categories/${product.category?._id}`}
                            className="product-category-chip"
                          >
                            {product.category?.name || "Uncategorized"}
                          </Link>

                          <Link
                            href={`/products/${product._id}`}
                            className="product-card-title"
                          >
                            {product.name.length > 42
                              ? product.name.substring(0, 42) + "…"
                              : product.name}
                          </Link>

                          <p className="product-card-desc">
                            {product.description?.substring(0, 65)}…
                          </p>

                          {/* Price */}
                          <div className="product-price-row">
                            <span className="product-price-current">
                              {formatPrice(product.finalPrice || product.price)}
                            </span>
                            {product.finalPrice &&
                              product.finalPrice < product.price && (
                                <>
                                  <span className="product-price-original">
                                    {formatPrice(product.price)}
                                  </span>
                                  <span className="product-price-save">
                                    Save {discount}%
                                  </span>
                                </>
                              )}
                          </div>

                          {/* Stock bar (only if in stock) */}
                          {!outOfStock && product.stock <= 20 && (
                            <div className="product-stock-bar">
                              <div
                                className={`product-stock-label ${lowStock ? "urgent" : ""}`}
                              >
                                <span>
                                  {lowStock
                                    ? "🔥 Almost gone!"
                                    : "Limited stock"}
                                </span>
                                <span>{product.stock} left</span>
                              </div>
                              <div className="stock-bar-track">
                                <div
                                  className={`stock-bar-fill ${lowStock ? "low" : ""}`}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* CTA */}
                          <button
                            className={`btn-add-cart ${!user ? "btn-login" : ""}`}
                            disabled={outOfStock || isAdding}
                            onClick={() => addToCart(product._id, product.name)}
                          >
                            {isAdding ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                                <span>Adding…</span>
                              </>
                            ) : (
                              <>
                                <i
                                  className={`bi ${outOfStock ? "bi-x-circle" : "bi-cart-plus"} me-2`}
                                ></i>
                                <span>
                                  {outOfStock
                                    ? "Out of Stock"
                                    : !user
                                      ? "Login to Buy"
                                      : "Add to Cart"}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-5">
                  <ul className="pagination pagination-luxury justify-content-center">
                    <li
                      className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(p - 1, 1))
                        }
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>

                    {[...Array(totalPages)].map((_, i) => {
                      const pg = i + 1;
                      if (
                        pg === 1 ||
                        pg === totalPages ||
                        (pg >= currentPage - 1 && pg <= currentPage + 1)
                      ) {
                        return (
                          <li
                            key={pg}
                            className={`page-item ${currentPage === pg ? "active" : ""}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(pg)}
                            >
                              {pg}
                            </button>
                          </li>
                        );
                      } else if (
                        pg === currentPage - 2 ||
                        pg === currentPage + 2
                      ) {
                        return (
                          <li key={pg} className="page-item disabled">
                            <span className="page-link">…</span>
                          </li>
                        );
                      }
                      return null;
                    })}

                    <li
                      className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(p + 1, totalPages))
                        }
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
