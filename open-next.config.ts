import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

// Cache rendered pages in Workers KV (binding NEXT_INC_CACHE_KV in wrangler.json, created by
// Webflow Cloud on deploy). Every Atlas page is static, so after the first visit a page is
// served straight from KV, and cache interception answers without starting Next.js at all.
// A new deploy has a new build ID, so the cache starts fresh with each release.
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  enableCacheInterception: true,
});
