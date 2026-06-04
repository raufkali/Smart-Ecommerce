/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    ...(process.env.NODE_ENV === "development"
      ? { unoptimized: true }
      : {
          remotePatterns: [
            {
              protocol: "https",
              hostname: "your-production-domain.com",
            },
          ],
        }),
  },
};

export default nextConfig;
