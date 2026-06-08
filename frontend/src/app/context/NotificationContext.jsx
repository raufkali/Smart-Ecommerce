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

  // ─── Normalize: backend may return `isRead` or `read` — unify to `read` ───
  const normalize = (n) => ({
    ...n,
    read: n.read ?? n.isRead ?? false,
  });

  // ─── Fetch from DB ────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API}/notifications?limit=20`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        const normalized = (data.notifications || []).map(normalize);
        setNotifications(normalized);
        // Recalculate unread from normalized data (don't trust backend count alone)
        setUnreadCount(normalized.filter((n) => !n.read).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Socket ───────────────────────────────────────────────────────────────
  const connectSocket = useCallback(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!token || !user) return;

    socket.connect();
    socket.emit("joinRoom", { userId: user.id, role: user.role });

    socket.on("notification", (notif) => {
      const n = normalize(notif);
      setNotifications((prev) => [n, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });
  }, []);

  const disconnectSocket = useCallback(() => {
    socket.off("notification");
    socket.disconnect();
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // ─── On mount ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications();
    connectSocket();

    const handleAuthChange = () => {
      const token = localStorage.getItem("token");
      if (token) {
        fetchNotifications();
        connectSocket();
      } else {
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
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("markOneRead failed:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API}/notifications/read-all`, {
        method: "PUT",
        headers: authHeaders(),
      });
      // ✅ Use `read` (normalized field), not `isRead`
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("markAllRead failed:", err);
    }
  };

  const clearAll = async () => {
    try {
      const res = await fetch(`${API}/notifications/all`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      // ✅ Only clear state if backend confirmed success
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        console.error("clearAll: server returned", res.status);
      }
    } catch (err) {
      console.error("clearAll failed:", err);
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
        refetch: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
