"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./ProfilePage.css";

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: "bi-check-circle-fill",
    error: "bi-exclamation-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    info: "bi-info-circle-fill",
  };

  return (
    <div className={`toast-notification toast-${type}`}>
      <i className={`bi ${icons[type] || "bi-bell-fill"} toast-icon`}></i>
      <span className="toast-message">{message}</span>
      <button className="toast-close-btn" onClick={onClose}>
        <i className="bi bi-x-lg"></i>
      </button>
    </div>
  );
};

// Edit Profile Modal with Profile Picture Upload
const EditProfileModal = ({ show, onClose, profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    address: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({
        fullname: profile.fullname || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
      setProfilePreview(profile.profilePicture || null);
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Please select a valid image file (JPEG, PNG, GIF, or WEBP)");
        return;
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setError("File size must be less than 2MB");
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setProfilePreview(profile?.profilePicture || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();

      // Append text fields
      formDataToSend.append("fullname", formData.fullname);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("address", formData.address);

      // Append image if selected
      if (profileImage) {
        formDataToSend.append("profileImage", profileImage);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/profile/update`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      onUpdate(data.user);
      onClose();
      // Reset image state
      setProfileImage(null);
      setProfilePreview(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="bi bi-pencil-square"></i>
            Edit Profile
          </h5>
          <button className="modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body-two-columns">
            {/* Left Column - Profile Picture */}
            <div className="profile-picture-column">
              <label className="form-label">Profile Picture</label>
              <div className="profile-preview-container">
                <div className="profile-preview-large">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Profile preview" />
                  ) : (
                    <div className="profile-preview-placeholder">
                      <i className="bi bi-person-fill"></i>
                    </div>
                  )}
                </div>
                <div className="profile-preview-actions">
                  <label htmlFor="profile-image-input" className="btn-upload">
                    <i className="bi bi-camera"></i>
                    {profilePreview ? "Change Photo" : "Upload Photo"}
                  </label>
                  <input
                    id="profile-image-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                  {profilePreview && profile?.profilePicture && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={removeImage}
                    >
                      <i className="bi bi-trash"></i> Remove
                    </button>
                  )}
                </div>
                <small className="form-hint">
                  <i className="bi bi-info-circle"></i> JPG, PNG, GIF, WEBP up
                  to 2MB
                </small>
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="form-fields-column">
              <div className="form-group">
                <label>
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  disabled
                />
                <small className="form-hint">Email cannot be changed</small>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  className="form-textarea"
                  name="address"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <i className="bi bi-exclamation-triangle-fill"></i>
              {error}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner"></span> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Stripe Connect Modal (unchanged)
const StripeConnectModal = ({
  show,
  onClose,
  onSuccess,
  isReconnect = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState("US");

  const handleConnect = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/seller/create-connect-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ country }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create Stripe account");
      }

      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }

      onSuccess();
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="bi bi-stripe"></i>
            {isReconnect ? "Complete Stripe Setup" : "Connect Stripe Account"}
          </h5>
          <button className="modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="info-alert info">
            <i className="bi bi-shield-check"></i>
            <div>
              <strong>Secure Payouts with Stripe</strong>
              <p>
                {isReconnect
                  ? "Your Stripe account setup is incomplete. Please complete the onboarding to receive payouts."
                  : "To receive payouts from your sales, you need to connect a Stripe account. This allows us to securely transfer your earnings to your bank account."}
              </p>
            </div>
          </div>

          {!isReconnect && (
            <div className="form-group">
              <label>Country</label>
              <select
                className="form-select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="IN">India</option>
                <option value="PK">Pakistan</option>
              </select>
              <small className="form-hint">
                Select where your bank account is located
              </small>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner"></span>
            ) : isReconnect ? (
              "Complete Setup"
            ) : (
              "Connect with Stripe"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Withdraw Modal (unchanged)
const WithdrawModal = ({ show, onClose, wallet, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (withdrawAmount > (wallet?.availableBalance || 0)) {
      setError("Amount exceeds available balance");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/payment/withdraw`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: withdrawAmount }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to process withdrawal");
      }

      onSuccess();
      onClose();
      setAmount("");
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  const maxAmount = wallet?.availableBalance || 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header modal-header-success">
          <h5 className="modal-title">
            <i className="bi bi-cash-stack"></i>
            Withdraw Funds
          </h5>
          <button className="modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="info-card">
              <div className="info-row">
                <span>Available Balance:</span>
                <strong className="gold-text">${maxAmount.toFixed(2)}</strong>
              </div>
            </div>

            <div className="form-group">
              <label>Amount to Withdraw ($)</label>
              <input
                type="number"
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                max={maxAmount}
                step="0.01"
                placeholder="Enter amount"
              />
            </div>

            {error && (
              <div className="error-message">
                <i className="bi bi-exclamation-triangle-fill"></i>
                {error}
              </div>
            )}

            <div className="info-alert info">
              <i className="bi bi-clock-history"></i>
              <div>
                <strong>Processing Time</strong>
                <p>
                  Funds will be transferred to your Stripe account and then to
                  your bank account within 2-7 business days.
                </p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-success"
              disabled={loading || !amount || parseFloat(amount) > maxAmount}
            >
              {loading ? <span className="spinner"></span> : "Withdraw Funds"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Profile Page Component
const ProfilePage = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const transactionsPerPage = 10;

  const showToast = (message, type = "success") => setToast({ message, type });

  // Helper function to get profile picture URL
  const getProfilePictureUrl = () => {
    if (!profile) return null;
    const profilePic = profile.profilePicture;
    if (profilePic) {
      if (profilePic.startsWith("http")) {
        return profilePic;
      }
      return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/profiles/${profilePic}`;
    }
    return null;
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/profile/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setProfile(data.user || data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      showToast("Failed to load profile", "error");
    }
  };

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/wallet/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch wallet");
      const data = await response.json();
      setWallet(data.wallet);
    } catch (error) {
      console.error("Error fetching wallet:", error);
    }
  };

  const fetchStripeStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/seller/account-status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setStripeStatus(data);

        if (data.hasAccount && !data.isComplete) {
          showToast(
            "Your Stripe account setup is incomplete. Please complete it to receive payouts.",
            "warning",
          );
        }
      }
    } catch (error) {
      console.error("Error fetching Stripe status:", error);
    }
  };

  const fetchTransactions = async (page = 1) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/wallet/transactions?page=${page}&limit=${transactionsPerPage}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data = await response.json();
      setTransactions(data.transactions || []);
      setTotalPages(data.pagination?.pages || 1);
      setCurrentPage(data.pagination?.page || 1);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    const checkOnboarding = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("onboarding") === "complete") {
        showToast("Stripe account connected successfully!", "success");
        await fetchStripeStatus();
        await fetchWallet();
        router.replace("/profile");
      }
    };
    checkOnboarding();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProfile(),
      fetchWallet(),
      fetchTransactions(),
      fetchStripeStatus(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchTransactions(newPage);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "received":
        return "bi-arrow-down-circle-fill";
      case "send":
        return "bi-arrow-up-circle-fill";
      case "withdrawal":
        return "bi-bank2";
      case "refund":
        return "bi-arrow-return-left";
      default:
        return "bi-circle";
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "received":
        return "success";
      case "send":
        return "danger";
      case "withdrawal":
        return "warning";
      case "refund":
        return "info";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="gold-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  const isSeller = profile?.role === "seller";
  const hasStripeAccount = stripeStatus?.hasAccount;
  const isStripeVerified = stripeStatus?.isComplete;
  const profilePictureUrl = getProfilePictureUrl();

  return (
    <div className="profile-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <EditProfileModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={profile}
        onUpdate={(updatedProfile) => {
          setProfile(updatedProfile);
          showToast("Profile updated successfully", "success");
        }}
      />

      <StripeConnectModal
        show={showStripeModal}
        onClose={() => setShowStripeModal(false)}
        onSuccess={() => {}}
        isReconnect={false}
      />

      <StripeConnectModal
        show={showReconnectModal}
        onClose={() => setShowReconnectModal(false)}
        onSuccess={() => {}}
        isReconnect={true}
      />

      <WithdrawModal
        show={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        wallet={wallet}
        onSuccess={() => {
          fetchWallet();
          fetchTransactions();
          showToast("Withdrawal initiated successfully", "success");
        }}
      />

      <div className="profile-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="header-badge">
              <i className="bi bi-person-circle"></i>
              <span>My Profile</span>
            </div>
            <h1 className="page-title">Account Settings</h1>
            <p className="page-subtitle">Manage your account and finances</p>
          </div>
          <button
            className="btn-primary-gold"
            onClick={() => setShowEditModal(true)}
          >
            <i className="bi bi-pencil-square"></i>
            Edit Profile
          </button>
        </div>

        <div className="profile-grid">
          {/* Profile Information Card */}
          <div className="profile-card">
            <div className="profile-avatar">
              <div className="avatar-wrapper">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt={profile?.fullname}
                    className="profile-avatar-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                      e.target.parentElement.innerHTML =
                        '<i class="bi bi-person-circle"></i>';
                    }}
                  />
                ) : (
                  <i className="bi bi-person-circle"></i>
                )}
              </div>
              <h3 className="profile-name">{profile?.fullname}</h3>
              <p className="profile-email">{profile?.email}</p>
              <span
                className={`role-badge ${profile?.role === "seller" ? "seller" : "buyer"}`}
              >
                {profile?.role?.toUpperCase()}
              </span>
            </div>

            <div className="profile-divider"></div>

            <div className="profile-info-section">
              <h4 className="section-title-small">
                <i className="bi bi-info-circle"></i>
                Contact Information
              </h4>
              <div className="info-item">
                <i className="bi bi-telephone"></i>
                <span>{profile?.phone || "Not provided"}</span>
              </div>
              <div className="info-item">
                <i className="bi bi-geo-alt"></i>
                <span>{profile?.address || "Not provided"}</span>
              </div>
              <div className="info-item">
                <i className="bi bi-calendar"></i>
                <span>
                  Joined{" "}
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>

            {isSeller && (
              <>
                <div className="profile-divider"></div>
                <div className="profile-info-section">
                  <h4 className="section-title-small">
                    <i className="bi bi-stripe"></i>
                    Stripe Connect
                  </h4>
                  {hasStripeAccount ? (
                    <div
                      className={`stripe-status ${isStripeVerified ? "verified" : "incomplete"}`}
                    >
                      <i
                        className={`bi ${isStripeVerified ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"}`}
                      ></i>
                      <div>
                        <strong>
                          {isStripeVerified ? "Verified" : "Incomplete Setup"}
                        </strong>
                        <p>
                          {isStripeVerified
                            ? "Your Stripe account is connected and verified."
                            : "Your Stripe account setup is not complete."}
                        </p>
                        {!isStripeVerified && (
                          <button
                            className="btn-small-warning"
                            onClick={() => setShowReconnectModal(true)}
                          >
                            <i className="bi bi-arrow-repeat"></i>
                            Complete Setup
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn-outline-gold w-100"
                      onClick={() => setShowStripeModal(true)}
                    >
                      <i className="bi bi-stripe"></i>
                      Connect Stripe Account
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Wallet & Transactions Section */}
          <div className="wallet-section">
            {/* Wallet Cards */}
            <div className="wallet-grid">
              <div className="wallet-card available">
                <div className="wallet-icon">
                  <i className="bi bi-cash-stack"></i>
                </div>
                <div className="wallet-info">
                  <span className="wallet-label">Available Balance</span>
                  <h3 className="wallet-amount">
                    {formatCurrency(wallet?.availableBalance || 0)}
                  </h3>
                  <small>Ready for withdrawal</small>
                </div>
              </div>

              <div className="wallet-card locked">
                <div className="wallet-icon">
                  <i className="bi bi-shield-lock"></i>
                </div>
                <div className="wallet-info">
                  <span className="wallet-label">Locked Balance</span>
                  <h3 className="wallet-amount">
                    {formatCurrency(wallet?.lockedBalance || 0)}
                  </h3>
                  <small>In escrow</small>
                </div>
              </div>

              <div className="wallet-card earned">
                <div className="wallet-icon">
                  <i className="bi bi-trophy"></i>
                </div>
                <div className="wallet-info">
                  <span className="wallet-label">Total Earned</span>
                  <h3 className="wallet-amount">
                    {formatCurrency(wallet?.totalEarned || 0)}
                  </h3>
                  <small>Lifetime earnings</small>
                </div>
              </div>
            </div>

            {/* Withdraw Button */}
            {isSeller &&
              wallet?.availableBalance > 0 &&
              hasStripeAccount &&
              isStripeVerified && (
                <div className="withdraw-section">
                  <button
                    className="btn-success-gold"
                    onClick={() => setShowWithdrawModal(true)}
                  >
                    <i className="bi bi-cash-stack"></i>
                    Withdraw Funds (${wallet.availableBalance.toFixed(2)}{" "}
                    available)
                  </button>
                </div>
              )}

            {isSeller &&
              wallet?.availableBalance > 0 &&
              (!hasStripeAccount || !isStripeVerified) && (
                <div className="alert-warning-card">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <div>
                    <strong>Withdrawal Unavailable</strong>
                    <p>
                      {!hasStripeAccount
                        ? "Please connect your Stripe account to withdraw funds."
                        : "Please complete your Stripe account setup to withdraw funds."}
                    </p>
                  </div>
                  {hasStripeAccount && !isStripeVerified ? (
                    <button
                      className="btn-small-warning"
                      onClick={() => setShowReconnectModal(true)}
                    >
                      Complete Setup
                    </button>
                  ) : (
                    !hasStripeAccount && (
                      <button
                        className="btn-small-gold"
                        onClick={() => setShowStripeModal(true)}
                      >
                        Connect Now
                      </button>
                    )
                  )}
                </div>
              )}

            {/* Transaction History */}
            <div className="transactions-card">
              <div className="card-header-custom">
                <h5 className="card-title-custom">
                  <i className="bi bi-clock-history"></i>
                  Transaction History
                </h5>
              </div>

              {transactions.length === 0 ? (
                <div className="empty-transactions">
                  <i className="bi bi-receipt"></i>
                  <h6>No transactions yet</h6>
                  <p>Your transaction history will appear here</p>
                </div>
              ) : (
                <>
                  <div className="transactions-list">
                    {transactions.map((tx, index) => (
                      <div key={index} className="transaction-item">
                        <div
                          className={`transaction-icon ${getTransactionColor(tx.type)}`}
                        >
                          <i
                            className={`bi ${getTransactionIcon(tx.type)}`}
                          ></i>
                        </div>
                        <div className="transaction-details">
                          <div className="transaction-header">
                            <span className="transaction-type">{tx.type}</span>
                            <span className="transaction-date">
                              {formatDate(tx.createdAt)}
                            </span>
                          </div>
                          <p className="transaction-description">
                            {tx.description}
                          </p>
                          <span className={`transaction-status ${tx.status}`}>
                            {tx.status}
                          </span>
                        </div>
                        <div
                          className={`transaction-amount ${tx.amount > 0 ? "positive" : "negative"}`}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {formatCurrency(tx.amount)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className={`page-btn ${currentPage === 1 ? "disabled" : ""}`}
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
                          onClick={() => handlePageChange(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        className={`page-btn ${currentPage === totalPages ? "disabled" : ""}`}
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
