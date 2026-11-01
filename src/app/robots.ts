import type { MetadataRoute } from "next";
import { abs } from "@/lib/site";

/**
 * Only used where the Atlas runs at a domain root (the old agents.verisoul.ai host).
 * On www.verisoul.ai the site-wide robots.txt comes from Webflow.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: abs("/sitemap.xml"),
  };
}
