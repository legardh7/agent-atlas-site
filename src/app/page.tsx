import type { Metadata } from "next";
import { Suspense } from "react";
import { Directory, DirectoryFallback } from "@/components/directory/Directory";
import { BrowseAll } from "@/components/browse/BrowseAll";
import { GuideHub } from "@/components/guide/GuideHub";
import { TOTAL_AGENTS } from "@/lib/atlas";
import { GUIDES, guideName } from "@/lib/guides";
import { SITE, abs } from "@/lib/site";
import { breadcrumbs, graph, itemList, webPage } from "@/lib/schema";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: { absolute: "Agent Atlas: every AI agent and bot Verisoul identifies" },
  description: `A directory of ${TOTAL_AGENTS} AI agents, AI crawlers, assistants and headless browsers, with exactly how Verisoul detects each one, plus ${GUIDES.length} detection guides.`,
  alternates: { canonical: abs("/") },
};

export default function Home() {
  const jsonLd = graph(
    webPage({
      type: "CollectionPage",
      url: SITE.url,
      name: "Agent Atlas",
      description: `${TOTAL_AGENTS} AI agents, AI crawlers, assistants and headless browsers, and how Verisoul detects each one.`,
      extra: {
        about: ["AI agent detection", "Bot detection", "AI crawlers", "Know Your Agent"],
        mainEntity: itemList(
          "Detection guides",
          GUIDES.map((g) => ({ name: `How to detect ${guideName(g)}`, url: abs(`/${g.slug}`) })),
        ),
      },
    }),
    breadcrumbs(SITE.url),
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <Suspense fallback={<DirectoryFallback />}>
        <Directory />
      </Suspense>
      <GuideHub />
      <BrowseAll />
    </>
  );
}
