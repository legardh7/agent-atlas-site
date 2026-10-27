import { Icon } from "@/components/Icon";
import { COUNTS, TOTAL_AGENTS, TYPES, UPDATED, typeInfo, type AgentType } from "@/lib/robodex";
import styles from "./Directory.module.css";

const STATS = [
  { label: "Agents", value: TOTAL_AGENTS },
  { label: "Signed", value: COUNTS.method.Signed },
  { label: "Self-declared", value: COUNTS.method["Self-declared"] },
  { label: "Inferred", value: COUNTS.method.Inferred },
];

/**
 * Title, stat strip and the "Browse by type" cards.
 * With onSelectType the cards are toggle buttons; without it (the loading shell) they are plain links.
 */
export function Hero({ activeType, onSelectType }: { activeType: AgentType | null; onSelectType?: (type: AgentType) => void }) {
  return (
    <section className={`container ${styles.hero}`} aria-labelledby="robodex-title">
      <div className={styles.heroMain}>
        <h1 id="robodex-title" className={styles.title}>
          Robodex
        </h1>
        <p className={styles.subtitle}>Every AI agent, crawler and automation tool Verisoul can identify, and how we know.</p>
        <dl className={styles.stats}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.stat}>
              <dt className={styles.statLabel}>{s.label}</dt>
              <dd className={styles.statNum}>{s.value}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.updated}>Updated {UPDATED}</p>
      </div>

      <aside className={styles.browse} aria-labelledby="browse-title">
        <h2 id="browse-title" className={styles.browseTitle}>
          Browse by type
        </h2>
        <p className={styles.browseSub}>Pick a type to filter the list</p>
        <ul className={styles.typeGrid}>
          {TYPES.map((t) => {
            const body = (
              <>
                <span className={styles.typeIcon} aria-hidden="true">
                  <Icon name={t.icon} size={16} strokeWidth={1.75} />
                </span>
                <span className={styles.typeName}>{t.key}</span>
                <span className={styles.typeCount}>
                  {COUNTS.type[t.key]}
                  <span className="sr-only"> agents</span>
                </span>
                <span className={styles.typeMeaning}>{t.meaning}</span>
              </>
            );
            return (
              <li key={t.key}>
                {onSelectType ? (
                  <button type="button" className={styles.typeCard} aria-pressed={activeType === t.key} onClick={() => onSelectType(t.key)}>
                    {body}
                  </button>
                ) : (
                  <a className={styles.typeCard} href={`/?type=${typeInfo(t.key).slug}#agents`}>
                    {body}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </aside>
    </section>
  );
}
