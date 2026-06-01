"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const OnboardingRefreshPage = () => {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccountStatus = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login to continue");
          setLoading(false);
          return;
        }

        // Check Stripe account status
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/seller/account-status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (response.ok && data.hasAccount) {
          if (
            data.detailsSubmitted &&
            data.chargesEnabled &&
            data.payoutsEnabled
          ) {
            // Account is already verified
            setTimeout(() => {
              router.push("/seller/profile?onboarding=complete");
            }, 2000);
          } else {
            // Account exists but not completed, redirect to resume onboarding
            const createAccountResponse = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/seller/create-connect-account`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ country: "US" }),
              },
            );

            const createData = await createAccountResponse.json();

            if (createData.success && createData.onboardingUrl) {
              window.location.href = createData.onboardingUrl;
              return;
            } else {
              setError("Unable to resume onboarding. Please try again.");
            }
          }
        } else {
          setError(
            "No Stripe account found. Please start the onboarding process again.",
          );
        }
      } catch (err) {
        console.error("Error checking account status:", err);
        setError("An error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    checkAccountStatus();
  }, [router]);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (!loading && !error) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/seller/profile");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [loading, error, router]);

  if (loading) {
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
          <h5 className="text-muted">Checking your Stripe account status...</h5>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card border-0 shadow-lg rounded-4">
                <div className="card-body p-5 text-center">
                  <div className="bg-danger bg-opacity-10 rounded-circle p-4 d-inline-flex mb-4">
                    <i className="bi bi-exclamation-triangle fs-1 text-danger"></i>
                  </div>

                  <h3 className="fw-bold mb-3">Onboarding Interrupted</h3>
                  <p className="text-muted mb-4">{error}</p>

                  <div className="d-flex gap-3 justify-content-center">
                    <Link
                      href="/seller/profile"
                      className="btn btn-outline-secondary px-4"
                    >
                      Go to Profile
                    </Link>
                    <button
                      onClick={() => window.location.reload()}
                      className="btn btn-primary px-4"
                    >
                      Try Again
                    </button>
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
            <div className="card border-0 shadow-lg rounded-4">
              <div className="card-body p-5 text-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-4 d-inline-flex mb-4">
                  <i className="bi bi-arrow-repeat fs-1 text-success"></i>
                </div>

                <h3 className="fw-bold mb-3">Redirecting to Stripe</h3>
                <p className="text-muted mb-4">
                  We're redirecting you to Stripe to complete your account
                  setup.
                </p>

                <div className="progress mb-4" style={{ height: "8px" }}>
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  ></div>
                </div>

                <p className="text-muted small">
                  Redirecting in {countdown} seconds...
                </p>

                <div className="mt-3">
                  <Link href="/seller/profile" className="text-decoration-none">
                    <small>← Return to Profile</small>
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

export default OnboardingRefreshPage;
