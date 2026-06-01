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

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (onToggle) {
      onToggle(!isCollapsed);
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
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
                          <span className="sidebar-badge">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-user">
          <div className="user-avatar">
            <i className="bi bi-person-circle"></i>
          </div>
          {!isCollapsed && (
            <div className="user-info">
              <div className="user-name">Seller</div>
              <div className="user-role">Shop Manager</div>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="sidebar-footer">
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