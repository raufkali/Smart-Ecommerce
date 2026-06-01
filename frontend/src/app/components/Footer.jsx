"use client";

import React from "react";
import Link from "next/link";
import "./Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="shopnest-footer">
      {/* Main Footer */}
      <div className="container py-5">
        <div className="row g-4">
          {/* Brand Column */}
          <div className="col-lg-4 col-md-6">
            <div className="footer-brand">
              <h4 className="footer-logo">SHOPNEST</h4>
              <p className="footer-description">
                Your trusted destination for quality products at unbeatable
                prices. Shop with confidence and enjoy a seamless experience.
              </p>
              <div className="social-links">
                <a href="#" className="social-link" aria-label="Facebook">
                  <i className="bi bi-facebook"></i>
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  <i className="bi bi-instagram"></i>
                </a>
                <a href="#" className="social-link" aria-label="Twitter">
                  <i className="bi bi-twitter-x"></i>
                </a>
                <a href="#" className="social-link" aria-label="YouTube">
                  <i className="bi bi-youtube"></i>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6">
            <h6 className="footer-heading">Quick Links</h6>
            <ul className="footer-links">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/products">Shop</Link>
              </li>
              <li>
                <Link href="/categories">Categories</Link>
              </li>
              <li>
                <Link href="/orders">My Orders</Link>
              </li>
              <li>
                <Link href="/profile">Profile</Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="col-lg-3 col-md-6">
            <h6 className="footer-heading">Customer Service</h6>
            <ul className="footer-links">
              <li>
                <Link href="/contact">Contact Us</Link>
              </li>
              <li>
                <Link href="/faq">FAQ</Link>
              </li>
              <li>
                <Link href="/shipping">Shipping Info</Link>
              </li>
              <li>
                <Link href="/returns">Returns & Refunds</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="col-lg-3 col-md-6">
            <h6 className="footer-heading">Get In Touch</h6>
            <div className="contact-info">
              <div className="contact-item">
                <i className="bi bi-envelope"></i>
                <span>support@shopnest.com</span>
              </div>
              <div className="contact-item">
                <i className="bi bi-telephone"></i>
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="contact-item">
                <i className="bi bi-geo-alt"></i>
                <span>
                  123 Commerce St, Suite 100
                  <br />
                  New York, NY 10001
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start">
              <small className="copyright">
                © {currentYear} SHOPNEST. All rights reserved.
              </small>
            </div>
            <div className="col-md-6 text-center text-md-end mt-3 mt-md-0">
              <div className="payment-icons">
                <i className="bi bi-credit-card-2-front"></i>
                <i className="bi bi-paypal"></i>
                <i className="bi bi-apple"></i>
                <i className="bi bi-google-play"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
