/** Site-wide settings. Point the links at the real pages before launch. */
export const SITE = {
  name: "Verisoul Agent Atlas",
  description: "Every AI agent, crawler and automation tool Verisoul can identify, and how we know.",
  /** Public URL the site is served from; used for sitemap, canonical links and social images */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://atlas.verisoul.ai",
  links: {
    home: "https://www.verisoul.ai",
    agentDetection: "https://www.verisoul.ai",
    docs: "https://docs.verisoul.ai",
    contact: "https://www.verisoul.ai/contact",
    signedAgents: "https://docs.verisoul.ai",
    api: "https://docs.verisoul.ai",
  },
};
