const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Review = require("../models/Review");
const User = require("../models/User");

// ─── Helper: Get Seller ID from Order Item ──────────────────────────────────

const getSellerId = (item) => {
  if (!item) return null;
  if (item.seller?._id) return item.seller._id.toString();
  if (item.seller?.toString) return item.seller.toString();
  if (item.sellerId) return item.sellerId.toString();
  if (item.seller_id) return item.seller_id.toString();
  return null;
};

// ─── Helper: Get Product ID from Order Item ────────────────────────────────

const getProductId = (item) => {
  if (!item) return null;
  if (item.product?._id) return item.product._id.toString();
  if (item.product?.toString) return item.product.toString();
  if (item.productId) return item.productId.toString();
  return null;
};

// ─── Helper: Get Product Name from Order Item ──────────────────────────────

const getProductName = (item) => {
  if (!item) return "Unknown Product";
  if (item.product?.name) return item.product.name;
  if (item.name) return item.name;
  return "Unknown Product";
};

// ─── Helper: Format Currency ──────────────────────────────────────────────

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);
};

// ─── Helper: Time Ago ──────────────────────────────────────────────────────

const timeAgo = (dateString) => {
  if (!dateString) return "just now";
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

// ─── GET: Seller Dashboard Statistics ──────────────────────────────────────

const getDashboardStats = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;

  // ─── 1. Get All Products for this Seller ──────────────────────────────

  const products = await Product.find({ sellerId }).populate("category");
  const totalProducts = products.length;
  const lowStockProducts = products.filter(
    (p) => p.stock > 0 && p.stock < 5,
  ).length;

  // ─── 2. Get All Orders containing this Seller's Products ──────────────

  // Find all orders that have at least one item from this seller
  const allOrders = await Order.find({
    "orderItems.seller": sellerId,
  })
    .populate("user", "fullname email profilePicture")
    .populate("orderItems.product", "name price images")
    .populate("orderItems.seller", "fullname email")
    .sort({ createdAt: -1 });

  // ─── 3. Get Reviews for this Seller ────────────────────────────────────

  const reviews = await Review.find({
    targetType: "User",
    targetId: sellerId,
  }).populate("reviewerId", "fullname profilePicture");

  // ─── 4. Calculate Statistics ───────────────────────────────────────────

  const todayMidnight = new Date().setHours(0, 0, 0, 0);
  let totalRevenue = 0;
  let todayRevenue = 0;
  let pendingOrdersCount = 0;
  let totalOrdersCount = allOrders.length;

  // Track product sales for top products
  const productSalesMap = {};

  // Weekly sales data
  const weekSales = [0, 0, 0, 0, 0, 0, 0];

  // Activities for recent activity feed
  const activities = [];

  // Process each order
  allOrders.forEach((order) => {
    // Filter only items belonging to this seller
    const sellerItems = order.orderItems.filter(
      (item) => getSellerId(item) === sellerId,
    );

    if (sellerItems.length === 0) return;

    // Track pending orders
    const hasPending = sellerItems.some(
      (item) => item.orderStatus === "pending",
    );
    if (hasPending) pendingOrdersCount++;

    // Process each seller item
    sellerItems.forEach((item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 0;
      const itemRevenue = price * quantity;
      totalRevenue += itemRevenue;

      // Today's revenue
      if (new Date(order.createdAt).setHours(0, 0, 0, 0) === todayMidnight) {
        todayRevenue += itemRevenue;
      }

      // Weekly sales
      const dayIdx = new Date(order.createdAt).getDay();
      weekSales[dayIdx] += itemRevenue;

      // Track product sales
      const productId = getProductId(item);
      if (productId) {
        if (!productSalesMap[productId]) {
          productSalesMap[productId] = {
            sales: 0,
            revenue: 0,
            name: getProductName(item),
            product: item.product,
          };
        }
        productSalesMap[productId].sales += quantity;
        productSalesMap[productId].revenue += itemRevenue;
      }
    });

    // Add activity for this order
    const orderStatus = sellerItems[0]?.orderStatus || "pending";
    activities.push({
      type: "order",
      description: `Order #${order._id.toString().slice(-6).toUpperCase()} - ${orderStatus}`,
      time: timeAgo(order.createdAt),
      status:
        orderStatus === "delivered"
          ? "success"
          : orderStatus === "cancelled"
            ? "danger"
            : "pending",
      orderId: order._id,
      customer: order.user?.fullname || "Customer",
      total: sellerItems.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
        0,
      ),
    });
  });

  // ─── 5. Build Top Products ─────────────────────────────────────────────

  const topProducts = Object.entries(productSalesMap)
    .map(([id, data]) => {
      // Find current stock from products list
      const product = products.find((p) => p._id.toString() === id);
      return {
        _id: id,
        name: data.name || "Unknown Product",
        sales: data.sales || 0,
        revenue: data.revenue || 0,
        stock: product?.stock || 0,
        price: product?.finalPrice || product?.price || 0,
        image: product?.images?.[0] || null,
      };
    })
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // ─── 6. Build Recent Orders ────────────────────────────────────────────

  const recentOrders = allOrders.slice(0, 5).map((order) => {
    const sellerItems = order.orderItems.filter(
      (item) => getSellerId(item) === sellerId,
    );

    const orderTotal = sellerItems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0,
    );

    const orderStatus = sellerItems[0]?.orderStatus || "pending";
    const totalItems = sellerItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0,
    );

    return {
      id: order._id,
      orderNumber: order._id.toString().slice(-8).toUpperCase(),
      customer: order.user?.fullname || "Customer",
      items: totalItems,
      total: orderTotal,
      status: orderStatus,
      date: new Date(order.createdAt).toLocaleDateString(),
      createdAt: order.createdAt,
    };
  });

  // ─── 7. Build Recent Reviews ───────────────────────────────────────────

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

  const recentReviews = reviews.slice(0, 5).map((review) => ({
    id: review._id,
    customer: review.reviewerId?.fullname || "Customer",
    rating: review.rating || 0,
    comment: review.comment || "No comment provided",
    date: new Date(review.createdAt).toLocaleDateString(),
    createdAt: review.createdAt,
  }));

  // Add review activities
  const reviewActivities = reviews.slice(0, 5).map((review) => ({
    type: "review",
    description: `${review.reviewerId?.fullname || "Someone"} left a ${review.rating}★ review`,
    time: timeAgo(review.createdAt),
    status:
      review.rating >= 4
        ? "success"
        : review.rating >= 3
          ? "pending"
          : "danger",
    reviewId: review._id,
  }));

  // ─── 8. Combine Activities ─────────────────────────────────────────────

  const allActivities = [...reviewActivities, ...activities].slice(0, 8);

  // ─── 9. Prepare Weekly Sales Data ─────────────────────────────────────

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklySales = DAY_LABELS.map((label, index) => ({
    label,
    value: weekSales[index] || 0,
  }));

  // ─── 10. Send Response ─────────────────────────────────────────────────

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalProducts,
        totalOrders: totalOrdersCount,
        pendingOrders: pendingOrdersCount,
        totalRevenue,
        todayRevenue,
        averageRating: avgRating,
        totalReviews: reviews.length,
        lowStockProducts,
      },
      recentOrders,
      topProducts,
      recentReviews,
      recentActivities: allActivities,
      weeklySales,
    },
  });
});

// ─── GET: Seller Order Details ─────────────────────────────────────────────

const getSellerOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const sellerId = req.user.id;

  const order = await Order.findById(orderId)
    .populate("user", "fullname email phone profilePicture")
    .populate("orderItems.product", "name price images stock")
    .populate("orderItems.seller", "fullname email");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Check if this order has items from this seller
  const hasSellerItems = order.orderItems.some(
    (item) => getSellerId(item) === sellerId,
  );

  if (!hasSellerItems) {
    res.status(403);
    throw new Error("You are not authorized to view this order");
  }

  // Filter only seller's items
  const sellerItems = order.orderItems.filter(
    (item) => getSellerId(item) === sellerId,
  );

  // Calculate seller's total
  const sellerTotal = sellerItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0,
  );

  res.status(200).json({
    success: true,
    order: {
      ...order.toObject(),
      sellerItems,
      sellerTotal,
      // Keep original order items for reference
      allItems: order.orderItems,
    },
  });
});

// ─── GET: Seller Weekly Sales Chart Data ──────────────────────────────────

const getWeeklySales = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get orders from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const orders = await Order.find({
    "orderItems.seller": sellerId,
    createdAt: { $gte: sevenDaysAgo },
  });

  const weekSales = [0, 0, 0, 0, 0, 0, 0];

  orders.forEach((order) => {
    const sellerItems = order.orderItems.filter(
      (item) => getSellerId(item) === sellerId,
    );

    sellerItems.forEach((item) => {
      const itemRevenue = (item.price || 0) * (item.quantity || 0);
      const dayIdx = new Date(order.createdAt).getDay();
      weekSales[dayIdx] += itemRevenue;
    });
  });

  const weeklySales = DAY_LABELS.map((label, index) => ({
    label,
    value: weekSales[index] || 0,
  }));

  res.status(200).json({
    success: true,
    data: weeklySales,
  });
});

// ─── GET: Seller Recent Activities ─────────────────────────────────────────

const getRecentActivities = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const limit = parseInt(req.query.limit) || 10;

  // Get recent orders
  const orders = await Order.find({
    "orderItems.seller": sellerId,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("user", "fullname");

  // Get recent reviews
  const reviews = await Review.find({
    targetType: "User",
    targetId: sellerId,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("reviewerId", "fullname");

  const activities = [];

  // Add order activities
  orders.forEach((order) => {
    const sellerItems = order.orderItems.filter(
      (item) => getSellerId(item) === sellerId,
    );
    if (sellerItems.length === 0) return;

    const orderStatus = sellerItems[0]?.orderStatus || "pending";
    activities.push({
      type: "order",
      description: `Order #${order._id.toString().slice(-6).toUpperCase()} - ${orderStatus}`,
      time: timeAgo(order.createdAt),
      status:
        orderStatus === "delivered"
          ? "success"
          : orderStatus === "cancelled"
            ? "danger"
            : "pending",
      orderId: order._id,
      customer: order.user?.fullname || "Customer",
      createdAt: order.createdAt,
    });
  });

  // Add review activities
  reviews.forEach((review) => {
    activities.push({
      type: "review",
      description: `${review.reviewerId?.fullname || "Someone"} left a ${review.rating}★ review`,
      time: timeAgo(review.createdAt),
      status:
        review.rating >= 4
          ? "success"
          : review.rating >= 3
            ? "pending"
            : "danger",
      reviewId: review._id,
      createdAt: review.createdAt,
    });
  });

  // Sort by createdAt and slice
  activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const recentActivities = activities.slice(0, limit);

  res.status(200).json({
    success: true,
    data: recentActivities,
  });
});

// ─── GET: Seller Top Products ─────────────────────────────────────────────

const getTopProducts = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const limit = parseInt(req.query.limit) || 5;

  // Get all orders with seller's items
  const orders = await Order.find({
    "orderItems.seller": sellerId,
  });

  const productSalesMap = {};

  orders.forEach((order) => {
    const sellerItems = order.orderItems.filter(
      (item) => getSellerId(item) === sellerId,
    );

    sellerItems.forEach((item) => {
      const productId = getProductId(item);
      if (productId) {
        if (!productSalesMap[productId]) {
          productSalesMap[productId] = {
            sales: 0,
            revenue: 0,
            name: getProductName(item),
          };
        }
        productSalesMap[productId].sales += item.quantity || 0;
        productSalesMap[productId].revenue +=
          (item.price || 0) * (item.quantity || 0);
      }
    });
  });

  // Get product details
  const productIds = Object.keys(productSalesMap);
  const products = await Product.find({
    _id: { $in: productIds },
    sellerId,
  }).select("name price finalPrice stock images");

  const topProducts = productIds
    .map((id) => {
      const product = products.find((p) => p._id.toString() === id);
      const salesData = productSalesMap[id];
      return {
        _id: id,
        name: salesData.name || product?.name || "Unknown Product",
        sales: salesData.sales || 0,
        revenue: salesData.revenue || 0,
        stock: product?.stock || 0,
        price: product?.finalPrice || product?.price || 0,
        image: product?.images?.[0] || null,
      };
    })
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit);

  res.status(200).json({
    success: true,
    data: topProducts,
  });
});

// ─── Export All ────────────────────────────────────────────────────────────

module.exports = {
  getDashboardStats,
  getSellerOrderDetails,
  getWeeklySales,
  getRecentActivities,
  getTopProducts,
};
