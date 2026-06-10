"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import "./Navbar.css";
import NotificationBell from "./NotificationBell";

const Navbar = ({ items = [], brandName = "SHOPNEST", brandLink = "/" }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [fullUserData, setFullUserData] = useState(null);
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
        setFullUserData(null);
        return;
      }

      try {
        // First get basic auth info
        const authResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (authResponse.ok) {
          const authData = await authResponse.json();
          const basicUser = authData.user || authData;
          setUser(basicUser);

          // Then fetch full profile data from profile endpoint
          const profileResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/profile/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const fullProfile = profileData.user || profileData;
            setFullUserData(fullProfile);
          } else {
            // If profile endpoint fails, use basic user data
            setFullUserData(basicUser);
          }
        } else {
          localStorage.removeItem("token");
          setUser(null);
          setFullUserData(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
        setFullUserData(null);
      }
    };

    fetchUserData();

    // Listen for auth changes
    const handleAuthChange = () => {
      fetchUserData();
    };

    window.addEventListener("authChange", handleAuthChange);
    return () => window.removeEventListener("authChange", handleAuthChange);
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
      setFullUserData(null);
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

  // Helper function to get profile picture URL
  const getProfilePictureUrl = () => {
    // Use fullUserData which has complete profile info
    const userData = fullUserData || user;
    if (!userData) return null;

    // Check for profile picture in different possible fields
    const profilePic =
      userData.profilePicture || userData.profileImage || userData.avatar;

    if (profilePic) {
      // If it's a full URL, use it directly
      if (profilePic.startsWith("http")) {
        return profilePic;
      }
      // Otherwise, construct the full URL
      return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/profiles/${profilePic}`;
    }
    return null;
  };

  // Helper function to get user's display name
  const getDisplayName = () => {
    const userData = fullUserData || user;
    if (!userData) return "User";
    return (
      userData.fullname ||
      userData.name ||
      userData.username ||
      userData.email?.split("@")[0] ||
      "User"
    );
  };

  // Helper function to get user's first name (for compact display)
  const getFirstName = () => {
    const fullName = getDisplayName();
    return fullName.split(" ")[0];
  };

  // Get user role
  const getUserRole = () => {
    const userData = fullUserData || user;
    return userData?.role || "user";
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
              <li className="nav-item">
                <NotificationBell />
              </li>
              {/* User Menu or Login */}
              {isLoggedIn ? (
                <li className="nav-item user-menu">
                  <button
                    className="user-dropdown-toggle"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <div className="user-avatar">
                      {getProfilePictureUrl() ? (
                        <img
                          src={getProfilePictureUrl()}
                          alt={getDisplayName()}
                          width="32"
                          height="32"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML =
                              '<i class="bi bi-person-circle"></i>';
                          }}
                        />
                      ) : (
                        <i className="bi bi-person-circle"></i>
                      )}
                    </div>
                    <span className="user-name">{getFirstName()}</span>
                    <i
                      className={`bi bi-chevron-${isUserMenuOpen ? "up" : "down"}`}
                    ></i>
                  </button>

                  <div
                    className={`dropdown-menu-custom ${isUserMenuOpen ? "show" : ""}`}
                  >
                    {/* Mobile Header */}
                    <div className="dropdown-header-custom d-lg-none">
                      <div className="user-fullname">{getDisplayName()}</div>
                      <div className="user-role-badge">{getUserRole()}</div>
                    </div>

                    {/* Show profile picture in dropdown on mobile */}
                    <div className="dropdown-user-info d-lg-none">
                      {getProfilePictureUrl() && (
                        <img
                          src={getProfilePictureUrl()}
                          alt={getDisplayName()}
                          className="dropdown-user-avatar"
                        />
                      )}
                    </div>

                    {/* ── ADMIN DROPDOWN ── */}
                    {getUserRole() === "admin" && (
                      <>
                        <Link
                          href="/admin/dashboard"
                          className="dropdown-item-custom"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="bi bi-speedometer2"></i>
                          Dashboard
                        </Link>
                        <Link
                          href="/admin/dashboard/profile"
                          className="dropdown-item-custom"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="bi bi-person"></i>
                          My Profile
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
                    {getUserRole() === "seller" && (
                      <>
                        <Link
                          href="/seller/dashboard"
                          className="dropdown-item-custom"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="bi bi-shop"></i>
                          Seller Dashboard
                        </Link>
                        <Link
                          href="/seller/products"
                          className="dropdown-item-custom"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="bi bi-box-seam"></i>
                          My Products
                        </Link>
                        <Link
                          href="/seller/orders"
                          className="dropdown-item-custom"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="bi bi-bag-check"></i>
                          Orders
                        </Link>
                        <Link
                          href="/seller/analytics"
                          className="dropdown-item-custom"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="bi bi-graph-up"></i>
                          Analytics
                        </Link>
                        <div className="dropdown-divider-custom"></div>
                        <Link
                          href="/profile"
                          className="dropdown-item-custom"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="bi bi-person"></i>
                          My Profile
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
                    {getUserRole() === "user" && (
                      <>
                        <Link
                          href="/profile"
                          className="dropdown-item-custom"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="bi bi-person"></i>
                          My Profile
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
                          href="/wishlist"
                          className="dropdown-item-custom"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="bi bi-heart"></i>
                          Wishlist
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
