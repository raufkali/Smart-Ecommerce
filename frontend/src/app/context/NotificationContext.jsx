import { createContext, useContext, useEffect, useState } from "react";
import { socket } from "../lib/socket";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // add new notification
  const addNotification = (notif) => {
    setNotifications((prev) => [notif, ...prev]);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) return;

    socket.connect();

    socket.emit("joinRoom", {
      userId: user.id,
      role: user.role,
    });

    socket.on("notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    return () => {
      socket.off("notification");
      socket.disconnect();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
