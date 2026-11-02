import type { MetadataRoute } from "next";
import { AGENTS, TYPES } from "@/lib/atlas";
import { abs } from "@/lib/site";
import { GUIDES, GUIDES_UPDATED, STANDALONE_GUIDES } from "@/lib/guides";

/** Date the directory data was last refreshed; bump it when agents.json changes */
const LAST_MODIFIED = "2026-11-01";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: abs("/"), lastModified: LAST_MODIFIED, changeFrequency: "weekly", priority: 1 },
    ...TYPES.map((t) => ({
      url: abs(`/type/${t.slug}`),
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    // Only entries with a full detection guide; the rest carry a googlebot noindex tag (see [slug]/page.tsx)
    ...AGENTS.filter((a) => GUIDES.some((g) => g.slug === a.slug)).map((a) => ({
      url: abs(`/${a.slug}`),
      lastModified: GUIDES_UPDATED,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    // Detection guides that are pages of their own
    ...STANDALONE_GUIDES.map((g) => ({
      url: abs(`/${g.slug}`),
      lastModified: GUIDES_UPDATED,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
