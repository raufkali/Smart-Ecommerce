"use client";
import Navbar from "../components/Navbar";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useState, useEffect } from "react";
import Footer from "../components/Footer";
import { NotificationProvider } from "../context/NotificationContext";

export default function RootLayout({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    // Get user role if logged in
    if (token) {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setUserRole(user.role || null);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }

    // Get cart count from localStorage or state management
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(cart.length);

    // Listen for storage changes
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.length);

      if (token) {
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          setUserRole(user.role || null);
        } catch (e) {
          console.error("Failed to parse user data", e);
        }
      } else {
        setUserRole(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Custom event for login/logout
    const handleAuthChange = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.length);

      if (token) {
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          setUserRole(user.role || null);
        } catch (e) {
          console.error("Failed to parse user data", e);
        }
      } else {
        setUserRole(null);
      }
    };

    window.addEventListener("authChange", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  // Dynamic nav items based on auth state
  const baseNavItems = [
    { name: "Home", link: "/", icon: "house" },
    { name: "Products", link: "/products", icon: "grid" },
    { name: "Categories", link: "/categories", icon: "tags" },
  ];

  // Add Orders link only if logged in
  if (isLoggedIn) {
    baseNavItems.push({ name: "Orders", link: "/orders", icon: "bag-check" });
  }

  // Add Dashboard link for admin/seller
  if (userRole === "admin" || userRole === "seller") {
    baseNavItems.push({
      name: "Dashboard",
      link: `/${userRole}/dashboard`,
      icon: "speedometer2",
    });
  }

  // Add auth-dependent nav items
  const authNavItems = isLoggedIn
    ? [{ name: "Profile", link: "/profile", icon: "person" }]
    : "";

  const navItems = [...baseNavItems, ...authNavItems];

  // Add cart item
  if (isLoggedIn) {
    navItems.push({
      name: "Cart",
      link: "/cart",
      icon: "cart",
      badge: cartCount > 0 ? cartCount : null,
    });
  }

  return (
    <html lang="en">
      <body className="light-theme">
        <div className="app-wrapper">
          <NotificationProvider>
            <Navbar
              items={navItems}
              brandName="SHOPNEST"
              brandLink="/"
              isLoggedIn={isLoggedIn}
              cartCount={cartCount}
            />
            <main className="main-content">{children}</main>
            <Footer />
          </NotificationProvider>
        </div>

        <style jsx>{`
          .app-wrapper {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }

          .main-content {
            flex: 1;
            margin-top: 65px;
          }

          @media (max-width: 768px) {
            .main-content {
              margin-top: 60px;
            }
          }

          /* Smooth transitions for theme */
          .light-theme {
            transition:
              background-color 0.3s ease,
              color 0.3s ease;
          }
        `}</style>
      </body>
    </html>
  );
}
