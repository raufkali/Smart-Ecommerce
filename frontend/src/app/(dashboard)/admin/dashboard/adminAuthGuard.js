"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AdminAuthGuard = ({ children }) => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,

          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          router.push("/login");
          return;
        }

        const data = await response.json();

        const role = data.user.role;

        if (role === "admin") {
          setAuthorized(true);
        } else if (role === "user") {
          router.push("/buyer/dashboard");
        } else if (role === "seller") {
          router.push("/seller/dashboard");
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error(error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, []);

  if (loading) {
    return (
      <div className="container vh-100 d-flex justify-content-center align-items-center">
        <h3>Checking Admin Authentication...</h3>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="container vh-100 d-flex justify-content-center align-items-center">
        <h3>401 | Unauthorized Admin</h3>
      </div>
    );
  }

  return children;
};

export default AdminAuthGuard;
