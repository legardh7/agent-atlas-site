import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  return (
    <header style={{ borderBottom: "1px solid var(--line)" }}>
      <div className="container site-head" style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "nowrap", paddingTop: 14, paddingBottom: 14 }}>
        <Link href="/" aria-label="Verisoul Agent Atlas home" className="site-brand" style={{ display: "flex", alignItems: "center", gap: 14, color: "var(--fg)", flex: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/verisoul-logo.png" alt="Verisoul" width={113} height={22} style={{ height: 22, width: "auto", display: "block", filter: "var(--logo-filter)" }} />
          <span style={{ width: 1, height: 20, background: "var(--line)" }} />
          <span style={{ fontSize: 15, fontWeight: 700 }}>Agent Atlas</span>
        </Link>
        <nav aria-label="Main" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 22, fontSize: 14, fontWeight: 500, flexWrap: "nowrap" }} className="site-nav">
          <a href={SITE.links.agentDetection} style={{ color: "var(--muted)" }} className="hide-sm">
            Agent detection
          </a>
          <a href={SITE.links.docs} style={{ color: "var(--muted)" }} className="hide-sm">
            Docs
          </a>
          <ThemeToggle />
          <a href={SITE.links.contact} className="btn primary site-cta" style={{ height: 38, padding: "0 16px", fontSize: 14, whiteSpace: "nowrap" }}>
            Talk to us
          </a>
        </nav>
      </div>
      <style>{`@media (max-width: 640px){.hide-sm{display:none}.site-head{gap:10px!important}.site-nav{gap:8px!important}.site-brand{gap:10px!important}.site-brand img{height:18px!important}.site-cta{padding:0 12px!important;font-size:13px!important}}`}</style>
    </header>
  );
}
