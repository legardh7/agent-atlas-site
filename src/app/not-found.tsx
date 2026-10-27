import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { TOTAL_AGENTS } from "@/lib/atlas";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="container" style={{ paddingTop: 96, paddingBottom: 112 }}>
      <div style={{ maxWidth: 640 }}>
        <span
          aria-hidden="true"
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            border: "1px dashed var(--off)",
            color: "var(--faint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="search" size={24} />
        </span>
        <h1 style={{ marginTop: 28, fontSize: "clamp(32px, 7vw, 44px)", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.03em" }}>
          {"We don't know that agent yet"}
        </h1>
        <p style={{ marginTop: 16, fontSize: 18, lineHeight: 1.55, color: "var(--muted)" }}>
          {`There's nothing at this address. The link may be wrong, or it may be an agent we haven't added. Browse all ${TOTAL_AGENTS} agents Verisoul can identify and search them by name.`}
        </p>
        <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link href="/" className="btn primary">
            <Icon name="arrowLeft" size={16} strokeWidth={2} />
            All agents
          </Link>
          <a href={SITE.links.contact} className="btn">
            Tell us about an agent we missed
          </a>
        </div>
      </div>
    </main>
  );
}
