"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./ProfilePage.css";

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

  return (
    <div className={`toast-notification toast-${type}`}>
      <i className={`bi ${getIcon()} toast-icon`}></i>
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
      if (profile.profilePicture) {
        const API = process.env.NEXT_PUBLIC_BACKEND_URL;
        const profilePicUrl = profile.profilePicture.startsWith("http")
          ? profile.profilePicture
          : `${API}/uploads/profiles/${profile.profilePicture}`;
        setProfilePreview(profilePicUrl);
      }
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
    setProfilePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();

      formDataToSend.append("fullname", formData.fullname);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("address", formData.address);

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
      setProfileImage(null);
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
                  {profilePreview && (
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

const ProfilePage = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const showToast = (message, type = "success") => setToast({ message, type });
  const closeToast = () => setToast(null);

  // Helper function to get profile picture URL
  const getProfilePictureUrl = () => {
    if (!profile?.profilePicture) return null;
    const API = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (profile.profilePicture.startsWith("http")) {
      return profile.profilePicture;
    }
    return `${API}/uploads/profiles/${profile.profilePicture}`;
  };

  // Fetch profile
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

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      setProfile(data.user || data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      showToast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="gold-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  const profilePictureUrl = getProfilePictureUrl();

  return (
    <div className="profile-page">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
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

      <div className="profile-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="header-badge">
              <i className="bi bi-person-circle"></i>
              <span>My Profile</span>
            </div>
            <h1 className="page-title">Account Settings</h1>
            <p className="page-subtitle">Manage your account information</p>
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
                className={`role-badge ${profile?.role === "admin" ? "seller" : "buyer"}`}
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
                  {profile?.createdAt ? formatDate(profile.createdAt) : "N/A"}
                </span>
              </div>
            </div>

            <div className="profile-divider"></div>

            <div className="profile-info-section">
              <h4 className="section-title-small">
                <i className="bi bi-shield-check"></i>
                Account Details
              </h4>
              <div className="info-item">
                <i className="bi bi-person-badge"></i>
                <span>Role: {profile?.role?.toUpperCase() || "User"}</span>
              </div>
              <div className="info-item">
                <i className="bi bi-envelope"></i>
                <span>{profile?.email}</span>
              </div>
              <div className="info-item">
                <i className="bi bi-calendar-week"></i>
                <span>
                  Member since{" "}
                  {profile?.createdAt ? formatDate(profile.createdAt) : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="profile-card">
            <div className="profile-avatar" style={{ paddingBottom: "20px" }}>
              <div
                className="avatar-icon"
                style={{ width: "70px", height: "70px" }}
              >
                <i className="bi bi-gear-fill" style={{ fontSize: "36px" }}></i>
              </div>
              <h3 className="profile-name" style={{ marginTop: "12px" }}>
                Quick Actions
              </h3>
            </div>

            <div className="profile-divider"></div>

            <div className="profile-info-section">
              <h4 className="section-title-small">
                <i className="bi bi-star"></i>
                Account Management
              </h4>

              {profile?.role === "admin" && (
                <div
                  className="info-item"
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push("/admin/dashboard")}
                >
                  <i className="bi bi-speedometer2"></i>
                  <span>Go to Admin Dashboard</span>
                  <i
                    className="bi bi-arrow-right ms-auto"
                    style={{ color: "var(--gold)" }}
                  ></i>
                </div>
              )}

              {profile?.role === "seller" && (
                <div
                  className="info-item"
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push("/seller/dashboard")}
                >
                  <i className="bi bi-shop"></i>
                  <span>Go to Seller Dashboard</span>
                  <i
                    className="bi bi-arrow-right ms-auto"
                    style={{ color: "var(--gold)" }}
                  ></i>
                </div>
              )}

              <div
                className="info-item"
                style={{ cursor: "pointer" }}
                onClick={() => router.push("/orders")}
              >
                <i className="bi bi-bag-check"></i>
                <span>My Orders</span>
                <i
                  className="bi bi-arrow-right ms-auto"
                  style={{ color: "var(--gold)" }}
                ></i>
              </div>

              <div
                className="info-item"
                style={{ cursor: "pointer" }}
                onClick={() => setShowEditModal(true)}
              >
                <i className="bi bi-pencil-square"></i>
                <span>Edit Profile</span>
                <i
                  className="bi bi-arrow-right ms-auto"
                  style={{ color: "var(--gold)" }}
                ></i>
              </div>
            </div>

            <div className="profile-divider"></div>

            <div className="profile-info-section">
              <h4 className="section-title-small">
                <i className="bi bi-question-circle"></i>
                Need Help?
              </h4>
              <div className="info-item">
                <i className="bi bi-headset"></i>
                <span>Contact Support</span>
              </div>
              <div className="info-item">
                <i className="bi bi-file-text"></i>
                <span>FAQs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
