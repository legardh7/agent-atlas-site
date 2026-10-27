import type { Metadata } from "next";
import { Suspense } from "react";
import { Directory, DirectoryFallback } from "@/components/directory/Directory";

export const metadata: Metadata = {
  title: { absolute: "Agent Atlas: every AI agent and bot Verisoul identifies" },
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <Suspense fallback={<DirectoryFallback />}>
      <Directory />
    </Suspense>
  );
}
