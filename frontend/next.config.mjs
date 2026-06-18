/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // existing – local backend (old files)
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8080",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "192.168.10.20",
        port: "8080",
        pathname: "/uploads/**",
      },
      // new – Cloudinary
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
