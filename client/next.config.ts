import type { NextConfig } from "next";

/*
 * `next dev` only allows `localhost`, its subdomains and the hostname it booted
 * with. Reaching the app through another spelling of loopback can block dev assets
 * and HMR requests. Custom LAN hostnames can be added through NEXT_PUBLIC_DEV_ORIGINS.
 */
const devOrigins = [
  "127.0.0.1",
  ...(process.env.NEXT_PUBLIC_DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
