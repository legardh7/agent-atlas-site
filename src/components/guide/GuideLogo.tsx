import { LogoTile } from "@/components/AgentBits";
import { LOGOS, type Agent } from "@/lib/atlas";
import type { Guide } from "@/lib/guides";
import { asset, optimized } from "@/lib/site";
import g from "./guide.module.css";

/** The guide's logo: the product mark we were given, the Atlas logo, or the agent's own tile */
export function GuideLogo({ guide, agent, size }: { guide: Guide; agent: Agent | null; size: number }) {
  const radius = Math.round(size / 4);
  const l = guide.logo;
  let src: string | null = null;
  let full = false;
  if ("src" in l) {
    src = l.src;
    full = l.full;
  } else if (agent) {
    return <LogoTile agent={agent} size={size} />;
  } else if (LOGOS[l.atlas]) {
    src = LOGOS[l.atlas].src;
  }
  if (!src) return agent ? <LogoTile agent={agent} size={size} /> : null;
  const glyph = full ? size : Math.round(size * 0.56);
  return (
    <span className={`${g.logo}${full ? ` ${g.full}` : ""}`} style={{ width: size, height: size, borderRadius: radius }} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(optimized(src))} alt="" width={glyph} height={glyph} decoding="async" style={{ width: glyph, height: glyph }} />
    </span>
  );
}
