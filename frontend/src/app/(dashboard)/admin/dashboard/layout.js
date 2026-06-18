"use client";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import AdminAuthGuard from "./adminAuthGuard";
import { useState, useEffect } from "react";
import "./admin-layout.css"; // Import the CSS file
import { cormorantGaramond, dmSans } from "@/app/fontloader";

const header = "Admin Panel";
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
];

const navItems = [];

export default function RootLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
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
              header={header}
              defaultCollapsed={sidebarCollapsed}
              onToggle={handleSidebarToggle}
            />

            <div
              className="main-content "
              style={{
                marginTop: isMobile ? "56px" : "80px",
                marginLeft: isMobile ? 0 : sidebarCollapsed ? "80px" : "280px",
                width: isMobile
                  ? "100%"
                  : `calc(100% - ${sidebarCollapsed ? "80px" : "280px"})`,
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
