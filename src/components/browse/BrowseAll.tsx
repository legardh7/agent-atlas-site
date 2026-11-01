import Link from "next/link";
import { AGENTS, TOTAL_AGENTS, TYPES, levelInfo, type AgentType } from "@/lib/atlas";
import styles from "./Browse.module.css";

/**
 * Server-rendered index of every agent, grouped by type. The interactive directory above it
 * is drawn in the browser, so this block is what search engines and AI crawlers read: plain
 * links to every agent page and every type page.
 */
export function BrowseAll() {
  return (
    <section className={`container ${styles.browse}`} aria-labelledby="browse-all">
      <h2 id="browse-all" className={styles.h2}>
        Browse all {TOTAL_AGENTS} agents by type
      </h2>
      <p className={styles.lead}>Every agent below has its own page explaining what it is and exactly how Verisoul detects it.</p>
      <div className={styles.groups}>
        {TYPES.map((t) => {
          const list = agentsOfType(t.key);
          if (list.length === 0) return null;
          return (
            <details key={t.key} className={styles.group}>
              <summary className={styles.summary}>
                <span className={styles.groupName}>{t.key}</span>
                <span className={styles.groupCount}>{list.length}</span>
                <span className={styles.groupMeaning}>{t.meaning}</span>
              </summary>
              <p className={styles.hubLink}>
                <Link href={`/type/${t.slug}`}>See all {list.length} on one page</Link>
              </p>
              <ul className={styles.list}>
                {list.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/${a.slug}`} title={`How to detect ${a.name} (${levelInfo(a.rank).label.toLowerCase()})`}>
                      {a.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </section>
  );
}

export function agentsOfType(type: AgentType) {
  return AGENTS.filter((a) => a.type === type).sort((a, b) => a.order - b.order);
}
