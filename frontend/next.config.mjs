/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "192.168.10.5",
        port: "8080",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8080",
        pathname: "/uploads/**",
      },
      // ✅ Add this for Unsplash images
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      // ✅ Also add for any other external image sources you might use
      {
        protocol: "https",
        hostname: "**", // Allows any HTTPS image (use cautiously, for development only)
      },
    ],
  },
};

export default nextConfig;
