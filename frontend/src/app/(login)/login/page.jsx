"use client";
import Login from "@/app/components/Login";
import "../globals.css";
const LoginPage = () => {
  return (
    <div
      className="container-fluid align-items-center justify-content-center bg-light"
      style={{ minHeight: "100vh" }}
    >
      <Login />
    </div>
  );
};

export default LoginPage;
