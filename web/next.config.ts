import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
