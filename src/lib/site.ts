/**
 * Where the Atlas lives. It is served at www.verisoul.ai/agents as a Webflow Cloud app
 * mounted at /agents. Webflow sets Next's basePath at build time, so <Link> and redirect()
 * get the prefix on their own. Plain <img> tags and absolute URLs use the helpers below.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/agents").replace(/\/+$/, "");
export const ORIGIN = (process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://www.verisoul.ai").replace(/\/+$/, "");

/** Site-wide settings */
export const SITE = {
  name: "Verisoul Agent Atlas",
  description: "Every AI agent, crawler and automation tool Verisoul can identify, and how each one is detected.",
  /** Public URL of the Atlas home; used for sitemap, canonical links and social images */
  url: `${ORIGIN}${BASE_PATH}`,
  links: {
    home: "https://www.verisoul.ai",
    agentDetection: "https://www.verisoul.ai",
    docs: "https://docs.verisoul.ai",
    contact: "https://www.verisoul.ai/contact",
    signedAgents: "https://docs.verisoul.ai/signals-scores/agent-detection",
    api: "https://docs.verisoul.ai/signals-scores/agent-detection",
  },
};

/** A file in /public, with the mount path in front (for plain <img> tags) */
export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The small WebP copy of a guide image or the header logo (made by scripts/optimize-images.mjs) */
export function optimized(path: string): string {
  return /^\/(guides\/|verisoul-logo\.png$)/.test(path) ? path.replace(/\.(png|jpe?g)$/i, ".webp") : path;
}

/** Absolute public URL for a path inside the Atlas, e.g. abs("/meta-muse") */
export function abs(path = "/"): string {
  const p = path === "/" || path === "" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${p}`;
}
