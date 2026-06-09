"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./Sidebar.css";

const Sidebar = ({
  sidebarItems = [],
  header = "Menu",
  onToggle,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [fullUserData, setFullUserData] = useState(null);
  const pathname = usePathname();

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
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

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (onToggle) {
      onToggle(!isCollapsed);
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
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
    if (!userData) return "Guest";
    return (
      userData.fullname ||
      userData.name ||
      userData.username ||
      userData.email?.split("@")[0] ||
      "User"
    );
  };

  // Helper function to get user's role
  const getUserRole = () => {
    const userData = fullUserData || user;
    const role = userData?.role || "user";
    // Format role for display
    if (role === "admin") return "Administrator";
    if (role === "seller") return "Seller";
    return "Customer";
  };

  // Get icon component based on icon name
  const getIcon = (iconName) => {
    const icons = {
      dashboard: <i className="bi bi-speedometer2"></i>,
      orders: <i className="bi bi-box-seam"></i>,
      products: <i className="bi bi-grid"></i>,
      categories: <i className="bi bi-tags"></i>,
      users: <i className="bi bi-people"></i>,
      settings: <i className="bi bi-gear"></i>,
      profile: <i className="bi bi-person-circle"></i>,
      logout: <i className="bi bi-box-arrow-right"></i>,
      analytics: <i className="bi bi-graph-up"></i>,
      messages: <i className="bi bi-chat-dots"></i>,
      notifications: <i className="bi bi-bell"></i>,
      help: <i className="bi bi-question-circle"></i>,
      reports: <i className="bi bi-file-text"></i>,
      coupons: <i className="bi bi-ticket-perforated"></i>,
      reviews: <i className="bi bi-star"></i>,
      default: <i className="bi bi-circle"></i>,
    };
    return icons[iconName] || icons.default;
  };

  const isLoggedIn = !!user;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={toggleMobileSidebar} />
      )}

      {/* Mobile Toggle Button */}
      <button
        className="sidebar-mobile-toggle btn d-md-none"
        onClick={toggleMobileSidebar}
        aria-label="Toggle sidebar"
      >
        <i className={`bi ${isMobileOpen ? "bi-x-lg" : "bi-list"}`}></i>
      </button>

      {/* Sidebar */}
      <div
        className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          {!isCollapsed ? (
            <h4 className="sidebar-title">{header}</h4>
          ) : (
            <h4 className="sidebar-title-collapsed">{header.charAt(0)}</h4>
          )}

          {/* Toggle Button (Desktop) */}
          <button
            className="sidebar-toggle d-none d-md-block"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i
              className={`bi bi-chevron-${isCollapsed ? "right" : "left"}`}
            ></i>
          </button>

          {/* Close Button (Mobile) */}
          <button
            className="sidebar-close d-md-none"
            onClick={toggleMobileSidebar}
            aria-label="Close sidebar"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {sidebarItems.map((item, index) => {
              const isActive =
                pathname === item.link || pathname?.startsWith(item.link + "/");

              return (
                <li
                  key={index}
                  className={`sidebar-item ${isActive ? "active" : ""} ${item.disabled ? "disabled" : ""}`}
                >
                  <Link
                    href={item.disabled ? "#" : item.link}
                    className="sidebar-link"
                    title={isCollapsed ? item.name : ""}
                  >
                    <span className="sidebar-icon">
                      {item.icon ? getIcon(item.icon) : getIcon("default")}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="sidebar-label">{item.name}</span>
                        {item.badge && (
                          <span className="sidebar-badge">{item.badge}</span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar User Section */}
        <div className="sidebar-user-section">
          <div className="sidebar-user">
            <div className="user-avatar-wrapper">
              {isLoggedIn && getProfilePictureUrl() ? (
                <img
                  src={getProfilePictureUrl()}
                  alt={getDisplayName()}
                  className="user-avatar-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML =
                      '<i class="bi bi-person-circle"></i>';
                  }}
                />
              ) : (
                <div className="user-avatar">
                  <i className="bi bi-person-circle"></i>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="user-info">
                <div className="user-name text-white">{getDisplayName()}</div>
                <div className="user-role">{getUserRole()}</div>
              </div>
            )}
          </div>

          {/* Logout Button (when collapsed) */}
          {isCollapsed && isLoggedIn && (
            <button
              className="sidebar-logout-btn"
              onClick={() => {
                if (confirm("Are you sure you want to logout?")) {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  localStorage.removeItem("cart");
                  window.dispatchEvent(new Event("authChange"));
                  window.location.href = "/";
                }
              }}
              title="Logout"
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div className="sidebar-footer">
            {isLoggedIn && (
              <button
                className="sidebar-logout-full"
                onClick={() => {
                  if (confirm("Are you sure you want to logout?")) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    localStorage.removeItem("cart");
                    window.dispatchEvent(new Event("authChange"));
                    window.location.href = "/";
                  }
                }}
              >
                <i className="bi bi-box-arrow-right"></i>
                <span>Logout</span>
              </button>
            )}
            <div className="sidebar-version">
              <small>SHOPNEST v1.0</small>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
