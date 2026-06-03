"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import Link from "next/link";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Add error handling for useNotifications
  let notifications = [];
  let unreadCount = 0;
  let markAllRead = () => {};
  let clearAll = () => {};

  try {
    const notificationContext = useNotifications();
    notifications = notificationContext?.notifications || [];
    unreadCount = notificationContext?.unreadCount || 0;
    markAllRead = notificationContext?.markAllRead || (() => {});
    clearAll = notificationContext?.clearAll || (() => {});
  } catch (error) {
    console.error("Notification context error:", error);
    // Return null or a fallback UI if context is not available
    return null;
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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
    return `${diffDays}d ago`;
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="notification-icon-btn"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <i className="bi bi-bell" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllRead} className="action-btn">
                    Mark all read
                  </button>
                  <button onClick={clearAll} className="action-btn">
                    Clear all
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <i className="bi bi-bell-slash" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification._id}
                  href={notification.link || "#"}
                  className={`notification-item ${!notification.read ? "unread" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  <div className="notification-icon">
                    <i
                      className={`bi bi-${notification.icon || "info-circle"}`}
                    />
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">
                      {notification.message}
                    </p>
                    <span className="notification-time">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.read && (
                    <div className="notification-unread-dot" />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .notification-bell {
          position: relative;
        }

        .notification-icon-btn {
          position: relative;
          background: transparent;
          border: none;
          font-size: 1.2rem;
          color: var(--text-primary);
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .notification-icon-btn:hover {
          background: var(--bg-surface);
        }

        .notification-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: var(--accent-rose);
          color: white;
          font-size: 10px;
          font-weight: 600;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
        }

        .notification-dropdown {
          position: absolute;
          top: 45px;
          right: 0;
          width: 380px;
          max-width: calc(100vw - 20px);
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border);
          z-index: 1000;
          overflow: hidden;
        }

        .notification-header {
          padding: 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notification-header h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .notification-actions {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          background: transparent;
          border: none;
          font-size: 12px;
          color: var(--gold);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .action-btn:hover {
          background: var(--gold-pale);
        }

        .notification-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .notification-empty {
          padding: 48px 24px;
          text-align: center;
          color: var(--text-muted);
        }

        .notification-empty i {
          font-size: 48px;
          margin-bottom: 12px;
          display: block;
        }

        .notification-empty p {
          font-size: 14px;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          text-decoration: none;
          border-bottom: 1px solid var(--border);
          transition: background 0.2s;
          position: relative;
        }

        .notification-item:hover {
          background: var(--bg);
        }

        .notification-item.unread {
          background: var(--gold-pale);
        }

        .notification-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--bg-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notification-icon i {
          font-size: 18px;
          color: var(--gold);
        }

        .notification-content {
          flex: 1;
        }

        .notification-message {
          font-size: 13px;
          color: var(--text-primary);
          margin: 0 0 4px 0;
          line-height: 1.4;
        }

        .notification-time {
          font-size: 11px;
          color: var(--text-muted);
        }

        .notification-unread-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-rose);
          flex-shrink: 0;
          margin-top: 12px;
        }

        @media (max-width: 480px) {
          .notification-dropdown {
            width: calc(100vw - 20px);
            right: -70px;
          }
        }
      `}</style>
    </div>
  );
}
