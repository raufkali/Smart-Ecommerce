const mongoose = require("mongoose");

const bannerSlideSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  desc: { type: String, default: "" },
  btn: { type: String, default: "Shop Now" },
  link: { type: String, default: "/products" },
  img: { type: String, required: true }, // Cloudinary URL
});

const homepageSettingsSchema = new mongoose.Schema({
  type: { type: String, default: "heroBanners", unique: true },
  banners: [bannerSlideSchema],
});

module.exports = mongoose.model("HomepageSettings", homepageSettingsSchema);
