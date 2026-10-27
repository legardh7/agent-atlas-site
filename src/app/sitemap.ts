import type { MetadataRoute } from "next";
import { AGENTS } from "@/lib/robodex";
import { SITE } from "@/lib/site";

/** Date the directory data was last refreshed; bump it when robodex.json changes */
const LAST_MODIFIED = "2026-10-26";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/+$/, "");
  return [
    { url: `${base}/`, lastModified: LAST_MODIFIED, changeFrequency: "weekly", priority: 1 },
    ...AGENTS.map((a) => ({
      url: `${base}/agents/${a.slug}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
