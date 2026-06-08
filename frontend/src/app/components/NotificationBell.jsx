"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import Link from "next/link";
import "./NotificationBell.css";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  let notifications = [];
  let unreadCount = 0;
  let markAllRead = () => {};
  let clearAll = () => {};
  let markOneRead = () => {};

  try {
    const ctx = useNotifications();
    notifications = ctx?.notifications || [];
    unreadCount = ctx?.unreadCount || 0;
    markAllRead = ctx?.markAllRead || (() => {});
    clearAll = ctx?.clearAll || (() => {});
    markOneRead = ctx?.markOneRead || (() => {});
  } catch (error) {
    console.error("Notification context error:", error);
    return null;
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const iconMap = {
    order: "bi-bag-check",
    payment: "bi-credit-card",
    shipping: "bi-truck",
    dispute: "bi-exclamation-triangle",
    review: "bi-star",
    system: "bi-gear",
    info: "bi-info-circle",
    success: "bi-check-circle",
    warning: "bi-exclamation-triangle",
    error: "bi-x-circle",
  };

  const colorMap = {
    order: "#b8912a",
    payment: "#3b82f6",
    shipping: "#10b981",
    dispute: "#ef4444",
    review: "#f59e0b",
    system: "#8b5cf6",
    info: "#3b82f6",
    success: "#10b981",
    warning: "#c97b1a",
    error: "#ef4444",
  };

  const getIcon = (type) => iconMap[type] || "bi-bell";
  const getColor = (type) => colorMap[type] || "#b8912a";

  const handleItemClick = (n) => {
    // ✅ uses `n.read` (normalized field)
    if (!n.read) markOneRead(n._id);
    setOpen(false);
  };

  return (
    <div className="nb-wrap" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        className={`nb-btn ${open ? "nb-btn--active" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <i className="bi bi-bell-fill"></i>
        {unreadCount > 0 && (
          <span className="nb-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="nb-dropdown"
          role="dialog"
          aria-label="Notifications panel"
        >
          {/* Header */}
          <div className="nb-header">
            <div className="nb-header__left">
              <i className="bi bi-bell-fill nb-header__icon"></i>
              <span className="nb-header__title">Notifications</span>
              {unreadCount > 0 && (
                <span className="nb-header__badge">{unreadCount} new</span>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="nb-header__actions">
                <button
                  className="nb-action-btn"
                  onClick={markAllRead}
                  title="Mark all as read"
                  aria-label="Mark all as read"
                >
                  <i className="bi bi-check2-all"></i>
                </button>
                <button
                  className="nb-action-btn nb-action-btn--danger"
                  onClick={clearAll}
                  title="Clear all"
                  aria-label="Clear all notifications"
                >
                  <i className="bi bi-trash3"></i>
                </button>
              </div>
            )}
          </div>

          {/* List */}
          <div className="nb-list" role="list">
            {notifications.length === 0 ? (
              <div className="nb-empty">
                <div className="nb-empty__icon">
                  <i className="bi bi-bell-slash"></i>
                </div>
                <h4 className="nb-empty__title">You're all caught up</h4>
                <p className="nb-empty__sub">No notifications at the moment</p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n._id}
                  href={n.link || "#"}
                  // ✅ uses `n.read` (normalized)
                  className={`nb-item ${!n.read ? "nb-item--unread" : ""}`}
                  onClick={() => handleItemClick(n)}
                  role="listitem"
                >
                  {!n.read && (
                    <span className="nb-item__bar" aria-hidden="true" />
                  )}

                  <span
                    className="nb-item__icon"
                    style={{
                      background: `${getColor(n.type)}18`,
                      color: getColor(n.type),
                      boxShadow: `0 0 0 1px ${getColor(n.type)}30`,
                    }}
                  >
                    <i className={`bi ${getIcon(n.type)}`}></i>
                  </span>

                  <span className="nb-item__body">
                    <span className="nb-item__msg">{n.message}</span>
                    <span className="nb-item__meta">
                      <span className="nb-item__time">
                        <i className="bi bi-clock"></i>
                        {formatTime(n.createdAt)}
                      </span>
                      {n.type && (
                        <span
                          className="nb-item__type"
                          style={{
                            color: getColor(n.type),
                            background: `${getColor(n.type)}14`,
                          }}
                        >
                          <i className={`bi ${getIcon(n.type)}`}></i>
                          {n.type}
                        </span>
                      )}
                    </span>
                  </span>

                  {/* ✅ Dot only shows when n.read is false */}
                  {!n.read && (
                    <span className="nb-item__dot" aria-label="Unread" />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
