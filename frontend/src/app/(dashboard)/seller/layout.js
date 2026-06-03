"use client";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";
import SellerAuthGuard from "./sellerAuthGuard";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useState } from "react";
import { NotificationProvider } from "@/app/context/NotificationContext";
const navbarItems = [];

// Essential seller sidebar items
const sellerSidebarItems = [
  {
    name: "Dashboard",
    link: "/seller/dashboard",
    icon: "dashboard",
  },
  {
    name: "Products",
    link: "/seller/products",
    icon: "products",
  },
  {
    name: "Orders",
    link: "/seller/orders",
    icon: "orders",
  },
  {
    name: "Profile",
    link: "/seller/profile",
    icon: "profile",
  },
  {
    name: "Settings",
    link: "/seller/settings",
    icon: "settings",
  },
];

export default function SellerLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <html lang="en">
      <body>
        <SellerAuthGuard>
          <NotificationProvider>
            <Navbar
              items={navbarItems}
              brandName="SHOPNEST"
              brandLink="/seller/dashboard"
            />
            <div className="d-flex" style={{ paddingTop: "70px" }}>
              <Sidebar
                sidebarItems={sellerSidebarItems}
                header="Seller Menu"
                onToggle={handleSidebarToggle}
              />
              <main
                style={{
                  marginLeft: sidebarCollapsed ? "80px" : "280px",
                  width: sidebarCollapsed
                    ? "calc(100% - 80px)"
                    : "calc(100% - 280px)",
                  minHeight: "calc(100vh - 70px)",
                  backgroundColor: "#f8f9fa",
                  padding: "24px",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <div className="container-fluid ps-4">{children}</div>
              </main>
            </div>

            <style jsx global>{`
              body {
                margin: 0;
                padding: 0;
                background-color: #f8f9fa;
              }

              .shopnest-navbar {
                z-index: 1040 !important;
              }

              main {
                transition:
                  margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                  width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              }

              @media (max-width: 768px) {
                main {
                  margin-left: 0 !important;
                  width: 100% !important;
                }
              }
            `}</style>
          </NotificationProvider>
        </SellerAuthGuard>
      </body>
    </html>
  );
}
