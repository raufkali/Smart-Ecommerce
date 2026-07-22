"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import "./cart.css";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
);

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-notification ${type}`} role="alert">
      <div className="toast-content">
        <i
          className={`bi ${
            type === "success"
              ? "bi-check-circle-fill"
              : type === "error"
                ? "bi-exclamation-circle-fill"
                : type === "warning"
                  ? "bi-exclamation-triangle-fill"
                  : "bi-info-circle-fill"
          }`}
        ></i>
        <span>{message}</span>
        <button className="toast-close-btn" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

// Stripe Payment Form Component
const PaymentForm = ({ total, orderId, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [cardComplete, setCardComplete] = useState(false);

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setPaymentError("");

    if (!stripe || !elements) {
      setProcessing(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/payment/create-payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderId }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create payment");
      }

      const { clientSecret } = data;

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: "Customer",
            },
          },
        });

      if (stripeError) {
        setPaymentError(stripeError.message);
        setProcessing(false);
      } else if (paymentIntent.status === "requires_capture") {
        onSuccess(paymentIntent);
      } else {
        setPaymentError(`Payment status: ${paymentIntent.status}`);
        setProcessing(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentError(error.message || "Payment failed");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePayment}>
      <div className="form-group-custom">
        <label className="form-label-custom">
          <i className="bi bi-credit-card me-2"></i>Card Details
        </label>
        <div className="stripe-card-wrapper">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#1a1712",
                  "::placeholder": { color: "#9a9080" },
                  padding: "10px",
                },
                invalid: { color: "#dc3545" },
              },
              hidePostalCode: true,
            }}
            onChange={(e) => setCardComplete(e.complete)}
          />
        </div>
        <div className="test-card-hint">
          <i className="bi bi-info-circle"></i>
          Test: 4242 4242 4242 4242 | Any future date | Any 3 digits
        </div>
      </div>

      {paymentError && (
        <div className="payment-error">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {paymentError}
        </div>
      )}

      <div className="modal-footer-custom" style={{ padding: "1rem 0 0" }}>
        <button
          type="button"
          className="btn-cancel"
          onClick={onCancel}
          disabled={processing}
        >
          <i className="bi bi-x-lg me-2"></i>Cancel
        </button>
        <button
          type="submit"
          className="btn-submit"
          disabled={!stripe || processing || !cardComplete}
        >
          {processing ? (
            <>
              <div className="spinner-custom me-2"></div>
              Processing...
            </>
          ) : (
            <>
              <i className="bi bi-lock-fill me-2"></i>Pay ${total.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// Main CartPage Component
const CartPage = () => {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItems, setUpdatingItems] = useState({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("stripe");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Fetch cart data
  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/cart/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          setCart({ items: [] });
          return;
        }
        throw new Error("Failed to fetch cart");
      }

      const data = await response.json();
      setCart(data.userCart || data.cart || data);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setError("Failed to load cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setUpdatingItems((prev) => ({ ...prev, [productId]: true }));
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/cart/update/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity: newQuantity }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update quantity");
      }

      await fetchCart();
      showToast("Cart updated successfully", "success");
    } catch (error) {
      console.error("Error updating quantity:", error);
      showToast(error.message || "Failed to update item quantity", "error");
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Remove item from cart
  const removeItem = async (productId) => {
    try {
      setUpdatingItems((prev) => ({ ...prev, [productId]: true }));
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/cart/remove/${productId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      await fetchCart();
      showToast("Item removed from cart", "success");
    } catch (error) {
      console.error("Error removing item:", error);
      showToast("Failed to remove item from cart", "error");
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Empty cart
  const emptyCart = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/cart/removeAll`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to empty cart");
      }

      await fetchCart();
      showToast("Cart emptied successfully", "success");
    } catch (error) {
      console.error("Error emptying cart:", error);
      showToast("Failed to empty cart", "error");
    }
  };

  // Create Order
  const createOrder = async () => {
    try {
      setCheckoutLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            shippingAddress,
            paymentMethod,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
      }

      const data = await response.json();
      setCreatedOrder(data.order);
      setShowCheckoutModal(false);
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Error creating order:", error);
      showToast(error.message || "Failed to create order", "error");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (paymentIntent) => {
    showToast(
      "Payment successful! Funds are held in escrow until you confirm delivery.",
      "success",
    );

    await fetchCart();
    setShowPaymentModal(false);
    setCreatedOrder(null);
    router.push("/orders");
  };

  // Calculate totals
  const calculateSubtotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0,
    );
  };

  const subtotal = calculateSubtotal();
  const shipping = subtotal > 0 ? 200 : 0;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading) {
    return (
      <div className="container-fluid main py-5 text-center">
        <div
          className="spinner-custom mx-auto mb-3"
          style={{ width: "40px", height: "40px", borderWidth: "3px" }}
        ></div>
        <h5 style={{ color: "#9a9080", fontWeight: 300 }}>
          Loading your cart...
        </h5>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="payment-error">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {error}
        </div>
      </div>
    );
  }

  const hasItems = cart?.items && cart.items.length > 0;

  return (
    <div className="container py-5">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="cart-header">
        <div className="cart-title-section">
          <h1>
            <i className="bi bi-cart3 me-3" style={{ color: "#b8912a" }}></i>
            Shopping Cart
          </h1>
          <p>
            {hasItems
              ? `You have ${cart.items.length} item${cart.items.length > 1 ? "s" : ""} in your cart`
              : "Your cart is empty"}
          </p>
        </div>
        {hasItems && (
          <button className="empty-cart-btn" onClick={emptyCart}>
            <i className="bi bi-trash3 me-2"></i>Empty Cart
          </button>
        )}
      </div>

      {!hasItems ? (
        <div className="empty-cart-state">
          <div className="empty-cart-icon">
            <i className="bi bi-cart-x"></i>
          </div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven&apos;t added any items to your cart yet.</p>
          <Link
            href="/"
            className="btn-submit"
            style={{ display: "inline-flex", textDecoration: "none" }}
          >
            <i className="bi bi-shop me-2"></i>Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="row">
          {/* Cart Items */}
          <div className="col-lg-8">
            <div className="cart-items-card">
              <div className="cart-items-header">
                <h5>
                  <i
                    className="bi bi-bag-check me-2"
                    style={{ color: "#b8912a" }}
                  ></i>
                  Cart Items ({cart.items.length})
                </h5>
              </div>

              {cart.items.map((item) => {
                const product = item.product || {};
                const productId = product._id || item.product;
                const isUpdating = updatingItems[productId];
                const price = item.price || 0;
                const totalPrice = price * item.quantity;

                let imageUrl = null;
                if (product.images && product.images.length > 0) {
                  const imagePath = product.images[0];
                  if (imagePath.startsWith("http")) {
                    imageUrl = imagePath;
                  } else {
                    imageUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}${imagePath}`;
                  }
                }

                return (
                  <div key={productId} className="cart-item-row">
                    {/* Product Image */}
                    <div className="cart-item-image">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product.name || "Product"}
                          fill
                          style={{ objectFit: "cover" }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="cart-item-placeholder">
                          <i className="bi bi-image"></i>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="cart-item-details">
                      <Link
                        href={`/products/${product._id}`}
                        className="text-decoration-none"
                      >
                        <h6>{product.name || "Product"}</h6>
                      </Link>
                      <p className="seller-info">
                        <i className="bi bi-shop me-1"></i>
                        Seller:{" "}
                        {item.seller?.fullname || item.seller?.name || "Store"}
                      </p>
                      {product.stock && (
                        <p className="stock-info">
                          <i className="bi bi-box-seam me-1"></i>
                          Stock: {product.stock}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="cart-item-price">${price.toFixed(2)}</div>

                    {/* Quantity Controls */}
                    <div className="quantity-control">
                      <button
                        className="quantity-btn"
                        type="button"
                        onClick={() =>
                          updateQuantity(productId, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1 || isUpdating}
                      >
                        <i className="bi bi-dash"></i>
                      </button>
                      <input
                        type="number"
                        className="quantity-input"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            updateQuantity(productId, val);
                          }
                        }}
                        disabled={isUpdating}
                        min="1"
                      />
                      <button
                        className="quantity-btn"
                        type="button"
                        onClick={() =>
                          updateQuantity(productId, item.quantity + 1)
                        }
                        disabled={
                          (product.stock && item.quantity >= product.stock) ||
                          isUpdating
                        }
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="cart-item-total">
                      ${totalPrice.toFixed(2)}
                    </div>

                    {/* Remove Button */}
                    <button
                      className="remove-item-btn"
                      onClick={() => removeItem(productId)}
                      disabled={isUpdating}
                      title="Remove item"
                    >
                      <i className="bi bi-trash3"></i>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-lg-4">
            <div className="order-summary-card">
              <h5>
                <i
                  className="bi bi-receipt me-2"
                  style={{ color: "#b8912a" }}
                ></i>
                Order Summary
              </h5>

              <div className="summary-row">
                <span className="label">Subtotal:</span>
                <span className="value">${subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="label">Shipping:</span>
                <span className="value">${shipping.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="label">Tax (5%):</span>
                <span className="value">${tax.toFixed(2)}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span className="label">Total:</span>
                <span className="value">${total.toFixed(2)}</span>
              </div>

              <button
                className="checkout-btn"
                onClick={() => setShowCheckoutModal(true)}
              >
                <i className="bi bi-credit-card"></i>
                <span>Proceed to Checkout</span>
              </button>

              <Link href="/" className="continue-shopping-btn">
                <i className="bi bi-arrow-left me-2"></i>
                Continue Shopping
              </Link>

              <div className="escrow-info">
                <i className="bi bi-shield-lock"></i>
                <small>
                  Your payment will be held securely until you confirm delivery.
                  Funds are only released to the seller after your approval.
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal (Shipping Address) */}
      {showCheckoutModal && (
        <div
          className="modal-backdrop-custom"
          onClick={() => setShowCheckoutModal(false)}
        >
          <div
            className="modal-dialog-custom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h5>
                <i
                  className="bi bi-geo-alt-fill me-2"
                  style={{ color: "#b8912a" }}
                ></i>
                Shipping Information
              </h5>
              <button
                className="modal-close-btn"
                onClick={() => setShowCheckoutModal(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createOrder();
              }}
            >
              <div className="modal-body-custom">
                <div className="form-group-custom">
                  <label className="form-label-custom">Full Name</label>
                  <div className="input-group-custom">
                    <span className="input-icon">
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      type="text"
                      required
                      value={shippingAddress.fullName}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          fullName: e.target.value,
                        })
                      }
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div className="form-group-custom">
                  <label className="form-label-custom">Address</label>
                  <div className="input-group-custom">
                    <span className="input-icon">
                      <i className="bi bi-house-door"></i>
                    </span>
                    <input
                      type="text"
                      required
                      value={shippingAddress.address}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          address: e.target.value,
                        })
                      }
                      placeholder="Enter your address"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group-custom">
                    <label className="form-label-custom">City</label>
                    <div className="input-group-custom">
                      <span className="input-icon">
                        <i className="bi bi-building"></i>
                      </span>
                      <input
                        type="text"
                        required
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            city: e.target.value,
                          })
                        }
                        placeholder="City"
                      />
                    </div>
                  </div>

                  <div className="form-group-custom">
                    <label className="form-label-custom">Postal Code</label>
                    <div className="input-group-custom">
                      <span className="input-icon">
                        <i className="bi bi-mailbox"></i>
                      </span>
                      <input
                        type="text"
                        required
                        value={shippingAddress.postalCode}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            postalCode: e.target.value,
                          })
                        }
                        placeholder="Postal code"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group-custom">
                    <label className="form-label-custom">Country</label>
                    <div className="input-group-custom">
                      <span className="input-icon">
                        <i className="bi bi-globe2"></i>
                      </span>
                      <input
                        type="text"
                        required
                        value={shippingAddress.country}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            country: e.target.value,
                          })
                        }
                        placeholder="Country"
                      />
                    </div>
                  </div>

                  <div className="form-group-custom">
                    <label className="form-label-custom">Phone</label>
                    <div className="input-group-custom">
                      <span className="input-icon">
                        <i className="bi bi-telephone"></i>
                      </span>
                      <input
                        type="tel"
                        required
                        value={shippingAddress.phone}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            phone: e.target.value,
                          })
                        }
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                </div>

                <div className="payment-order-info">
                  <p>
                    <i
                      className="bi bi-calculator-fill me-2"
                      style={{ color: "#b8912a" }}
                    ></i>
                    <strong>Total Amount:</strong> ${total.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCheckoutModal(false)}
                >
                  <i className="bi bi-x-lg me-2"></i>Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? (
                    <>
                      <div className="spinner-custom me-2"></div>
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-right-circle me-2"></i>
                      Continue to Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && createdOrder && (
        <div
          className="modal-backdrop-custom"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="modal-dialog-custom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <h5>
                <i
                  className="bi bi-credit-card-2-front me-2"
                  style={{ color: "#b8912a" }}
                ></i>
                Complete Payment
              </h5>
              <button
                className="modal-close-btn"
                onClick={() => setShowPaymentModal(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body-custom">
              <div className="payment-order-info">
                <p>
                  <i
                    className="bi bi-receipt me-2"
                    style={{ color: "#b8912a" }}
                  ></i>
                  <strong>Order #:</strong>{" "}
                  {createdOrder._id.slice(-8).toUpperCase()}
                </p>
                <p>
                  <i
                    className="bi bi-cash-stack me-2"
                    style={{ color: "#b8912a" }}
                  ></i>
                  <strong>Amount:</strong> ${total.toFixed(2)}
                </p>
                <div
                  className="summary-divider"
                  style={{ margin: "0.75rem 0" }}
                ></div>
                <p style={{ color: "#b8912a", fontSize: "0.8rem" }}>
                  <i className="bi bi-shield-lock me-2"></i>
                  Your payment will be held in escrow until you confirm
                  delivery.
                </p>
              </div>

              <Elements stripe={stripePromise}>
                <PaymentForm
                  total={total}
                  orderId={createdOrder._id}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setShowPaymentModal(false)}
                />
              </Elements>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
