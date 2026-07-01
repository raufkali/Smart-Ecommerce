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
        hostname: "192.168.10.8",
        port: "8080",
        pathname: "/uploads/**",
      },
      // new – static images (banners etc.)
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
        hostname: "192.168.10.22",
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
