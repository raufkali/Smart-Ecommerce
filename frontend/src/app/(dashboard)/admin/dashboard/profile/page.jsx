"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return "bi-check-circle-fill";
      case "error":
        return "bi-exclamation-circle-fill";
      case "warning":
        return "bi-exclamation-triangle-fill";
      case "info":
        return "bi-info-circle-fill";
      default:
        return "bi-bell-fill";
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-success";
      case "error":
        return "bg-danger";
      case "warning":
        return "bg-warning";
      case "info":
        return "bg-info";
      default:
        return "bg-primary";
    }
  };

  return (
    <div
      className={`toast-notification ${getBgColor()} text-white`}
      role="alert"
    >
      <i className={`bi ${getIcon()} me-2`}></i>
      <span className="flex-grow-1">{message}</span>
      <button
        type="button"
        className="btn-close btn-close-white ms-3"
        onClick={onClose}
      ></button>
      <style jsx>{`
        .toast-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          min-width: 300px;
          max-width: 400px;
          padding: 1rem 1.25rem;
          border-radius: 0.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          z-index: 9999;
          animation: slideIn 0.3s ease forwards;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Edit Profile Modal
const EditProfileModal = ({ show, onClose, profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        fullname: profile.fullname || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/profile/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      onUpdate(data.user);
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Profile</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled
                />
                <small className="text-muted">Email cannot be changed</small>
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control"
                  name="address"
                  rows="2"
                  value={formData.address}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Add Bank Account Modal
const AddBankModal = ({ show, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    accountHolderName: "",
    routingNumber: "",
    accountNumber: "",
    bankName: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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

      if (!response.ok) {
        throw new Error(data.message || "Failed to add bank account");
      }

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
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Bank Account</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Account Holder Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Bank Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Routing Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="routingNumber"
                    value={formData.routingNumber}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{9}"
                    title="9 digit routing number"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Account Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <small className="text-muted">
                Your bank details are encrypted and secure
              </small>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Adding...
                  </>
                ) : (
                  "Add Bank Account"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Withdraw Modal
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

      if (!response.ok) {
        throw new Error(data.message || "Failed to process withdrawal");
      }

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
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Withdraw Funds</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-info">
                <strong>Available Balance:</strong> ${maxAmount.toFixed(2)}
              </div>
              <div className="mb-3">
                <label className="form-label">Amount to Withdraw ($)</label>
                <input
                  type="number"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max={maxAmount}
                  step="0.01"
                  required
                />
              </div>
              <p className="text-muted small">
                Funds will be transferred to your bank account within 2-7
                business days.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !amount || amount > maxAmount}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Processing...
                  </>
                ) : (
                  "Withdraw"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const transactionsPerPage = 10;

  const showToast = (message, type = "success") => setToast({ message, type });
  const closeToast = () => setToast(null);

  // Fetch profile
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

  // Fetch wallet
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

  // Fetch transactions
  const fetchTransactions = async (page = 1) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/wallet/transactions?page=${page}&limit=${transactionsPerPage}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
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

  // Load all data
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
        return "bi-arrow-down-circle-fill text-success";
      case "send":
        return "bi-arrow-up-circle-fill text-danger";
      case "withdrawal":
        return "bi-bank text-warning";
      case "refund":
        return "bi-arrow-return-left text-info";
      default:
        return "bi-circle-fill text-secondary";
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: "warning",
      locked: "info",
      available: "success",
      completed: "success",
      failed: "danger",
    };
    return colors[status] || "secondary";
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="text-muted">Loading profile...</h5>
      </div>
    );
  }

  const isSeller = profile?.role === "seller";

  return (
    <div className="container py-4">
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      {/* Modals */}
      <EditProfileModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={profile}
        onUpdate={(updatedProfile) => {
          setProfile(updatedProfile);
          showToast("Profile updated successfully", "success");
        }}
      />

      <AddBankModal
        show={showBankModal}
        onClose={() => setShowBankModal(false)}
        onSuccess={() => {
          fetchWallet();
          showToast("Bank account added successfully", "success");
        }}
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

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-2">My Profile</h1>
          <p className="text-muted mb-0">Manage your account and finances</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowEditModal(true)}
        >
          <i className="bi bi-pencil-square me-2"></i>
          Edit Profile
        </button>
      </div>

      <div className="row">
        {/* Profile Information */}
        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-center mb-4">
                <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                  <i className="bi bi-person-circle fs-1 text-primary"></i>
                </div>
                <h4 className="fw-bold mb-1">{profile?.fullname}</h4>
                <p className="text-muted mb-2">{profile?.email}</p>
                <span
                  className={`badge bg-${profile?.role === "seller" ? "success" : "info"} px-3 py-2`}
                >
                  {profile?.role?.toUpperCase()}
                </span>
              </div>

              <hr />

              <div className="mb-3">
                <h6 className="fw-semibold mb-3">Contact Information</h6>
                <div className="d-flex mb-2">
                  <i className="bi bi-telephone me-3 text-muted"></i>
                  <span>{profile?.phone || "Not provided"}</span>
                </div>
                <div className="d-flex mb-2">
                  <i className="bi bi-geo-alt me-3 text-muted"></i>
                  <span>{profile?.address || "Not provided"}</span>
                </div>
                <div className="d-flex">
                  <i className="bi bi-calendar me-3 text-muted"></i>
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
                  <hr />
                  <div className="mb-3">
                    <h6 className="fw-semibold mb-3">Bank Account</h6>
                    {wallet?.bankAccountLast4 ? (
                      <div className="d-flex align-items-center">
                        <i className="bi bi-bank2 me-3 text-primary fs-4"></i>
                        <div>
                          <div className="fw-semibold">
                            {wallet.bankAccountName}
                          </div>
                          <small className="text-muted">
                            ****{wallet.bankAccountLast4}
                          </small>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn btn-outline-primary w-100"
                        onClick={() => setShowBankModal(true)}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Add Bank Account
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Wallet & Transactions */}
        <div className="col-lg-8">
          {/* Wallet Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm bg-primary bg-opacity-10 h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-2">Available Balance</h6>
                  <h3 className="fw-bold text-primary mb-0">
                    {formatCurrency(wallet?.availableBalance || 0)}
                  </h3>
                  <small className="text-muted">Ready for withdrawal</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm bg-warning bg-opacity-10 h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-2">Locked Balance</h6>
                  <h3 className="fw-bold text-warning mb-0">
                    {formatCurrency(wallet?.lockedBalance || 0)}
                  </h3>
                  <small className="text-muted">In escrow</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm bg-info bg-opacity-10 h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-2">Total Earned</h6>
                  <h3 className="fw-bold text-info mb-0">
                    {formatCurrency(wallet?.totalEarned || 0)}
                  </h3>
                  <small className="text-muted">Lifetime earnings</small>
                </div>
              </div>
            </div>
          </div>

          {/* Withdraw Button for Sellers */}
          {isSeller && wallet?.availableBalance > 0 && (
            <div className="mb-4">
              <button
                className="btn btn-success w-100 py-3"
                onClick={() => setShowWithdrawModal(true)}
              >
                <i className="bi bi-cash-stack me-2"></i>
                Withdraw Funds (${wallet.availableBalance.toFixed(2)} available)
              </button>
            </div>
          )}

          {/* Transaction History */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="card-title fw-semibold mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Transaction History
              </h5>
            </div>
            <div className="card-body p-0">
              {transactions.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-arrow-left-right display-1 text-muted"></i>
                  <h6 className="mt-3 text-muted">No transactions yet</h6>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, index) => (
                          <tr key={index}>
                            <td>
                              <i
                                className={`bi ${getTransactionIcon(tx.type)} me-2 fs-5`}
                              ></i>
                              <span className="text-capitalize">{tx.type}</span>
                            </td>
                            <td>{tx.description}</td>
                            <td
                              className={
                                tx.amount > 0 ? "text-success" : "text-danger"
                              }
                            >
                              <strong>
                                {tx.amount > 0 ? "+" : ""}
                                {formatCurrency(tx.amount)}
                              </strong>
                            </td>
                            <td>
                              <span
                                className={`badge bg-${getStatusBadge(tx.status)}`}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td>
                              <small className="text-muted">
                                {formatDate(tx.createdAt)}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center py-3">
                      <nav>
                        <ul className="pagination">
                          <li
                            className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(currentPage - 1)}
                            >
                              Previous
                            </button>
                          </li>
                          {[...Array(totalPages)].map((_, i) => (
                            <li
                              key={i + 1}
                              className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                            >
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(i + 1)}
                              >
                                {i + 1}
                              </button>
                            </li>
                          ))}
                          <li
                            className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(currentPage + 1)}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
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
