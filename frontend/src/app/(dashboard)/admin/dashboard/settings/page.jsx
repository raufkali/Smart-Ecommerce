"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "./AdminSettings.css";

const AdminSettingsPage = () => {
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [previews, setPreviews] = useState({}); // index -> local blob URL

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/settings/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBanners(data.data.banners);
        } else {
          showToast("Failed to load settings", "error");
        }
      })
      .catch(() => showToast("Failed to load settings", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleFieldChange = (index, field, value) => {
    const updated = [...banners];
    updated[index] = { ...updated[index], [field]: value };
    setBanners(updated);
  };

  const handleImageChange = (index, file) => {
    // Show local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews((prev) => ({ ...prev, [index]: e.target.result }));
    };
    reader.readAsDataURL(file);
    // Store the file itself in a ref-like manner – we'll use a separate array
    // We can keep a ref: useRef([]) but for simplicity we'll gather files on submit.
  };

  // On submit, build FormData with banners fields and new image files
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    const formData = new FormData();
    // Append each banner's text fields as separate arrays (or as JSON)
    banners.forEach((banner, idx) => {
      formData.append(`banners[${idx}][title]`, banner.title);
      formData.append(`banners[${idx}][subtitle]`, banner.subtitle || "");
      formData.append(`banners[${idx}][desc]`, banner.desc || "");
      formData.append(`banners[${idx}][btn]`, banner.btn);
      formData.append(`banners[${idx}][link]`, banner.link);
      formData.append(`banners[${idx}][img]`, banner.img); // current URL, will be ignored on server if new file present
    });

    // Append new image files (we'll get them from input refs)
    for (let i = 0; i < banners.length; i++) {
      const fileInput = document.getElementById(`banner-image-${i}`);
      if (fileInput && fileInput.files[0]) {
        formData.append("images", fileInput.files[0]);
      }
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/settings/`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      const data = await res.json();
      if (data.success) {
        showToast("Hero banners updated successfully", "success");
        // Refresh the state from response
        setBanners(data.data.banners);
        setPreviews({}); // clear local previews
      } else {
        throw new Error(data.message || "Update failed");
      }
    } catch (err) {
      showToast(err.message || "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="gold-spinner"></div>
        <p>Loading settings…</p>
      </div>
    );
  }

  const getImageSrc = (banner, idx) => {
    if (previews[idx]) return previews[idx];
    if (banner.img) {
      if (banner.img.startsWith("http")) return banner.img;
      return `${banner.img}`;
    }
    return "/placeholder.jpg";
  };

  return (
    <div className="seller-products admin-settings-page">
      {toast && (
        <div className={`toast-container toast-${toast.type}`}>
          <span>{toast.msg}</span>
          <button className="toast-close" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}

      <div className="products-container">
        <div className="page-header">
          <div>
            <div className="header-badge">
              <i className="bi bi-sliders2-vertical"></i>
              <span>Homepage Settings</span>
            </div>
            <h1 className="page-title">Hero Banners</h1>
            <p className="page-subtitle">Edit the three rotating hero slides</p>
          </div>
          <button
            className="btn-primary-gold"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? <span className="spinner"></span> : "Save Changes"}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="banners-grid">
            {banners.map((banner, idx) => (
              <div key={idx} className="banner-edit-card">
                <div className="banner-preview">
                  <Image
                    src={getImageSrc(banner, idx)}
                    alt={`Banner ${idx + 1}`}
                    width={1200}
                    height={600}
                    className="banner-preview-img"
                  />
                  <div className="banner-overlay-edit">
                    <label
                      htmlFor={`banner-image-${idx}`}
                      className="upload-image-btn"
                    >
                      <i className="bi bi-camera"></i> Change Image
                    </label>
                    <input
                      id={`banner-image-${idx}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageChange(idx, e.target.files[0])
                      }
                      hidden
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={banner.title}
                      onChange={(e) =>
                        handleFieldChange(idx, "title", e.target.value)
                      }
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Subtitle</label>
                    <input
                      type="text"
                      value={banner.subtitle}
                      onChange={(e) =>
                        handleFieldChange(idx, "subtitle", e.target.value)
                      }
                      className="form-input"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={banner.desc}
                      onChange={(e) =>
                        handleFieldChange(idx, "desc", e.target.value)
                      }
                      className="form-textarea"
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Button Text</label>
                    <input
                      type="text"
                      value={banner.btn}
                      onChange={(e) =>
                        handleFieldChange(idx, "btn", e.target.value)
                      }
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Link</label>
                    <input
                      type="text"
                      value={banner.link}
                      onChange={(e) =>
                        handleFieldChange(idx, "link", e.target.value)
                      }
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </form>
      </div>

      <style jsx>{`
        .banners-grid {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        .banner-edit-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }
        .banner-preview {
          position: relative;
          width: 100%;
          aspect-ratio: 2 / 1;
          overflow: hidden;
        }
        .banner-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .banner-overlay-edit {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
          display: flex;
          justify-content: center;
        }
        .upload-image-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: var(--gold-light);
          color: #1a1712;
          border-radius: 8px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .upload-image-btn:hover {
          background: var(--gold);
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding: 24px;
        }
        .full-width {
          grid-column: 1 / -1;
        }
        .form-group label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }
        .form-input,
        .form-textarea {
          width: 100%;
          padding: 10px 14px;
          font-family: var(--font-body);
          font-size: 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          color: var(--text-primary);
          transition: border-color 0.2s;
        }
        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--gold);
          box-shadow: 0 0 0 2px var(--gold-pale);
        }
        .toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          background: #333;
          color: #fff;
          padding: 14px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: var(--shadow-lg);
        }
        .toast-container.toast-success {
          background: #10b981;
        }
        .toast-container.toast-error {
          background: #ef4444;
        }
        .toast-close {
          margin-left: auto;
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default AdminSettingsPage;
