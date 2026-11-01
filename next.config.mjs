/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // basePath and assetPrefix are set by Webflow Cloud from the /agents mount; don't set them here.
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
