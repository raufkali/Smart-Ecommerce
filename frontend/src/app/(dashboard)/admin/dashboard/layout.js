"use client";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import AdminAuthGuard from "./adminAuthGuard";
import { useState, useEffect } from "react";

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
];

const navItems = [
  {
    name: "Profile",
    link: "/admin/dashboard/profile",
    icon: "profile",
  },
  {
    name: "Settings",
    link: "/admin/dashboard/settings",
    icon: "settings",
  },
  {
    name: "Logout",
    link: "#",
  },
];

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
      <body style={{ overflowX: "hidden" }}>
        <AdminAuthGuard>
          <div className="admin-layout">
            {/* Sidebar */}
            <Sidebar
              sidebarItems={sidebarItems}
              header={header}
              defaultCollapsed={sidebarCollapsed}
              onToggle={handleSidebarToggle}
            />

            {/* Main Content Area */}
            <div
              className="main-content"
              style={{
                marginLeft: isMobile ? 0 : sidebarCollapsed ? "80px" : "280px",
              }}
            >
              {/* Navbar */}
              <Navbar
                items={navItems}
                brandName="Admin Dashboard"
                showUserMenu={true}
                userName="Admin User"
                userRole="Administrator"
              />

              {/* Page Content */}
              <div className="content-wrapper">{children}</div>
            </div>
          </div>
        </AdminAuthGuard>

        <style jsx>{`
          .admin-layout {
            display: flex;
            min-height: 100vh;
            background-color: #f8f9fa;
          }

          .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            transition: margin-left 0.3s ease;
            width: 100%;
          }

          .content-wrapper {
            padding: 2rem;
            margin-top: 60px;
            min-height: calc(100vh - 60px);
            background-color: #f8f9fa;
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .content-wrapper {
              padding: 1rem;
              margin-left: 0 !important;
            }

            .main-content {
              margin-left: 0 !important;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
