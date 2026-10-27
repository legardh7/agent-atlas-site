import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { COUNTS, TOTAL_AGENTS } from "@/lib/robodex";
import { SITE } from "@/lib/site";

export const alt = "Verisoul Robodex: every AI agent, crawler and automation tool Verisoul can identify, and how we know";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0f1e3d";
const BLUE = "#2160fd";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";

/**
 * The card uses the default font only (no font downloads at build time). That font has one
 * weight, so headings get a thin stroke in their own color to read as bold.
 */
const bold = (px: number, color: string) => ({ WebkitTextStroke: `${px}px ${color}` });

/** Verisoul logo from /public as a data URL, or null so the card falls back to text */
async function verisoulLogo(): Promise<string | null> {
  try {
    const png = await readFile(join(process.cwd(), "public", "verisoul-logo.png"));
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image() {
  const logo = await verisoulLogo();
  const stats = [
    { value: TOTAL_AGENTS, label: "agents" },
    { value: COUNTS.method.Signed, label: "signed" },
    { value: COUNTS.method["Self-declared"], label: "self-declared" },
    { value: COUNTS.method.Inferred, label: "inferred" },
  ];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#ffffff", color: NAVY }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 72px 56px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" width={181} height={36} style={{ width: 181, height: 36 }} />
            ) : (
              <div style={{ fontSize: 34, ...bold(1, NAVY) }}>verisoul</div>
            )}
            <div style={{ marginTop: 34, fontSize: 132, lineHeight: 1, letterSpacing: -2, ...bold(5, NAVY) }}>Robodex</div>
            <div style={{ marginTop: 30, fontSize: 38, lineHeight: 1.32, color: MUTED, maxWidth: 960 }}>{SITE.description}</div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            {stats.map((s, i) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  paddingLeft: i === 0 ? 0 : 44,
                  paddingRight: 44,
                  borderLeft: i === 0 ? "none" : `2px solid ${LINE}`,
                }}
              >
                <div style={{ fontSize: 60, lineHeight: 1, ...bold(2, NAVY) }}>{s.value.toLocaleString("en-US")}</div>
                <div style={{ marginTop: 10, fontSize: 26, color: MUTED }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 12, width: "100%", background: BLUE }} />
      </div>
    ),
    size,
  );
}
