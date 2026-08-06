/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // existing – uploads
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
        hostname: process.env.NEXT_PUBLIC_BACKEND_DOMAIN,
        port: "8080",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/img/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8080",
        pathname: "/img/**",
      },
      {
        protocol: "http",
        hostname: "192.168.10.18",
        port: "8080",
        pathname: "/img/**",
      },
      // Cloudinary
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
