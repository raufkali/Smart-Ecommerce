"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { socket } from "../lib/socket";

const NotificationContext = createContext(null);
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  // ─── Fetch from DB ────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return; // not logged in, skip silently

    try {
      const res = await fetch(`${API}/notifications?limit=20`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Socket connect/disconnect based on auth ──────────────────────────────
  const connectSocket = useCallback(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!token || !user) return;

    socket.connect();
    socket.emit("joinRoom", { userId: user.id, role: user.role });

    socket.on("notification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });
  }, []);

  const disconnectSocket = useCallback(() => {
    socket.off("notification");
    socket.disconnect();
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // ─── On mount: init if already logged in ─────────────────────────────────
  useEffect(() => {
    fetchNotifications();
    connectSocket();

    // Re-init when user logs in (your layout fires this event)
    const handleAuthChange = () => {
      const token = localStorage.getItem("token");
      if (token) {
        fetchNotifications();
        connectSocket();
      } else {
        // User logged out
        disconnectSocket();
      }
    };

    window.addEventListener("authChange", handleAuthChange);
    return () => {
      window.removeEventListener("authChange", handleAuthChange);
      socket.off("notification");
      socket.disconnect();
    };
  }, [fetchNotifications, connectSocket, disconnectSocket]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const markOneRead = async (id) => {
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: "PUT",
        headers: authHeaders(),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API}/notifications/read-all`, {
        method: "PUT",
        headers: authHeaders(),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const clearAll = async () => {
    try {
      await fetch(`${API}/notifications/all`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markOneRead,
        markAllRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
