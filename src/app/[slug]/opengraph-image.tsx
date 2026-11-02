import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { ICONS, type IconName } from "@/lib/icons";
import { AGENTS, LOGOS, SIGNALS, getAgent, levelInfo, methodInfo, typeInfo, type Agent } from "@/lib/atlas";
import { ORIGIN, SITE, asset } from "@/lib/site";
import { STANDALONE_GUIDES, getGuide } from "@/lib/guides";

export const alt = "Verisoul Agent Atlas card: who runs this agent, what kind it is, how common it is and which signals Verisoul uses to identify it";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** One card per agent, all built at deploy time; unknown slugs return 404 */
/** Unknown slugs still 404 (notFound below). Pages render on request when the host has no prerender cache, as on Webflow Cloud */

export function generateStaticParams() {
  return [...AGENTS.map((a) => ({ slug: a.slug })), ...STANDALONE_GUIDES.map((g) => ({ slug: g.slug }))];
}

const NAVY = "#0f1e3d";
const BLUE = "#2160fd";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";
const TILE = "#f2f4f8";
const SEG_OFF = "#e2e5ea";
const SIG_ON_BG = "#e9effc";
const SIG_OFF_BG = "#f7f8fa";
const SIG_OFF_FG = "#b9c0cc";

/**
 * The card uses the default font only (no font downloads at build time). That font has one
 * weight, so headings get a thin stroke in their own color to read as bold.
 */
const bold = (px: number, color: string) => ({ WebkitTextStroke: `${px}px ${color}` });

/** Smaller type for longer names so most fit on one line and the longest wrap to two */
function nameSize(name: string): number {
  if (name.length <= 16) return 76;
  if (name.length <= 22) return 64;
  if (name.length <= 30) return 54;
  return 46;
}

function StrokeIcon({ name, size, color }: { name: IconName; size: number; color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/** A logo file under /public as a data URI (Satori draws it like any image) */
async function logoDataUri(src: string | null): Promise<string | null> {
  if (!src) return null;
  const mime = src.endsWith(".png") ? "image/png" : src.endsWith(".jpg") ? "image/jpeg" : "image/svg+xml";
  try {
    const file = readFileSync(join(process.cwd(), "public", src));
    return `data:${mime};base64,${file.toString("base64")}`;
  } catch {
    // No file system at request time on the edge: fetch the public file instead
    try {
      const res = await fetch(`${ORIGIN}${asset(src)}`);
      if (!res.ok) return null;
      const bytes = new Uint8Array(await res.arrayBuffer());
      let bin = "";
      for (const b of bytes) bin += String.fromCharCode(b);
      return `data:${mime};base64,${btoa(bin)}`;
    } catch {
      return null;
    }
  }
}

function LogoTile({ monogram, logo }: { monogram: string; logo: string | null }) {
  return (
    <div
      style={{
        width: 128,
        height: 128,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 30,
        background: TILE,
      }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        <img src={logo} width={72} height={72} style={{ objectFit: "contain" }} />
      ) : (
        <div style={{ display: "flex", fontSize: 50, color: MUTED, letterSpacing: 1, ...bold(1.6, MUTED) }}>
          {monogram}
        </div>
      )}
    </div>
  );
}

/** "Run by Amazon"; rows with no company behind them read differently */
function providerLine(provider: string): string {
  if (!provider || provider === "Unknown") return "Provider unknown";
  if (provider === "Open source") return "Open source project";
  return `Run by ${provider}`;
}

function Fact({ label, children, first = false, last = false }: { label: string; children: React.ReactNode; first?: boolean; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        paddingLeft: first ? 0 : 36,
        paddingRight: last ? 0 : 36,
        borderLeft: first ? "none" : `2px solid ${LINE}`,
      }}
    >
      <div style={{ display: "flex", fontSize: 22, color: MUTED }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 12, height: 40 }}>{children}</div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  // Next 15.5 hands image routes a plain object and newer versions a Promise; awaiting covers both
  const { slug } = await params;
  const agent = getAgent(slug);
  const guide = getGuide(slug);
  const s = !agent && guide?.standalone ? guide.standalone : null;
  if (!agent && !s) return new Response("Not found", { status: 404 });

  // A detection guide that is a page of its own gets the same card, with "Not named yet" when the API doesn't name it
  const card = agent
    ? {
        name: agent.name,
        provider: agent.provider,
        monogram: agent.monogram ?? agent.name.slice(0, 1).toUpperCase(),
        logoSrc: agent.logo ? LOGOS[agent.logo]?.src ?? null : null,
        typeLabel: agent.type as string,
        typeIcon: typeInfo(agent.type).icon,
        methodLabel: agent.method as string,
        methodIcon: methodInfo(agent.method).icon,
        signed: agent.method === "Signed",
        rank: agent.rank,
        third: levelInfo(agent.rank).label,
        signals: agent.signals,
      }
    : {
        name: s!.name,
        provider: s!.provider,
        monogram: s!.name.slice(0, 1).toUpperCase(),
        logoSrc: "src" in guide!.logo ? guide!.logo.src : LOGOS[guide!.logo.atlas]?.src ?? null,
        typeLabel: s!.typeLabel,
        typeIcon: "bot" as IconName,
        methodLabel: s!.named === false || !s!.method ? "Not named yet" : s!.method,
        methodIcon: (s!.named === false || !s!.method ? "inferred" : methodInfo(s!.method).icon) as IconName,
        signed: s!.named !== false && s!.method === "Signed",
        rank: null,
        third: "Detection guide",
        signals: Object.fromEntries(SIGNALS.map((x) => [x.key, s!.signals.includes(x.key)])) as Agent["signals"],
      };
  const logo = await logoDataUri(card.logoSrc);
  const filled = card.rank === null ? 0 : card.rank === 5 ? 2 : 5 - card.rank;
  const methodColor = card.signed ? BLUE : NAVY;
  const provider = providerLine(card.provider);
  const host = SITE.url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const fs = nameSize(card.name);
  // The longest combination ("Headless automation", "Self-declared", "Very common") needs smaller type to fit
  const factSize = card.typeLabel.length + card.methodLabel.length + card.third.length > 38 ? 28 : 32;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#ffffff", color: NAVY }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "46px 72px 50px" }}>
          {/* Top line */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 24 }}>
            <div style={{ display: "flex", color: NAVY, ...bold(0.8, NAVY) }}>Verisoul Agent Atlas</div>
            <div style={{ display: "flex", color: MUTED }}>{host}</div>
          </div>

          {/* Logo, name and provider */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <LogoTile monogram={card.monogram} logo={logo} />
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 36, maxWidth: 890 }}>
              <div style={{ display: "flex", fontSize: fs, lineHeight: 1.08, ...bold(fs >= 64 ? 2.6 : 2.2, NAVY) }}>{card.name}</div>
              <div style={{ display: "flex", marginTop: 14, fontSize: 30, color: MUTED }}>{provider}</div>
            </div>
          </div>

          {/* Type, method, commonality */}
          <div style={{ display: "flex" }}>
            <Fact label="Type" first>
              <StrokeIcon name={card.typeIcon} size={30} color={MUTED} />
              <div style={{ display: "flex", marginLeft: 12, fontSize: factSize, ...bold(0.8, NAVY) }}>{card.typeLabel}</div>
            </Fact>
            <Fact label="Method">
              <StrokeIcon name={card.methodIcon} size={30} color={methodColor} />
              <div style={{ display: "flex", marginLeft: 12, fontSize: factSize, color: methodColor, ...bold(0.8, methodColor) }}>{card.methodLabel}</div>
            </Fact>
            <Fact label={card.rank === null ? "Page" : "Commonality"} last>
              {card.rank !== null && (
              <div style={{ display: "flex" }}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{ display: "flex", width: 26, height: 14, marginRight: 5, borderRadius: 4, background: i < filled ? BLUE : SEG_OFF }}
                  />
                ))}
              </div>
              )}
              <div style={{ display: "flex", marginLeft: 10, fontSize: factSize, ...bold(0.8, NAVY) }}>{card.third}</div>
            </Fact>
          </div>

          {/* Signals */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 22, color: MUTED }}>How Verisoul identifies it</div>
            <div style={{ display: "flex", marginTop: 14 }}>
              {SIGNALS.map((s) => {
                const on = card.signals[s.key];
                const fg = on ? NAVY : SIG_OFF_FG;
                return (
                  <div
                    key={s.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: 60,
                      padding: "0 24px 0 18px",
                      marginRight: 14,
                      borderRadius: 14,
                      background: on ? SIG_ON_BG : SIG_OFF_BG,
                    }}
                  >
                    <StrokeIcon name={s.icon} size={28} color={fg} />
                    <div style={{ display: "flex", marginLeft: 12, fontSize: 28, color: fg, ...(on ? bold(0.7, NAVY) : {}) }}>{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ height: 12, width: "100%", background: BLUE }} />
      </div>
    ),
    size,
  );
}
