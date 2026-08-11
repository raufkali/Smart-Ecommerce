"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import "./Login.css";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullname: "",
    confirmPassword: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.push("/");
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return false;
    }
    if (!isLogin) {
      if (!formData.fullname) {
        setError("Please enter your full name");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validateForm()) return;
    setLoading(true);
    try {
      const endpoint = isLogin ? "/user/login" : "/user/create";
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            fullname: formData.fullname,
            email: formData.email,
            password: formData.password,
            role: formData.role,
          };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();

      if (res.ok) {
        if (isLogin) {
          localStorage.setItem("token", data.token);
          setSuccess("Login successful! Redirecting...");
          setTimeout(() => router.push("/"), 1500);
        } else {
          setSuccess("Account created! Please login.");
          setTimeout(() => {
            setIsLogin(true);
            setFormData({
              email: formData.email,
              password: "",
              fullname: "",
              confirmPassword: "",
              role: "user",
            });
          }, 1500);
        }
      } else {
        setError(
          data.message ||
            (isLogin ? "Invalid email or password" : "Registration failed"),
        );
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="auth-page ">
      {/* Form panel */}
      <div className="auth-right">
        {/* Back to home button */}
        <Link href="/" className="back-home">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to home
        </Link>

        <div className="form-box">
          {/* Tab switcher */}
          <div className="tab-switcher">
            <button
              className={`tab-btn${isLogin ? " active" : ""}`}
              onClick={() => {
                setIsLogin(true);
                setError("");
                setSuccess("");
              }}
              type="button"
            >
              Login
            </button>
            <button
              className={`tab-btn${!isLogin ? " active" : ""}`}
              onClick={() => {
                setIsLogin(false);
                setError("");
                setSuccess("");
              }}
              type="button"
            >
              Sign Up
            </button>
          </div>

          <p className="form-heading">
            {isLogin ? "Welcome back" : "Create account"}
          </p>
          <p className="form-sub">
            {isLogin
              ? "Sign in to continue shopping."
              : "Join thousands of buyers & sellers."}
          </p>

          {/* Alerts */}
          {error && (
            <div className="auth-alert danger">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="auth-alert success-msg">
              <svg viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Sign up only — name + role row */}
            {!isLogin && (
              <div className="two-col">
                <div className="field-group">
                  <label className="field-label" htmlFor="fullname">
                    Full name
                  </label>
                  <div className="input-shell">
                    <svg className="field-icon" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      type="text"
                      id="fullname"
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleChange}
                      placeholder="Your full name"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="role">
                    Role
                  </label>
                  <div className="input-shell">
                    <svg className="field-icon" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="user">Buyer</option>
                      <option value="seller">Seller</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            <div className="field-group">
              <label className="field-label" htmlFor="email">
                Email address
              </label>
              <div className="input-shell">
                <svg className="field-icon" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password section */}
            <div className={!isLogin ? "two-col" : ""}>
              <div className="field-group">
                <label className="field-label" htmlFor="password">
                  Password
                </label>
                <div className="input-shell">
                  <svg className="field-icon" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <svg viewBox="0 0 24 24">
                      {showPassword ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {/* Confirm password — sign up only */}
              {!isLogin && (
                <div className="field-group">
                  <label className="field-label" htmlFor="confirmPassword">
                    Confirm password
                  </label>
                  <div className="input-shell">
                    <svg className="field-icon" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      tabIndex={-1}
                    >
                      <svg viewBox="0 0 24 24">
                        {showConfirmPassword ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Forgot password */}
            {isLogin && (
              <Link href="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            )}

            {/* Submit */}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>
                    {isLogin ? "Logging in..." : "Creating account..."}
                  </span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24">
                    {isLogin ? (
                      <>
                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </>
                    ) : (
                      <>
                        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </>
                    )}
                  </svg>
                  <span>
                    {isLogin ? "Login to your account" : "Create my account"}
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="terms-note">
            By continuing, you agree to our <Link href="/terms">Terms</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
