"use client";

import React, { useEffect } from "react";
import "./Toast.css";

const Toast = ({ message, type = "success", onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "bi-check-circle-fill",
          gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
          glow: "0 4px 20px rgba(34, 197, 94, 0.3)",
        };

      case "error":
        return {
          icon: "bi-exclamation-circle-fill",
          gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
          glow: "0 4px 20px rgba(239, 68, 68, 0.3)",
        };

      case "warning":
        return {
          icon: "bi-exclamation-triangle-fill",
          gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
          glow: "0 4px 20px rgba(245, 158, 11, 0.3)",
        };

      case "info":
        return {
          icon: "bi-info-circle-fill",
          gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
          glow: "0 4px 20px rgba(59, 130, 246, 0.3)",
        };

      default:
        return {
          icon: "bi-bell-fill",
          gradient: "linear-gradient(135deg, var(--gold), var(--gold-deep))",
          glow: "0 4px 20px rgba(184, 145, 42, 0.3)",
        };
    }
  };

  const config = getConfig();

  return (
    <div
      className={`toast-premium toast-${type}`}
      style={{
        background: config.gradient,
        boxShadow: config.glow,
      }}
    >
      <i className={`bi ${config.icon}`} />

      <span>{message}</span>

      <button
        type="button"
        onClick={onClose}
        className="toast-close"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
