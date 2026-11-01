import type { Metadata } from "next";
import { Suspense } from "react";
import { Directory, DirectoryFallback } from "@/components/directory/Directory";
import { BrowseAll } from "@/components/browse/BrowseAll";
import { GuideHub } from "@/components/guide/GuideHub";
import { TOTAL_AGENTS } from "@/lib/atlas";
import { SITE, abs } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Agent Atlas: every AI agent and bot Verisoul identifies" },
  description: `A directory of ${TOTAL_AGENTS} AI agents, AI crawlers, assistants and headless browsers, with how each one is detected. ${SITE.description}`,
  alternates: { canonical: abs("/") },
};

export default function Home() {
  return (
    <>
      <Suspense fallback={<DirectoryFallback />}>
        <Directory />
      </Suspense>
      <GuideHub />
      <BrowseAll />
    </>
  );
}
