/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // basePath and assetPrefix are set by Webflow Cloud from the /agents mount; don't set them here.
  async headers() {
    const week = "public, max-age=604800, stale-while-revalidate=2592000";
    return [
      // Pages and text files: browsers and crawlers can reuse them for a few minutes, the edge for an hour
      { source: "/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" }] },
      { source: "/_next/static/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/guides/:path*", headers: [{ key: "Cache-Control", value: week }] },
      { source: "/logos/:path*", headers: [{ key: "Cache-Control", value: week }] },
      { source: "/:file(verisoul-logo.webp|verisoul-logo.png|favicon.ico|icon.png|apple-icon.png)", headers: [{ key: "Cache-Control", value: week }] },
    ];
  },
  async redirects() {
    // The Atlas moved from agents.verisoul.ai to www.verisoul.ai/agents. The old host
    // (still served from Vercel) sends every path to its new address with a 301.
    const oldHost = [{ type: "host", value: "agents.verisoul.ai" }];
    const to = "https://www.verisoul.ai/agents";
    return [
      { source: "/", has: oldHost, destination: to, permanent: true, basePath: false },
      { source: "/agents/:slug", has: oldHost, destination: `${to}/:slug`, permanent: true, basePath: false },
      { source: "/:path*", has: oldHost, destination: `${to}/:path*`, permanent: true, basePath: false },
    ];
  },
};

export default nextConfig;
