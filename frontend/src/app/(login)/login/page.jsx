"use client";
import Login from "@/app/components/Login";
const LoginPage = () => {
  return (
    <div
      className="p-0 m-0 align-items-center justify-content-center bg-light"
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        position: "absolute",
        top: "0",
      }}
    >
      <Login />
    </div>
  );
};

export default LoginPage;
