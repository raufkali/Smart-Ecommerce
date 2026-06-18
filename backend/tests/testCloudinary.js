// Run this from your backend root: node testCloudinary.js
require("dotenv").config();
const cloudinary = require("cloudinary").v2;

console.log("=== Cloudinary Diagnostic ===");
console.log("CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME || "❌ MISSING");
console.log("API_KEY:", process.env.CLOUDINARY_API_KEY || "❌ MISSING");
console.log(
  "API_SECRET:",
  process.env.CLOUDINARY_API_SECRET ? "✅ SET" : "❌ MISSING",
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function test() {
  try {
    console.log("\n--- Testing Cloudinary API connection ---");
    const result = await cloudinary.api.ping();
    console.log("✅ Cloudinary connected:", result);
  } catch (err) {
    console.error("❌ Cloudinary ping failed:", err.message);
    console.error("   Error code:", err.http_code);
  }

  try {
    console.log("\n--- Testing upload with a sample image URL ---");
    const upload = await cloudinary.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      { folder: "ecommerce/test" },
    );
    console.log("✅ Upload success!");
    console.log("   URL:", upload.secure_url);
    console.log("   Public ID:", upload.public_id);

    // Clean up test image
    await cloudinary.uploader.destroy(upload.public_id);
    console.log("✅ Cleanup success — test image deleted");
  } catch (err) {
    console.error("❌ Upload failed:", err.message);
    console.error("   Full error:", JSON.stringify(err, null, 2));
  }
}

test();
