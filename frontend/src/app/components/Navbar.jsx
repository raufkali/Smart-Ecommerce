"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import "./Navbar.css";
import NotificationBell from "./NotificationBell";

const Navbar = ({ items = [], brandName = "SHOPNEST", brandLink = "/" }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [fullUser, setFullUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // ── Cart count (backend) ───────────────────────────────────────────────
  const fetchCartCount = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCartCount(0);
      return;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/cart/count`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setCartCount(data.count || 0);
      } else {
        setCartCount(0);
      }
    } catch {
      setCartCount(0);
    }
  };

  // ── Unread chat count (backend) ────────────────────────────────────────
  const fetchUnreadCount = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUnreadChatCount(0);
      return;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setUnreadChatCount(data.count || 0);
      }
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  };

  // Fetch both on mount and on every route change
  useEffect(() => {
    fetchCartCount();
    fetchUnreadCount();
  }, [pathname]);

  // Listen for cart updates dispatched anywhere in the app
  useEffect(() => {
    window.addEventListener("cartUpdate", fetchCartCount);
    return () => window.removeEventListener("cartUpdate", fetchCartCount);
  }, []);

  // Listen for new chat messages
  useEffect(() => {
    window.addEventListener("newChatMessage", fetchUnreadCount);
    return () => window.removeEventListener("newChatMessage", fetchUnreadCount);
  }, []);

  // ── Auth ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setFullUser(null);
        setCartCount(0);
        return;
      }
      try {
        const authRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!authRes.ok) throw new Error();
        const { user: basic } = await authRes.json();
        setUser(basic);
        const profRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/profile/`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setFullUser(
          profRes.ok ? ((await profRes.json()).user ?? basic) : basic,
        );
      } catch {
        localStorage.removeItem("token");
        setUser(null);
        setFullUser(null);
        setCartCount(0);
      }
    };
    fetchUser();
    window.addEventListener("authChange", fetchUser);
    return () => window.removeEventListener("authChange", fetchUser);
  }, [pathname]);

  const handleLogout = () => {
    if (!confirm("Log out of ShopNest?")) return;
    ["token", "user", "cart"].forEach((k) => localStorage.removeItem(k));
    setUser(null);
    setFullUser(null);
    setCartCount(0);
    setUnreadChatCount(0);
    window.dispatchEvent(new Event("authChange"));
    router.push("/");
  };

  const ud = fullUser || user;
  const role = ud?.role || "user";
  const isLoggedIn = !!user;
  const displayName =
    ud?.fullname || ud?.name || ud?.email?.split("@")[0] || "User";
  const firstName = displayName.split(" ")[0];

  const chatLink =
    role === "admin"
      ? "/admin/dashboard/chat"
      : role === "seller"
        ? "/seller/chat"
        : "/chat";

  const avatarUrl = (() => {
    const pic = ud?.profilePicture || ud?.profileImage || ud?.avatar;
    if (!pic) return null;
    return pic.startsWith("http")
      ? pic
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/profiles/${pic}`;
  })();

  const iconMap = {
    house: "bi-house-fill",
    grid: "bi-grid-fill",
    tags: "bi-tags-fill",
    bag: "bi-bag-fill",
    "bag-check": "bi-bag-check-fill",
    bagCheck: "bi-bag-check-fill",
    speedometer2: "bi-speedometer2",
    person: "bi-person-fill",
    cart: "bi-cart-fill",
    orders: "bi-bag-check-fill",
    gear: "bi-gear-fill",
  };

  const dropdownConfig = {
    admin: {
      badge: "Admin",
      links: [
        {
          href: "/admin/dashboard",
          icon: "bi-speedometer2",
          label: "Dashboard",
        },
        {
          href: "/admin/dashboard/profile",
          icon: "bi-person-fill",
          label: "My Profile",
        },
      ],
    },
    seller: {
      badge: "Seller",
      links: [
        { href: "/seller/dashboard", icon: "bi-shop", label: "Dashboard" },
        {
          href: "/seller/products",
          icon: "bi-box-seam-fill",
          label: "Products",
        },
        { href: "/seller/orders", icon: "bi-bag-check-fill", label: "Orders" },
        { divider: true },
        { href: "/profile", icon: "bi-person-fill", label: "Profile" },
      ],
    },
    user: {
      badge: "Member",
      links: [
        { href: "/profile", icon: "bi-person-fill", label: "My Profile" },
        { href: "/orders", icon: "bi-bag-check-fill", label: "My Orders" },
      ],
    },
  };

  const { badge, links } = dropdownConfig[role] || dropdownConfig.user;

  return (
    <>
      <nav className={`sn-navbar ${scrolled ? "sn-navbar--scrolled" : ""}`}>
        <div className="sn-navbar__inner">
          {/* Brand */}
          <Link href={brandLink} className="sn-brand">
            {brandName}
          </Link>

          {/* Desktop nav links */}
          <ul className="sn-nav-links">
            {items.map((item, i) => (
              <li key={i}>
                <Link
                  href={item.link}
                  className={`sn-nav-link ${pathname === item.link ? "sn-nav-link--active" : ""}`}
                >
                  <i className={`bi ${iconMap[item.icon] || "bi-circle"}`} />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Right actions */}
          <div className="sn-actions">
            {/* Cart — buyers only */}
            {(role === "user" || !isLoggedIn) && (
              <Link href="/cart" className="sn-action-btn" aria-label="Cart">
                <i className="bi bi-bag-fill" />
                {cartCount > 0 && (
                  <span className="sn-action-btn__badge">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Messages */}
            {isLoggedIn && (
              <Link
                href={chatLink}
                className="sn-action-btn"
                aria-label="Messages"
              >
                <i className="bi bi-chat-dots-fill" />
                {unreadChatCount > 0 && <span className="sn-action-btn__dot" />}
              </Link>
            )}

            {/* Notifications */}
            {isLoggedIn && (
              <div className="sn-action-btn sn-action-btn--notif">
                <NotificationBell />
              </div>
            )}

            {/* User menu */}
            {isLoggedIn ? (
              <div className="sn-user-menu" ref={dropdownRef}>
                <button
                  className="sn-avatar-toggle"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  aria-expanded={userMenuOpen}
                >
                  <div className="sn-avatar">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    ) : (
                      <span>{firstName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="sn-avatar-name">{firstName}</span>
                  <i
                    className={`bi bi-chevron-${userMenuOpen ? "up" : "down"} sn-chevron`}
                  />
                </button>

                <div
                  className={`sn-dropdown ${userMenuOpen ? "sn-dropdown--open" : ""}`}
                >
                  <div className="sn-dropdown__head">
                    <div className="sn-dropdown__avatar-wrap">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="sn-dropdown__avatar"
                        />
                      ) : (
                        <div className="sn-dropdown__avatar-placeholder">
                          {firstName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="sn-dropdown__user-info">
                      <p className="sn-dropdown__name">{displayName}</p>
                      <span className={`sn-role-badge sn-role-badge--${role}`}>
                        {badge}
                      </span>
                    </div>
                  </div>

                  <div className="sn-dropdown__divider" />

                  {links.map((item, i) =>
                    item.divider ? (
                      <div key={i} className="sn-dropdown__divider" />
                    ) : (
                      <Link
                        key={i}
                        href={item.href}
                        className="sn-dropdown__item"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <i className={`bi ${item.icon}`} />
                        {item.label}
                      </Link>
                    ),
                  )}

                  <div className="sn-dropdown__divider" />

                  <button
                    className="sn-dropdown__item sn-dropdown__item--danger"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right" />
                    Log out
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="sn-login-btn">
                <i className="bi bi-box-arrow-in-right" />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="sn-hamburger"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <i className={`bi ${mobileOpen ? "bi-x-lg" : "bi-list"}`} />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div className={`sn-drawer ${mobileOpen ? "sn-drawer--open" : ""}`}>
          {items.map((item, i) => (
            <Link
              key={i}
              href={item.link}
              className={`sn-drawer__link ${pathname === item.link ? "sn-drawer__link--active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <i className={`bi ${iconMap[item.icon] || "bi-circle"}`} />
              {item.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sn-overlay" onClick={() => setMobileOpen(false)} />
      )}
    </>
  );
};

export default Navbar;
