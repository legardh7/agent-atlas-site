"use client";

import { useState } from "react";
import { LOGOS, siteIcon, type Agent } from "@/lib/atlas";

/**
 * Full-color company or product logo on a light tile.
 * Order: our own logo file, then the company's website icon, then a monogram.
 */
export function LogoTile({ agent, size = 36 }: { agent: Agent; size?: number }) {
  const [failed, setFailed] = useState(false);
  const logo = agent.logo ? LOGOS[agent.logo] : null;
  const favicon = !logo && !failed ? siteIcon(agent) : null;
  const glyph = Math.round(size * (logo ? 0.56 : 0.5));
  const radius = Math.round(size / 4);

  return (
    <span className={`logo-tile${logo || favicon ? " has-logo" : ""}`} style={{ width: size, height: size, borderRadius: radius }} aria-hidden="true">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo.src} alt="" width={glyph} height={glyph} decoding="async" loading="lazy" style={{ width: glyph, height: glyph, objectFit: "contain" }} />
      ) : favicon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={favicon}
          alt=""
          width={glyph}
          height={glyph}
          decoding="async"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          onLoad={(e) => {
            // Google returns a 16px generic globe when a site has no icon; treat that as missing
            if (e.currentTarget.naturalWidth <= 16) setFailed(true);
          }}
          style={{ width: glyph, height: glyph, objectFit: "contain", borderRadius: 4 }}
        />
      ) : (
        <span className="monogram" style={{ fontSize: Math.max(11, Math.round(size / 3)) }}>
          {agent.monogram}
        </span>
      )}
    </span>
  );
}
