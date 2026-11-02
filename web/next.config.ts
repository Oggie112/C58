import type { NextConfig } from "next";
import { sanity } from "next-sanity/live/cache-life";

const nextConfig: NextConfig = {
  // Nothing is cached unless marked 'use cache'; request-time reads must sit
  // in Suspense. See docs/next-sanity-v13-migration.md.
  cacheComponents: true,
  // Off for now: unlisted dynamic paths wait for their first full render
  // (like the previous ISR model) instead of streaming into a fallback shell.
  // Becomes the default — and the option goes — in Next 17.
  partialPrefetching: false,
  cacheLife: {
    // Published edits are expired on demand (the revalidate webhook), so
    // Sanity data needn't time out on Next's 15-minute default.
    default: sanity,
  },
  // The "home" page document renders at "/". Without this, [slug] would also
  // serve it at /home — the homepage duplicated at a second URL.
  async redirects() {
    return [{ source: "/home", destination: "/", permanent: true }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io"
      }
    ]
  }
};

export default nextConfig;
