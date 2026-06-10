// controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Wallet = require("../models/Wallet");
const Cart = require("../models/Cart");
const Orders = require("../models/Order");
const Product = require("../models/Product");
const { sendNotification } = require("../services/notificationService");

// GET ALL USERS WITH DETAILED STATS (Keep ONLY this version)
const getAllUsers = asyncHandler(async (req, res) => {
  const allUsers = await User.find().select("-password");

  // Get additional stats for each user
  const usersWithStats = await Promise.all(
    allUsers.map(async (user) => {
      // Get order stats using CORRECT field names from your schema
      const orders = await Orders.find({ user: user._id });
      const completedOrders = orders.filter(
        (o) => o.orderStatus === "delivered",
      );
      const pendingOrders = orders.filter((o) =>
        ["pending", "processing", "confirmed"].includes(o.orderStatus),
      );

      const totalSpending = completedOrders.reduce(
        (sum, o) => sum + (o.totalPrice || 0),
        0,
      );

      // Get wallet/escrow info
      const wallet = await Wallet.findOne({ user: user._id });

      // If seller, get seller-specific stats
      let sellerStats = null;
      if (user.role === "seller") {
        const sellerProducts = await Product.find({ seller: user._id });

        // Get orders containing this seller's items using CORRECT field names
        const allOrders = await Orders.find({});
        const sellerOrders = allOrders.filter((order) =>
          order.orderItems?.some(
            (item) => item.seller?.toString() === user._id.toString(),
          ),
        );
        const deliveredSellerOrders = sellerOrders.filter(
          (o) => o.orderStatus === "delivered",
        );

        sellerStats = {
          totalProducts: sellerProducts.length,
          totalSales: deliveredSellerOrders.reduce(
            (sum, o) => sum + (o.totalPrice || 0),
            0,
          ),
          totalOrdersReceived: sellerOrders.length,
          productsSold: sellerOrders.reduce(
            (sum, o) => sum + (o.orderItems?.length || 0),
            0,
          ),
          activeProducts: sellerProducts.filter((p) => !p.isDeleted).length,
          pendingAmount: sellerOrders
            .filter((o) =>
              ["pending", "confirmed", "processing", "shipped"].includes(
                o.orderStatus,
              ),
            )
            .reduce((sum, o) => sum + (o.totalPrice || 0), 0),
        };
      }

      return {
        ...user.toObject(),
        password: undefined,
        stats: {
          totalOrders: orders.length,
          completedOrders: completedOrders.length,
          pendingOrders: pendingOrders.length,
          cancelledOrders: orders.filter((o) => o.orderStatus === "cancelled")
            .length,
          totalSpending,
          averageOrderValue:
            orders.length > 0 ? totalSpending / orders.length : 0,
          walletBalance: wallet?.balance || 0,
          escrowAmount: wallet?.escrowBalance || 0,
          lastOrderDate:
            orders.length > 0
              ? orders.sort(
                  (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
                )[0].createdAt
              : null,
        },
        sellerStats,
      };
    }),
  );

  res.status(200).json({
    message: "Success! Users fetched",
    users: usersWithStats,
    total: usersWithStats.length,
  });
});

// GET SINGLE USER WITH FULL ANALYTICS
const getUserAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Get all orders for this user
  const orders = await Orders.find({ user: user._id }).sort({ createdAt: -1 });

  // Order analytics - using CORRECT field names
  const orderStats = {
    total: orders.length,
    byStatus: {
      pending: orders.filter((o) => o.orderStatus === "pending").length,
      processing: orders.filter((o) => o.orderStatus === "processing").length,
      confirmed: orders.filter((o) => o.orderStatus === "confirmed").length,
      shipped: orders.filter((o) => o.orderStatus === "shipped").length,
      delivered: orders.filter((o) => o.orderStatus === "delivered").length,
      cancelled: orders.filter((o) => o.orderStatus === "cancelled").length,
    },
    totalAmount: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
    completedAmount: orders
      .filter((o) => o.orderStatus === "delivered")
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0),
    recentOrders: orders.slice(0, 10).map((o) => ({
      id: o._id,
      totalAmount: o.totalPrice,
      status: o.orderStatus,
      createdAt: o.createdAt,
      itemsCount: o.orderItems?.length || 0,
    })),
  };

  // Monthly spending breakdown
  const monthlySpending = {};
  orders.forEach((order) => {
    if (order.orderStatus === "delivered") {
      const month = new Date(order.createdAt).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      monthlySpending[month] = (monthlySpending[month] || 0) + order.totalPrice;
    }
  });

  // Wallet info
  const wallet = await Wallet.findOne({ user: user._id });

  // If seller, get detailed seller analytics
  let sellerAnalytics = null;
  if (user.role === "seller") {
    const products = await Product.find({ seller: user._id });

    // Get all orders that contain items from this seller
    const allOrders = await Orders.find({}).sort({ createdAt: -1 });
    const sellerOrders = allOrders.filter((order) =>
      order.orderItems?.some(
        (item) => item.seller?.toString() === user._id.toString(),
      ),
    );

    const deliveredOrders = sellerOrders.filter(
      (o) => o.orderStatus === "delivered",
    );
    const pendingOrders = sellerOrders.filter((o) =>
      ["pending", "confirmed", "processing", "shipped"].includes(o.orderStatus),
    );

    sellerAnalytics = {
      products: {
        total: products.length,
        active: products.filter((p) => !p.isDeleted).length,
        inactive: products.filter((p) => p.isDeleted).length,
        list: products.slice(0, 5).map((p) => ({
          id: p._id,
          name: p.name,
          price: p.price,
          stock: p.stock,
          isDeleted: p.isDeleted,
        })),
      },
      orders: {
        total: sellerOrders.length,
        pending: sellerOrders.filter((o) => o.orderStatus === "pending").length,
        processing: sellerOrders.filter((o) => o.orderStatus === "processing")
          .length,
        confirmed: sellerOrders.filter((o) => o.orderStatus === "confirmed")
          .length,
        shipped: sellerOrders.filter((o) => o.orderStatus === "shipped").length,
        delivered: deliveredOrders.length,
        cancelled: sellerOrders.filter((o) => o.orderStatus === "cancelled")
          .length,
        totalRevenue: deliveredOrders.reduce((sum, o) => sum + o.totalPrice, 0),
        pendingRevenue: pendingOrders.reduce((sum, o) => sum + o.totalPrice, 0),
        recentOrders: sellerOrders.slice(0, 10).map((o) => ({
          id: o._id,
          totalAmount: o.totalPrice,
          status: o.orderStatus,
          createdAt: o.createdAt,
          customerName: o.shippingAddress?.fullName || "N/A",
        })),
      },
    };
  }

  res.status(200).json({
    success: true,
    user: {
      ...user.toObject(),
      password: undefined,
    },
    analytics: {
      orders: orderStats,
      monthlySpending,
      wallet: {
        balance: wallet?.balance || 0,
        escrowBalance: wallet?.escrowBalance || 0,
        totalWithdrawn: wallet?.totalWithdrawn || 0,
        totalDeposited: wallet?.totalDeposited || 0,
      },
      sellerAnalytics,
    },
  });
});

// CREATE USER
const createUser = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const data = req.body;

  let allowedRoles = ["user", "seller"];
  if (req.user?.role === "admin") allowedRoles.push("admin");

  if (!allowedRoles.includes(data.role)) {
    res.status(403);
    throw new Error("Access Denied: Invalid Role");
  }

  if (!data.email || !data.password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    res.status(409);
    throw new Error("User already exists");
  }

  const hashedPass = await bcrypt.hash(data.password, 10);
  data.password = hashedPass;

  const user = await User.create(data);

  await Wallet.create({ user: user._id, role: data.role });

  await sendNotification(io, {
    userId: user._id,
    title: "Welcome!",
    message: `Welcome ${user.fullname}! Your account has been created successfully.`,
    type: "success",
  });

  if (data.role !== "admin") {
    io.to("admin-room").emit("notification", {
      title: "New User",
      message: `New user registered: ${user.email}`,
      type: "info",
    });
  }

  if (req.user?.role === "admin") {
    return res.status(201).json({
      status: "success",
      message: "User created successfully",
      user: { id: user._id, email: user.email, role: user.role },
    });
  }

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.status(201).json({
    status: "success",
    message: "User created successfully",
    token,
    user: { id: user._id, email: user.email, role: user.role },
  });
});

// LOGIN USER
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const io = req.app.get("io");

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if user is deleted
  if (user.isDeleted) {
    res.status(401);
    throw new Error("Account has been deactivated. Please contact support.");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  await sendNotification(io, {
    userId: user._id,
    title: "Login Alert",
    message:
      "Your account was just accessed. If this wasn't you, please secure your account immediately.",
    type: "warning",
  });

  res.status(200).json({
    message: "User logged in successfully",
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      fullname: user.fullname,
    },
  });
});

// DELETE USER (Hard delete)
const deleteUser = asyncHandler(async (req, res) => {
  const io = req.app.get("io");

  if (!req.params.id || !req.user?.id) {
    res.status(400);
    throw new Error("Invalid Token or Invalid ID");
  }

  const userId = req.params.id;

  const wallet = await Wallet.findOne({ user: userId });
  if (wallet) await Wallet.findByIdAndDelete(wallet._id);

  const cart = await Cart.findOne({ user: userId });
  if (cart) await Cart.findByIdAndDelete(cart._id);

  const user = await User.findByIdAndDelete(userId);

  io.to("admin-room").emit("notification", {
    title: "User Deleted",
    message: `User deleted: ${user.email}`,
    type: "danger",
  });

  res.status(200).json({ success: true, user });
});

// UPDATE USER
const updateUser = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const id = req.params.id;

  if (!id) {
    res.status(400);
    throw new Error("Invalid ID");
  }

  const { fullname, email, role, isDeleted, phone, address } = req.body;

  const updateData = {};
  if (fullname !== undefined) updateData.fullname = fullname;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (isDeleted !== undefined) updateData.isDeleted = isDeleted;
  if (phone !== undefined) updateData.phone = phone;
  if (address !== undefined) updateData.address = address;

  const updatedUser = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!updatedUser) {
    res.status(404);
    throw new Error("User not found");
  }

  // Send notification
  if (isDeleted !== undefined) {
    await sendNotification(io, {
      userId: updatedUser._id,
      title: "Account Status Updated",
      message: `Your account has been ${isDeleted ? "deactivated" : "activated"}. ${isDeleted ? "Please contact support for reactivation." : "You can now access all features."}`,
      type: "warning",
    });
  }

  res.status(200).json({ success: true, data: updatedUser });
});

module.exports = {
  createUser,
  loginUser,
  getAllUsers,
  deleteUser,
  updateUser,
  getUserAnalytics,
};
