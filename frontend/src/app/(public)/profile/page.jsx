"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./ProfilePage.css";

// ─────────────────────────────────────────────
// Toast Component
// ─────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: "bi-check-circle-fill",
    error: "bi-exclamation-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    info: "bi-info-circle-fill",
  };

  return (
    <div className={`profile-toast ${type}`} role="alert">
      <i className={`bi ${icons[type] || "bi-bell-fill"}`}></i>
      <span>{message}</span>
      <button className="toast-close-btn" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// Edit Profile Modal
// ─────────────────────────────────────────────
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
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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
        alert("Please select a valid image file (JPEG, PNG, GIF, or WEBP)");
        return;
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB");
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);

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
      if (!response.ok)
        throw new Error(data.message || "Failed to update profile");

      onUpdate(data.user);
      onClose();
      // Reset image state
      setProfileImage(null);
      setProfilePreview(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (!show) return null;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div
        className="profile-modal profile-modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h5>Edit Profile</h5>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body-two-columns">
            {/* Left Column - Profile Picture */}
            <div className="modal-left-column">
              <div className="profile-picture-section-large">
                <label className="profile-picture-label-large">
                  Profile Photo
                </label>
                <div className="profile-picture-container-large">
                  <div className="profile-picture-preview-large">
                    {profilePreview ? (
                      <img src={profilePreview} alt="Profile preview" />
                    ) : (
                      <div className="profile-picture-placeholder-large">
                        <i className="bi bi-person-fill"></i>
                      </div>
                    )}
                  </div>
                  <div className="profile-picture-actions">
                    <label
                      htmlFor="profile-image-input-large"
                      className="btn-upload-image-large"
                    >
                      <i className="bi bi-camera"></i>
                      {profilePreview ? "Change" : "Upload"}
                    </label>
                    <input
                      id="profile-image-input-large"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                    {profilePreview && profile?.profilePicture && (
                      <button
                        type="button"
                        className="btn-remove-image-large"
                        onClick={() => {
                          setProfileImage(null);
                          setProfilePreview(profile?.profilePicture || null);
                        }}
                      >
                        <i className="bi bi-trash"></i> Remove
                      </button>
                    )}
                  </div>
                  <p className="form-hint-large">
                    <i className="bi bi-info-circle"></i> JPG, PNG, GIF, WEBP up
                    to 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="modal-right-column">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled
                />
                <p className="form-hint">Email cannot be changed</p>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="upload-progress-wrapper">
              <div className="upload-progress">
                <div
                  className="upload-progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="upload-progress-text">{uploadProgress}%</span>
            </div>
          )}

          <div className="modal-foot">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span> Updating…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Add Bank Account Modal
// ─────────────────────────────────────────────
const AddBankModal = ({ show, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    accountHolderName: "",
    routingNumber: "",
    accountNumber: "",
    bankName: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/wallet/bank-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to add bank account");
      onSuccess();
      onClose();
      setFormData({
        accountHolderName: "",
        routingNumber: "",
        accountNumber: "",
        bankName: "",
      });
    } catch (error) {
      console.error("Error adding bank account:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h5>Add Bank Account</h5>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Account Holder Name</label>
              <input
                type="text"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Routing Number</label>
                <input
                  type="text"
                  name="routingNumber"
                  value={formData.routingNumber}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{9}"
                  title="9 digit routing number"
                />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <p className="form-hint">
              <i className="bi bi-shield-lock me-1"></i>
              Your bank details are encrypted and secure
            </p>
          </div>
          <div className="modal-foot">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span> Adding…
                </>
              ) : (
                "Add Bank Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Withdraw Modal
// ─────────────────────────────────────────────
const WithdrawModal = ({ show, onClose, wallet, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/wallet/withdraw`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: parseFloat(amount) }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to process withdrawal");
      onSuccess();
      onClose();
      setAmount("");
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  const maxAmount = wallet?.availableBalance || 0;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h5>Withdraw Funds</h5>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-alert">
              <i className="bi bi-shield-lock-fill"></i>
              <span>
                <strong>Available:</strong> ${maxAmount.toFixed(2)}
              </span>
            </div>
            <div className="form-group">
              <label>Amount to Withdraw (USD)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                max={maxAmount}
                step="0.01"
                required
              />
            </div>
            <p className="form-hint">
              Funds arrive in your bank account within 2–7 business days.
            </p>
          </div>
          <div className="modal-foot">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={loading || !amount || amount > maxAmount}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span> Processing…
                </>
              ) : (
                "Withdraw"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Profile Page
// ─────────────────────────────────────────────
const ProfilePage = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const transactionsPerPage = 10;

  const showToast = (message, type = "success") => setToast({ message, type });
  const closeToast = () => setToast(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
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

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchWallet(), fetchTransactions()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchTransactions(newPage);
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));

  const getTransactionIcon = (type) => {
    const map = {
      received: "bi-arrow-down-circle-fill received",
      send: "bi-arrow-up-circle-fill send",
      withdrawal: "bi-bank withdrawal",
      refund: "bi-arrow-return-left refund",
    };
    return map[type] || "bi-circle-fill default";
  };

  const getStatusClass = (status) => {
    const map = {
      pending: "pending",
      locked: "locked",
      available: "completed",
      completed: "completed",
      failed: "failed",
    };
    return map[status] || "pending";
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loader-spinner"></div>
        <p>Loading profile…</p>
      </div>
    );
  }

  const isSeller = profile?.role === "seller";

  return (
    <div className="profile-page">
      <div className="container">
        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        )}

        {/* Modals */}
        <EditProfileModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={profile}
          onUpdate={(updated) => {
            setProfile(updated);
            showToast("Profile updated successfully");
          }}
        />
        <AddBankModal
          show={showBankModal}
          onClose={() => setShowBankModal(false)}
          onSuccess={() => {
            fetchWallet();
            showToast("Bank account added successfully");
          }}
        />
        <WithdrawModal
          show={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          wallet={wallet}
          onSuccess={() => {
            fetchWallet();
            fetchTransactions();
            showToast("Withdrawal initiated successfully");
          }}
        />

        {/* Page header */}
        <div className="profile-header">
          <div className="profile-header-left">
            <h1>My Profile</h1>
            <p>Manage your account and finances</p>
          </div>
          <button
            className="btn-edit-profile"
            onClick={() => setShowEditModal(true)}
          >
            <i className="bi bi-pencil-square"></i> Edit Profile
          </button>
        </div>

        {/* Main grid */}
        <div className="profile-grid">
          {/* ── Left column: identity card ── */}
          <div className="profile-card">
            <div className="profile-card-body">
              {/* Identity */}
              {/* Identity */}
              <div className="identity-block">
                <div className="avatar-ring">
                  {profile?.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt={profile.fullname}
                      className="profile-avatar-image"
                    />
                  ) : (
                    <i className="bi bi-person-fill"></i>
                  )}
                </div>
                <h3 className="identity-name">{profile?.fullname}</h3>
                <p className="identity-email">{profile?.email}</p>
                <span
                  className={`role-badge ${profile?.role === "seller" ? "seller" : "user"}`}
                >
                  {profile?.role?.toUpperCase()}
                </span>
              </div>

              {/* Contact */}
              <div className="contact-section">
                <h6>Contact Information</h6>
                <div className="contact-list">
                  <div className="contact-row">
                    <i className="bi bi-telephone"></i>
                    <span>{profile?.phone || "Not provided"}</span>
                  </div>
                  <div className="contact-row">
                    <i className="bi bi-geo-alt"></i>
                    <span>{profile?.address || "Not provided"}</span>
                  </div>
                  <div className="contact-row">
                    <i className="bi bi-calendar3"></i>
                    <span>
                      Joined{" "}
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank (seller only) */}
              {isSeller && (
                <div className="bank-section">
                  <h6>Bank Account</h6>
                  {wallet?.bankAccountLast4 ? (
                    <div className="bank-connected">
                      <i className="bi bi-bank2 bank-icon"></i>
                      <div>
                        <div className="bank-name">
                          {wallet.bankAccountName}
                        </div>
                        <div className="bank-last4">
                          ****{wallet.bankAccountLast4}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn-add-bank"
                      onClick={() => setShowBankModal(true)}
                    >
                      <i className="bi bi-plus-circle"></i> Add Bank Account
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="profile-right">
            {/* Wallet stats */}
            <div className="wallet-stats">
              <div className="wallet-stat-card available">
                <div className="stat-label">Available Balance</div>
                <div className="stat-value">
                  {formatCurrency(wallet?.availableBalance || 0)}
                </div>
                <div className="stat-hint">Ready for withdrawal</div>
              </div>
              <div className="wallet-stat-card locked">
                <div className="stat-label">Locked Balance</div>
                <div className="stat-value">
                  {formatCurrency(wallet?.lockedBalance || 0)}
                </div>
                <div className="stat-hint">In escrow</div>
              </div>
              <div className="wallet-stat-card earned">
                <div className="stat-label">Total Earned</div>
                <div className="stat-value">
                  {formatCurrency(wallet?.totalEarned || 0)}
                </div>
                <div className="stat-hint">Lifetime earnings</div>
              </div>
            </div>

            {/* Withdraw button (seller only) */}
            {isSeller && wallet?.availableBalance > 0 && (
              <button
                className="btn-withdraw"
                onClick={() => setShowWithdrawModal(true)}
              >
                <i className="bi bi-cash-stack"></i>
                Withdraw Funds &mdash; {formatCurrency(
                  wallet.availableBalance,
                )}{" "}
                available
              </button>
            )}

            {/* Transactions */}
            <div className="transactions-card">
              <div className="transactions-header">
                <i className="bi bi-clock-history"></i>
                <h5>Transaction History</h5>
              </div>

              {transactions.length === 0 ? (
                <div className="tx-empty">
                  <i className="bi bi-arrow-left-right"></i>
                  <p>No transactions yet</p>
                </div>
              ) : (
                <>
                  <div className="tx-table-wrapper">
                    <table className="tx-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, idx) => (
                          <tr key={idx}>
                            <td>
                              <div className="tx-type-cell">
                                <i
                                  className={`bi ${getTransactionIcon(tx.type)}`}
                                ></i>
                                <span className="tx-type-label">{tx.type}</span>
                              </div>
                            </td>
                            <td>
                              <div
                                className="tx-description"
                                title={tx.description}
                              >
                                {tx.description}
                              </div>
                            </td>
                            <td>
                              <span
                                className={`tx-amount ${tx.amount > 0 ? "positive" : "negative"}`}
                              >
                                {tx.amount > 0 ? "+" : ""}
                                {formatCurrency(tx.amount)}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`tx-status-badge ${getStatusClass(tx.status)}`}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td>
                              <span className="tx-date">
                                {formatDate(tx.createdAt)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="tx-pagination">
                      <button
                        className="page-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
                          onClick={() => handlePageChange(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        className="page-btn"
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
