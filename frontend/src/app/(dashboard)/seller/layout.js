"use client";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";
import SellerAuthGuard from "./sellerAuthGuard";
import "bootstrap-icons/font/bootstrap-icons.css";
import { cormorantGaramond, dmSans } from "@/app/fontloader";
import { useState, useEffect } from "react";
import { NotificationProvider } from "@/app/context/NotificationContext";

const navbarItems = [];

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
];

export default function SellerLayout({ children }) {
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
        <SellerAuthGuard>
          <NotificationProvider>
            <Navbar
              items={navbarItems}
              brandName="SHOPNEST"
              brandLink="/seller/dashboard"
            />
            <div className="d-flex" style={{ paddingTop: "60px" }}>
              <Sidebar
                sidebarItems={sellerSidebarItems}
                defaultCollapsed={sidebarCollapsed}
                onToggle={handleSidebarToggle}
              />
              <main
                style={{
                  marginLeft: isMobile
                    ? 0
                    : sidebarCollapsed
                      ? "55px"
                      : "150px",
                  width: isMobile
                    ? "100%"
                    : `calc(100% - ${sidebarCollapsed ? "0px" : "0px"})`,
                  minHeight: "calc(100vh - 70px)",
                  backgroundColor: "#f8f9fa",
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
