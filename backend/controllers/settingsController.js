const asyncHandler = require("express-async-handler");
const HomepageSettings = require("../models/HomepageSettings");
const cloudinary = require("../config/cloudinary");

// Helper to extract publicId from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;
  const parts = url.split("/");
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1) return null;
  const afterUpload = parts.slice(uploadIndex + 2).join("/");
  return afterUpload.split(".").slice(0, -1).join(".");
};

// GET current settings (create default if none)
const getSettings = asyncHandler(async (req, res) => {
  let settings = await HomepageSettings.findOne({ type: "heroBanners" });
  if (!settings) {
    // Create default banners (using placeholder images – you can replace with your own later)
    settings = await HomepageSettings.create({
      type: "heroBanners",
      banners: [
        {
          title: "Summer Sale Extravaganza",
          subtitle: "Up to 50% OFF",
          desc: "Shop the hottest trends of the season with massive discounts",
          btn: "Shop Now",
          link: "/products",
          img: "/img/banner1.jpg", // relative from public/img folder
        },
        {
          title: "New Arrivals",
          subtitle: "Fresh Drops",
          desc: "Be the first to grab these exclusive new items",
          btn: "Explore New",
          link: "/products?sort=newest",
          img: "/img/banner2.jpg",
        },
        {
          title: "Tech Deals",
          subtitle: "Best Prices",
          desc: "Latest gadgets with up to 30% discount this week only",
          btn: "Shop Tech",
          link: "/products?category=electronics",
          img: "/img/banner3.jpg",
        },
      ],
    });
  }
  res.json({ success: true, data: settings });
});

// Update settings (entire banners array)
const updateSettings = asyncHandler(async (req, res) => {
  // req.body.banners is an array of { title, subtitle, desc, btn, link, img? }
  // New images come from req.files (handled by multer) – each file corresponds to the banner index.
  // We'll match by index: if a file exists for that index, update img field.

  const incomingBanners = req.body.banners || [];

  // Get existing settings to delete old Cloudinary images if replaced
  const existingSettings = await HomepageSettings.findOne({
    type: "heroBanners",
  });
  const oldBanners = existingSettings ? existingSettings.banners : [];

  const updatedBanners = [];

  for (let i = 0; i < incomingBanners.length; i++) {
    let banner = { ...incomingBanners[i] };
    // Check if a new image was uploaded for this index
    if (req.files && req.files.length > i) {
      const newFile = req.files[i];
      // Delete old Cloudinary image if it exists and is different
      if (
        oldBanners[i] &&
        oldBanners[i].img &&
        oldBanners[i].img.includes("cloudinary.com")
      ) {
        const oldPublicId = getPublicIdFromUrl(oldBanners[i].img);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId).catch(() => {});
        }
      }
      banner.img = newFile.path; // Cloudinary secure URL
    } else {
      // Keep old image if not changed
      banner.img = oldBanners[i] ? oldBanners[i].img : banner.img;
    }
    updatedBanners.push(banner);
  }

  const settings = await HomepageSettings.findOneAndUpdate(
    { type: "heroBanners" },
    { banners: updatedBanners },
    { new: true, upsert: true },
  );

  res.json({ success: true, data: settings });
});

module.exports = { getSettings, updateSettings };
