"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const OnboardingCompletePage = () => {
  const router = useRouter();
  const [status, setStatus] = useState("processing");
  const [accountInfo, setAccountInfo] = useState(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyOnboarding = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/login");
          return;
        }

        // Verify onboarding completion
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/seller/onboarding-complete`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (response.ok && data.isOnboarded) {
          setStatus("success");
          setAccountInfo(data.account);
          showSuccessMessage();
        } else if (response.ok && !data.isOnboarded) {
          setStatus("pending");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Error verifying onboarding:", error);
        setStatus("error");
      }
    };

    verifyOnboarding();
  }, [router]);

  const showSuccessMessage = () => {
    // Optional: Show a success toast or animation
    console.log("Stripe account successfully connected!");
  };

  // Auto-redirect to profile after success
  useEffect(() => {
    if (status === "success") {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/seller/profile?onboarding=complete");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, router]);

  if (status === "processing") {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div
            className="spinner-border text-primary mb-3"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Verifying your Stripe account...</h5>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card border-0 shadow-lg rounded-4">
                <div className="card-body p-5 text-center">
                  <div className="bg-danger bg-opacity-10 rounded-circle p-4 d-inline-flex mb-4">
                    <i className="bi bi-x-circle fs-1 text-danger"></i>
                  </div>

                  <h3 className="fw-bold mb-3">Verification Failed</h3>
                  <p className="text-muted mb-4">
                    We couldn't verify your Stripe account. Please try again or
                    contact support.
                  </p>

                  <div className="d-flex gap-3 justify-content-center">
                    <Link
                      href="/seller/profile"
                      className="btn btn-outline-secondary px-4"
                    >
                      Go to Profile
                    </Link>
                    <Link
                      href="/seller/onboarding/refresh"
                      className="btn btn-primary px-4"
                    >
                      Try Again
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card border-0 shadow-lg rounded-4">
                <div className="card-body p-5 text-center">
                  <div className="bg-warning bg-opacity-10 rounded-circle p-4 d-inline-flex mb-4">
                    <i className="bi bi-hourglass-split fs-1 text-warning"></i>
                  </div>

                  <h3 className="fw-bold mb-3">Onboarding Incomplete</h3>
                  <p className="text-muted mb-4">
                    Your Stripe account setup is not complete. Please finish the
                    onboarding process.
                  </p>

                  <div className="d-flex gap-3 justify-content-center">
                    <Link
                      href="/seller/profile"
                      className="btn btn-outline-secondary px-4"
                    >
                      Go to Profile
                    </Link>
                    <Link
                      href="/seller/onboarding/refresh"
                      className="btn btn-primary px-4"
                    >
                      Resume Onboarding
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="bg-success p-4 text-center">
                <i className="bi bi-check-circle-fill text-white fs-1"></i>
              </div>
              <div className="card-body p-5 text-center">
                <div className="mb-4">
                  <div className="bg-success bg-opacity-10 rounded-circle p-3 d-inline-flex">
                    <i className="bi bi-stripe fs-2 text-success"></i>
                  </div>
                </div>

                <h3 className="fw-bold mb-3">Stripe Account Connected! 🎉</h3>
                <p className="text-muted mb-4">
                  Your Stripe account has been successfully connected. You can
                  now receive payouts for your sales.
                </p>

                {accountInfo && (
                  <div className="bg-light rounded-3 p-3 mb-4">
                    <p className="mb-1 small text-muted">Account Status</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold">Charges Enabled</span>
                      <span className="badge bg-success">Yes</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <span className="fw-semibold">Payouts Enabled</span>
                      <span className="badge bg-success">Yes</span>
                    </div>
                  </div>
                )}

                <div className="progress mb-4" style={{ height: "8px" }}>
                  <div
                    className="progress-bar progress-bar-striped bg-success"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  ></div>
                </div>

                <p className="text-muted small mb-4">
                  Redirecting to your profile in {countdown} seconds...
                </p>

                <Link
                  href="/seller/profile"
                  className="btn btn-primary w-100 py-3 fw-semibold"
                >
                  Go to Dashboard
                  <i className="bi bi-arrow-right ms-2"></i>
                </Link>

                <div className="mt-3">
                  <Link
                    href="/seller/dashboard"
                    className="text-decoration-none"
                  >
                    <small>Skip to Dashboard →</small>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingCompletePage;
