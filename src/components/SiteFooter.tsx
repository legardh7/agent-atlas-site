import { Icon } from "./Icon";
import { Meter } from "./AgentBits";
import { LEVELS, METHODS, SIGNALS, TOTAL_AGENTS } from "@/lib/robodex";
import { SITE } from "@/lib/site";
import Link from "next/link";

/** Legend (methods, signals, commonality) plus the closing call to action */
export function SiteFooter() {
  return (
    <footer>
      <section style={{ background: "var(--foot)", borderTop: "1px solid var(--line)" }}>
        <div className="container" style={{ paddingTop: 64, paddingBottom: 56 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px 56px" }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>How we confirm identity</h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 18 }}>
                {METHODS.map((m) => (
                  <li key={m.key}>
                    <span className={`pill${m.key === "Signed" ? " signed" : " outline"}`}>
                      <Icon name={m.icon} size={14} strokeWidth={2} />
                      {m.key}
                    </span>
                    <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55, color: "var(--muted)" }}>{m.meaning}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>The four signals</h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 16 }}>
                {SIGNALS.map((s) => (
                  <li key={s.key} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span className="signal-slot on" style={{ width: 32, height: 32, borderRadius: 9 }}>
                      <Icon name={s.icon} size={16} />
                    </span>
                    <span>
                      <strong style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{s.label}</strong>
                      <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--muted)" }}>{s.meaning}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Commonality</h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 16 }}>
                {LEVELS.map((l) => (
                  <li key={l.rank}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Meter rank={l.rank} />
                      <strong style={{ fontSize: 14, fontWeight: 600 }}>{l.label}</strong>
                    </span>
                    <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: "var(--muted)" }}>{l.meaning}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p style={{ marginTop: 40, fontSize: 13, color: "var(--muted)" }}>Commonality combines Verisoul traffic with public crawler traffic data</p>
        </div>
      </section>

      <section style={{ background: "var(--cta)", color: "#ffffff", borderBottom: "12px solid #2160fd" }}>
        <div className="container" style={{ paddingTop: 72, paddingBottom: 72, display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center" }}>
          <h2 style={{ flex: "1 1 560px", fontSize: 32, lineHeight: 1.25, fontWeight: 700, letterSpacing: "-0.01em", color: "#ffffff" }}>
            Building an agent? Sign your requests and Verisoul verifies it automatically.
          </h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href={SITE.links.signedAgents} style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 18px", borderRadius: 10, background: "#ffffff", color: "#0f1e3d", fontSize: 15, fontWeight: 600 }}>
              How signed agents work
            </a>
            <a href={SITE.links.api} style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.35)", color: "#ffffff", fontSize: 15, fontWeight: 600 }}>
              Get identified_agent in the API
            </a>
          </div>
        </div>
        <div className="container" style={{ paddingBottom: 28, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#c9d3e6" }}>
          <span>© 2026 Verisoul</span>
          <Link href="/" style={{ color: "#c9d3e6" }}>
            All {TOTAL_AGENTS} agents
          </Link>
          <a href={SITE.links.home} style={{ color: "#c9d3e6" }}>
            verisoul.ai
          </a>
        </div>
      </section>
    </footer>
  );
}
