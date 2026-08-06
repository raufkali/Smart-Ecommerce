"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./Sidebar.css";

const Sidebar = ({ sidebarItems = [], onToggle, defaultCollapsed = false }) => {
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

  const getProfilePictureUrl = () => {
    const userData = fullUserData || user;
    if (!userData) return null;

    const profilePic =
      userData.profilePicture || userData.profileImage || userData.avatar;

    if (profilePic) {
      if (profilePic.startsWith("http")) {
        return profilePic;
      }
      return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/profiles/${profilePic}`;
    }
    return null;
  };

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

  const getUserRole = () => {
    const userData = fullUserData || user;
    const role = userData?.role || "user";
    if (role === "admin") return "Admin";
    if (role === "seller") return "Seller";
    return "User";
  };

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
      disputes: <i className="bi bi-exclamation-triangle"></i>,
      default: <i className="bi bi-circle"></i>,
    };
    return icons[iconName] || icons.default;
  };

  const isLoggedIn = !!user;

  // FIX: Dashboard links must match EXACTLY. Previously "startsWith" made
  // "/admin/dashboard" match every sub-page too (e.g. /admin/dashboard/users),
  // so Dashboard stayed highlighted alongside whatever tab you were actually on.
  const isLinkActive = (item) => {
    if (item.link === "/") {
      return pathname === "/";
    }

    // Dashboard is a sibling of the other sections, not their parent route —
    // only highlight it on an exact match.
    if (item.link === "/admin/dashboard" || item.link === "/seller/dashboard") {
      return pathname === item.link;
    }

    // For other links: exact match or a real nested child route
    return pathname === item.link || pathname?.startsWith(item.link + "/");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={toggleMobileSidebar} />
      )}

      {/* Mobile Toggle Button */}
      <button
        className="sidebar-mobile-toggle d-md-none"
        onClick={toggleMobileSidebar}
        aria-label="Toggle sidebar"
      >
        <i className={`bi ${isMobileOpen ? "bi-x-lg" : "bi-list"}`}></i>
      </button>

      {/* Sidebar */}
      <div
        className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}
      >
        {/* Toggle Button - Centered with Golden Border */}
        <button
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={`bi bi-chevron-${isCollapsed ? "right" : "left"}`}></i>
        </button>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {sidebarItems.map((item, index) => {
              const isActive = isLinkActive(item);

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
                <div className="user-name">{getDisplayName()}</div>
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
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
