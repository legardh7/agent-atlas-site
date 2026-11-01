import Link from "next/link";
import { getAgent } from "@/lib/atlas";
import { GUIDES, GUIDE_GROUPS, guideName } from "@/lib/guides";
import { GuideLogo } from "./GuideLogo";
import g from "./guide.module.css";

/** Homepage section: the in-depth guides, grouped, as plain crawlable links */
export function GuideHub() {
  return (
    <section className={`container ${g.hub}`} id="detection-guides" aria-labelledby="guides-heading">
      <div className={g.hubHead}>
        <h2 id="guides-heading" className={g.hubTitle}>
          Detection guides
        </h2>
        <p className={g.hubLead}>
          In-depth guides to the {GUIDES.length} AI agents, AI browsers, automation tools and crawlers people ask about most: who makes each one,
          how it shows up on your site and how Verisoul detects it.
        </p>
      </div>
      {GUIDE_GROUPS.map((group) => (
        <div key={group.id} className={g.group}>
          <h3 className={g.groupName}>{group.name}</h3>
          <ul className={g.cards}>
            {GUIDES.filter((x) => x.group === group.id).map((x) => {
              const name = guideName(x);
              return (
                <li key={x.slug}>
                  <Link href={`/${x.slug}`} className={g.card}>
                    <GuideLogo guide={x} agent={getAgent(x.slug) ?? null} size={44} />
                    <span>
                      <span className={g.cardName}>How to detect {name}</span>
                      <span className={g.cardDek}>{x.dek.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`/g, "")}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
