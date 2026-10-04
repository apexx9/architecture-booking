import type { NextConfig } from "next";

/*
 * `next dev` only allows `localhost`, its subdomains and the hostname it booted
 * with. Reaching the app through any other spelling of the loopback address
 * leaves the dev asset and HMR requests blocked, which stalls the client
 * bundle: the page paints its loading state and the auth bootstrap never runs,
 * so the app looks like a dead backend with nothing in either console.
 *
 * Only hostnames are matched, without scheme or port. A LAN address is not
 * listed here because it changes with the network; set NEXT_PUBLIC_DEV_ORIGINS
 * to a comma-separated list of hostnames to allow it, for example when testing
 * on a phone. This option has no effect outside development.
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
};

export default nextConfig;
