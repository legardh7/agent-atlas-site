import type { Metadata } from "next";
import { Suspense } from "react";
import { Directory, DirectoryFallback } from "@/components/directory/Directory";
import { BrowseAll } from "@/components/browse/BrowseAll";
import { GuideHub } from "@/components/guide/GuideHub";
import { TOTAL_AGENTS } from "@/lib/atlas";
import { GUIDES, guideName } from "@/lib/guides";
import { SITE, abs } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Agent Atlas: every AI agent and bot Verisoul identifies" },
  description: `A directory of ${TOTAL_AGENTS} AI agents, AI crawlers, assistants and headless browsers, with exactly how Verisoul detects each one, plus ${GUIDES.length} detection guides.`,
  alternates: { canonical: abs("/") },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        publisher: { "@type": "Organization", name: "Verisoul", url: "https://www.verisoul.ai" },
      },
      {
        "@type": "CollectionPage",
        name: "Agent Atlas",
        url: SITE.url,
        description: `${TOTAL_AGENTS} AI agents, AI crawlers, assistants and headless browsers, and how Verisoul detects each one.`,
        about: ["AI agent detection", "Bot detection", "AI crawlers", "Know Your Agent"],
        mainEntity: {
          "@type": "ItemList",
          name: "Detection guides",
          numberOfItems: GUIDES.length,
          itemListElement: GUIDES.map((g, i) => ({ "@type": "ListItem", position: i + 1, name: `How to detect ${guideName(g)}`, url: abs(`/${g.slug}`) })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Verisoul", item: "https://www.verisoul.ai" },
          { "@type": "ListItem", position: 2, name: "Agent Atlas", item: SITE.url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense fallback={<DirectoryFallback />}>
        <Directory />
      </Suspense>
      <GuideHub />
      <BrowseAll />
    </>
  );
}
