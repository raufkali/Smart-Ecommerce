// Navbar.jsx - Complete rebuild with Role-Based Dropdowns
"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import "./Navbar.css";

const Navbar = ({ items = [], brandName = "SHOPNEST", brandLink = "/" }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setUser(null);
        return;
      }

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
          localStorage.removeItem("token");
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      }
    };

    fetchUserData();
  }, [pathname]);

  // Update cart count
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.length);
    };

    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdate", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdate", updateCartCount);
    };
  }, []);

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("cart");
      setUser(null);
      window.dispatchEvent(new Event("authChange"));
      router.push("/");
    }
  };

  const getIcon = (iconName) => {
    const iconMap = {
      house: "bi bi-house",
      grid: "bi bi-grid",
      tags: "bi bi-tags",
      bag: "bi bi-bag",
      "bag-check": "bi bi-bag-check",
      bagCheck: "bi bi-bag-check",
      speedometer2: "bi bi-speedometer2",
      person: "bi bi-person",
      cart: "bi bi-cart",
      orders: "bi bi-bag-check",
      boxArrowRight: "bi bi-box-arrow-right",
      gear: "bi bi-gear",
    };
    return iconMap[iconName] || "bi bi-circle";
  };

  const isLoggedIn = !!user;

  return (
    <>
      <nav className={`shopnest-navbar my-0 ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-container">
          {/* Brand */}
          <Link href={brandLink} className="navbar-brand">
            <span className="brand-text">{brandName}</span>
          </Link>

          {/* Mobile Toggle */}
          <button
            className="mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <i className="bi bi-list"></i>
          </button>

          {/* Desktop/Mobile Navigation */}
          <div className={`desktop-nav ${isMobileMenuOpen ? "open" : ""}`}>
            <ul className="nav-links">
              {items.map((item, index) => {
                const isActive = pathname === item.link;

                return (
                  <li className="nav-item" key={index}>
                    <Link
                      href={item.link}
                      className={`nav-link p-2 ${isActive ? "active" : ""}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <i className={getIcon(item.icon)}></i>
                      <span className="ms-2">{item.name}</span>
                      {item.badge && (
                        <span className="nav-badge">{item.badge}</span>
                      )}
                    </Link>
                  </li>
                );
              })}

              {/* User Menu or Login */}
              {isLoggedIn ? (
                <li className="nav-item user-menu">
                  <button
                    className="user-dropdown-toggle"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <div className="user-avatar">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.fullname}
                          width="32"
                          height="32"
                          style={{ borderRadius: "50%" }}
                        />
                      ) : (
                        <i className="bi bi-person-circle"></i>
                      )}
                    </div>
                    <span className="user-name">
                      {user?.fullname?.split(" ")[0] || "User"}
                    </span>
                    <i
                      className={`bi bi-chevron-${isUserMenuOpen ? "up" : "down"}`}
                    ></i>
                  </button>

                  <div
                    className={`dropdown-menu-custom ${isUserMenuOpen ? "show" : ""}`}
                  >
                    {/* Mobile Header */}
                    <div className="dropdown-header-custom d-lg-none">
                      <div className="user-fullname">{user?.fullname}</div>
                      <div className="user-role-badge">{user?.role}</div>
                    </div>

                    {/* ── ADMIN DROPDOWN ── */}
                    {user?.role === "admin" && (
                      <>
                        <Link
                          href="/admin/dashboard"
                          className="dropdown-item-custom"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="bi bi-speedometer2"></i>
                          Dashboard
                        </Link>
                        <div className="dropdown-divider-custom"></div>
                        <button
                          className="dropdown-item-custom text-danger"
                          onClick={handleLogout}
                        >
                          <i className="bi bi-box-arrow-right"></i>
                          Logout
                        </button>
                      </>
                    )}

                    {/* ── SELLER DROPDOWN ── */}
                    {user?.role === "seller" && (
                      <>
                        <Link
                          href="/seller/dashboard"
                          className="dropdown-item-custom"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="bi bi-shop"></i>
                          Dashboard
                        </Link>
                        <div className="dropdown-divider-custom"></div>
                        <button
                          className="dropdown-item-custom text-danger"
                          onClick={handleLogout}
                        >
                          <i className="bi bi-box-arrow-right"></i>
                          Logout
                        </button>
                      </>
                    )}

                    {/* ── BUYER/USER DROPDOWN ── */}
                    {(user?.role === "user" || !user?.role) && (
                      <>
                        <Link
                          href="/profile"
                          className="dropdown-item-custom"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="bi bi-person"></i>
                          Profile
                        </Link>
                        <Link
                          href="/orders"
                          className="dropdown-item-custom"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="bi bi-bag-check"></i>
                          My Orders
                        </Link>
                        <Link
                          href="/settings"
                          className="dropdown-item-custom"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="bi bi-gear"></i>
                          Settings
                        </Link>
                        <div className="dropdown-divider-custom"></div>
                        <button
                          className="dropdown-item-custom text-danger"
                          onClick={handleLogout}
                        >
                          <i className="bi bi-box-arrow-right"></i>
                          Logout
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ) : (
                <li className="nav-item">
                  <Link
                    href="/login"
                    className="nav-link login-btn"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <i className="bi bi-box-arrow-in-right"></i>
                    Login
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="navbar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
