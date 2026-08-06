"use client";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import AdminAuthGuard from "./adminAuthGuard";
import { useState, useEffect } from "react";
import "./admin-layout.css";
import { cormorantGaramond, dmSans } from "@/app/fontloader";

const sidebarItems = [
  {
    name: "Dashboard",
    link: "/admin/dashboard",
    icon: "dashboard",
  },
  {
    name: "Users",
    link: "/admin/dashboard/users",
    icon: "users",
  },
  {
    name: "Orders",
    link: "/admin/dashboard/orders",
    icon: "orders",
  },
  {
    name: "Categories",
    link: "/admin/dashboard/categories",
    icon: "categories",
  },
  {
    name: "Settings",
    link: "/admin/dashboard/settings",
    icon: "settings",
  },
  {
    name: "Disputes",
    link: "/admin/dashboard/disputes",
    icon: "disputes",
  },
];

const navItems = [];

export default function RootLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <html lang="en">
      <body className={`${cormorantGaramond.variable} ${dmSans.variable}`}>
        <AdminAuthGuard>
          <div className="admin-layout">
            <Sidebar
              sidebarItems={sidebarItems}
              defaultCollapsed={sidebarCollapsed}
              onToggle={handleSidebarToggle}
            />

            <div
              className="main-content"
              style={{
                marginTop: isMobile ? "56px" : "60px",
                marginLeft: isMobile ? 0 : sidebarCollapsed ? "80px" : "180px",
                width: isMobile
                  ? "100%"
                  : `calc(100% - ${sidebarCollapsed ? "80px" : "180px"})`,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <Navbar
                items={navItems}
                brandName="Admin Dashboard"
                showUserMenu={true}
                userName="Admin User"
                userRole="Administrator"
              />

              <div className="content-wrapper">{children}</div>
            </div>
          </div>
        </AdminAuthGuard>
      </body>
    </html>
  );
}
