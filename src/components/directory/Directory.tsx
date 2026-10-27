"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { LogoTile, Meter, MethodPill, SignalSlots, TypeLabel } from "@/components/AgentBits";
import {
  COUNTS,
  LEVELS,
  METHODS,
  SIGNALS,
  TOTAL_AGENTS,
  TYPES,
  brandVars,
  levelInfo,
  methodInfo,
  type Agent,
  type AgentType,
  type Rank,
} from "@/lib/atlas";
import {
  EMPTY_FILTERS,
  METHOD_ORDER,
  RANK_ORDER,
  SIGNAL_ORDER,
  SORTS,
  agentCount,
  filterAgents,
  hasActiveFilters,
  parseFilters,
  serializeFilters,
  toggleIn,
  type Filters,
  type MultiGroup,
  type SortKey,
} from "./filters";
import { Hero } from "./Hero";
import styles from "./Directory.module.css";

const PAGE = 40;

export function Directory() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<Filters>(() => parseFilters(params));
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<string | null>(null);
  const lastWritten = useRef<string>(serializeFilters(parseFilters(params)));

  // Follow outside URL changes (back/forward, links like /?type=crawler)
  useEffect(() => {
    const next = parseFilters(params);
    const qs = serializeFilters(next);
    if (qs !== lastWritten.current) {
      lastWritten.current = qs;
      setFilters(next);
      setLimit(PAGE);
    }
  }, [params]);

  // Write filter state to the URL (search is debounced so typing stays smooth)
  useEffect(() => {
    const qs = serializeFilters(filters);
    if (qs === lastWritten.current) return;
    const t = window.setTimeout(() => {
      lastWritten.current = qs;
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 250);
    return () => window.clearTimeout(t);
  }, [filters, pathname, router]);

  const update = useCallback((patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setLimit(PAGE);
  }, []);

  const rows = useMemo(() => filterAgents(filters), [filters]);
  const shown = rows.slice(0, limit);
  const remaining = rows.length - shown.length;
  const active = hasActiveFilters(filters);

  const selectType = useCallback(
    (type: AgentType | null, scroll = false) => {
      setFilters((f) => ({ ...f, type: f.type === type ? null : type }));
      setLimit(PAGE);
      if (scroll) document.getElementById("agents")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [],
  );

  const clearAll = () => update({ ...EMPTY_FILTERS, sort: filters.sort });

  // Active filter chips
  const chips: { label: string; remove: () => void }[] = [];
  if (filters.q.trim()) chips.push({ label: `“${filters.q.trim()}”`, remove: () => update({ q: "" }) });
  if (filters.type) chips.push({ label: filters.type, remove: () => update({ type: null }) });
  filters.commonality.forEach((r) =>
    chips.push({ label: levelInfo(r).label, remove: () => update({ commonality: filters.commonality.filter((x) => x !== r) }) }),
  );
  filters.method.forEach((m) => chips.push({ label: m, remove: () => update({ method: filters.method.filter((x) => x !== m) }) }));
  filters.signal.forEach((s) =>
    chips.push({
      label: SIGNALS.find((x) => x.key === s)!.label,
      remove: () => update({ signal: filters.signal.filter((x) => x !== s) }),
    }),
  );

  return (
    <>
      <Hero activeType={filters.type} onSelectType={(t) => selectType(t, true)} />

      <div id="agents" className={styles.directory}>
        <FilterBar filters={filters} update={update} selectType={(t) => selectType(t)} />

        <main className="container">
          <div className={styles.results} aria-live="polite">
            <p className={styles.showing}>
              Showing <strong>{agentCount(rows)}</strong> of {TOTAL_AGENTS} agents
            </p>
            {chips.map((c) => (
              <button key={c.label} type="button" className={styles.activeChip} onClick={c.remove} aria-label={`Remove filter ${c.label}`}>
                <span>{c.label}</span>
                <Icon name="x" size={14} strokeWidth={2} />
              </button>
            ))}
            {active && (
              <button type="button" className={styles.clearAll} onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>

          <div className={styles.list}>
            <div className={`${styles.grid} ${styles.head}`} aria-hidden="true">
              <span className={styles.colAgent}>Agent</span>
              <span className={styles.colDesc}>What it does</span>
              <span className={styles.colType}>Type</span>
              <span className={styles.colMethod}>Method</span>
              <span className={styles.colSig}>Signals</span>
              <span className={styles.colComm}>Commonality</span>
              <span className={styles.colChev} />
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }} aria-label="Agents">
              {shown.map((a) => (
                <AgentRow key={a.slug} agent={a} open={open === a.slug} onToggle={() => setOpen(open === a.slug ? null : a.slug)} />
              ))}
            </ul>
          </div>

          {rows.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>
                <Icon name="search" size={22} strokeWidth={1.75} />
              </span>
              <p className={styles.emptyTitle}>No agents match these filters</p>
              <p className={styles.emptyText}>Try a different name, or widen the filters</p>
              <button type="button" className={`btn ${styles.emptyBtn}`} onClick={clearAll}>
                Clear all filters
              </button>
            </div>
          )}

          {remaining > 0 && (
            <div className={styles.more}>
              <button type="button" className="btn" onClick={() => setLimit((l) => l + PAGE)}>
                Show {Math.min(PAGE, remaining)} more
              </button>
              <button type="button" className={`btn ${styles.ghostBtn}`} onClick={() => setLimit(100000)}>
                Show all {remaining}
              </button>
            </div>
          )}
          <div className={styles.listEnd} />
        </main>
      </div>
    </>
  );
}

/* ---------------- Filter bar ---------------- */

function FilterBar({
  filters,
  update,
  selectType,
}: {
  filters: Filters;
  update: (p: Partial<Filters>) => void;
  selectType: (t: AgentType | null) => void;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [openDd, setOpenDd] = useState<MultiGroup | null>(null);

  // "/" focuses search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={styles.bar}>
      <div className={`container ${styles.barInner}`}>
        <div className={styles.controls}>
          <label className={styles.search}>
            <Icon name="search" size={18} strokeWidth={1.75} />
            <span className="sr-only">Search agents</span>
            <input
              ref={searchRef}
              type="search"
              className={styles.searchInput}
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder={`Search ${TOTAL_AGENTS} agents, providers or identified_agent values`}
              autoComplete="off"
              spellCheck={false}
            />
            {filters.q ? (
              <button type="button" className={styles.searchClear} onClick={() => update({ q: "" })} aria-label="Clear search">
                <Icon name="x" size={16} strokeWidth={2} />
              </button>
            ) : (
              <kbd className={styles.kbd} aria-hidden="true">
                /
              </kbd>
            )}
          </label>

          <div className={styles.ctrlGroup}>
            <Dropdown
              group="commonality"
              label="Commonality"
              open={openDd === "commonality"}
              setOpen={(o) => setOpenDd(o ? "commonality" : null)}
              selectedCount={filters.commonality.length}
              onClear={() => update({ commonality: [] })}
              options={LEVELS.map((l) => ({
                key: String(l.rank),
                label: l.label,
                count: COUNTS.rank[String(l.rank) as "1" | "2" | "3" | "4"],
                visual: <Meter rank={l.rank} variant="tall" />,
                checked: filters.commonality.includes(l.rank),
                toggle: () => update({ commonality: toggleIn(RANK_ORDER, filters.commonality, l.rank as Rank) }),
              }))}
            />
            <Dropdown
              group="method"
              label="Method"
              open={openDd === "method"}
              setOpen={(o) => setOpenDd(o ? "method" : null)}
              selectedCount={filters.method.length}
              onClear={() => update({ method: [] })}
              options={METHODS.map((m) => ({
                key: m.key,
                label: m.key,
                count: COUNTS.method[m.key],
                visual: <Icon name={m.icon} size={16} />,
                checked: filters.method.includes(m.key),
                toggle: () => update({ method: toggleIn(METHOD_ORDER, filters.method, m.key) }),
              }))}
            />
            <Dropdown
              group="signal"
              label="Signals"
              open={openDd === "signal"}
              setOpen={(o) => setOpenDd(o ? "signal" : null)}
              selectedCount={filters.signal.length}
              onClear={() => update({ signal: [] })}
              note="Shows agents that use every signal you pick"
              options={SIGNALS.map((s) => ({
                key: s.key,
                label: s.label,
                hint: s.meaning,
                count: COUNTS.signals[s.key],
                visual: <Icon name={s.icon} size={16} />,
                checked: filters.signal.includes(s.key),
                toggle: () => update({ signal: toggleIn(SIGNAL_ORDER, filters.signal, s.key) }),
              }))}
              alignEnd
            />
            <label className={styles.sort}>
              <span className={styles.sortLabel}>Sort</span>
              <select className={styles.sortSelect} value={filters.sort} onChange={(e) => update({ sort: e.target.value as SortKey })}>
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className={styles.tabs} role="group" aria-label="Type">
          <button type="button" className={styles.tab} aria-pressed={filters.type === null} onClick={() => update({ type: null })}>
            All <span className={styles.tabCount}>{TOTAL_AGENTS}</span>
          </button>
          {TYPES.map((t) => (
            <button key={t.key} type="button" className={styles.tab} aria-pressed={filters.type === t.key} onClick={() => selectType(t.key)}>
              <Icon name={t.icon} size={16} strokeWidth={1.75} />
              {t.key} <span className={styles.tabCount}>{COUNTS.type[t.key]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Option {
  key: string;
  label: string;
  hint?: string;
  count: number;
  visual: React.ReactNode;
  checked: boolean;
  toggle: () => void;
}

function Dropdown({
  label,
  open,
  setOpen,
  selectedCount,
  onClear,
  options,
  note,
  alignEnd,
}: {
  group: MultiGroup;
  label: string;
  open: boolean;
  setOpen: (o: boolean) => void;
  selectedCount: number;
  onClear: () => void;
  options: Option[];
  note?: string;
  alignEnd?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popId = useId();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <div className={styles.dd} ref={ref}>
      <button
        ref={btnRef}
        type="button"
        className={`${styles.ddBtn}${selectedCount ? ` ${styles.ddBtnActive}` : ""}`}
        aria-expanded={open}
        aria-controls={popId}
        onClick={() => setOpen(!open)}
      >
        {label}
        {selectedCount > 0 && (
          <span className={styles.ddBadge}>
            {selectedCount}
            <span className="sr-only"> selected</span>
          </span>
        )}
        <Icon name="chevron" size={16} strokeWidth={2} className={`${styles.ddChevron}${open ? ` ${styles.ddChevronOpen}` : ""}`} />
      </button>
      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} aria-hidden="true" />
          <div id={popId} className={`${styles.pop}${alignEnd ? ` ${styles.popEnd}` : ""}`} role="group" aria-label={label}>
            <div className={styles.popHead}>
              <span className={styles.popTitle}>{label}</span>
              {selectedCount > 0 && (
                <button type="button" className={styles.popClear} onClick={onClear}>
                  Clear
                </button>
              )}
            </div>
            <ul className={styles.options}>
              {options.map((o) => (
                <li key={o.key}>
                  <label className={styles.option}>
                    <input type="checkbox" className={styles.checkInput} checked={o.checked} onChange={o.toggle} />
                    <span className={styles.checkBox} aria-hidden="true">
                      <Icon name="check" size={13} strokeWidth={3} />
                    </span>
                    <span className={styles.optIcon} aria-hidden="true">
                      {o.visual}
                    </span>
                    <span className={styles.optText}>
                      {o.label}
                      {o.hint && <span className={styles.optHint}>{o.hint}</span>}
                    </span>
                    <span className={styles.optCount}>{o.count}</span>
                  </label>
                </li>
              ))}
            </ul>
            {note && <p className={styles.popNote}>{note}</p>}
            <button type="button" className={`btn primary ${styles.popDone}`} onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Rows ---------------- */

function AgentRow({ agent: a, open, onToggle }: { agent: Agent; open: boolean; onToggle: () => void }) {
  const panelId = useId();
  const lit = SIGNALS.filter((s) => a.signals[s.key]);
  return (
    <li className={`${styles.item} has-brand`} style={brandVars(a) as React.CSSProperties}>
      <button
        type="button"
        className={`${styles.row} ${styles.grid}${open ? ` ${styles.rowOpen}` : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className={`${styles.colAgent} ${styles.cellAgent}`}>
          <LogoTile agent={a} />
          <span className={styles.nameBlock}>
            <span className={styles.nameLine}>
              <span className={styles.name}>{a.name}</span>
              {a.variants && <span className={styles.regions}>{a.count} regions</span>}
            </span>
            <span className={styles.provider}>{a.provider === "Unknown" ? "Unnamed operator" : a.provider}</span>
          </span>
        </span>
        <span className={`${styles.colDesc} ${styles.cellDesc}`}>{a.description}</span>
        <span className={`${styles.colType} ${styles.cellFlex}`}>
          <TypeLabel type={a.type} />
        </span>
        <span className={`${styles.colMethod} ${styles.cellFlex}`}>
          <MethodPill method={a.method} />
        </span>
        <span className={`${styles.colSig} ${styles.cellFlex}`}>
          <SignalSlots agent={a} />
        </span>
        <span className={`${styles.colComm} ${styles.cellComm}`}>
          <Meter rank={a.rank} />
          <span className={styles.commLabel}>{levelInfo(a.rank).label}</span>
          <span className="sr-only">commonality</span>
        </span>
        <span className={`${styles.colChev} ${styles.cellChev}`}>
          <Icon name="chevron" size={18} strokeWidth={2} className={`${styles.chev}${open ? ` ${styles.chevOpen}` : ""}`} />
        </span>
      </button>

      {open && (
        <div id={panelId} className={styles.panel}>
          <div className={styles.panelCol}>
            <h3 className={styles.panelHeading}>What it does</h3>
            <p className={styles.panelDesc}>{a.description}</p>
            {a.aliases.length > 0 && <p className={styles.panelMeta}>Also known as {a.aliases.join(", ")}</p>}
            {a.variants && <p className={styles.panelMeta}>Regions: {a.variants.join(", ")}</p>}
          </div>
          <div className={styles.panelColWide}>
            <h3 className={styles.panelHeading}>How Verisoul identifies it</h3>
            <ul className={styles.how}>
              {lit.map((s) => (
                <li key={s.key} className={styles.howItem}>
                  <span className={styles.howIcon}>
                    <Icon name={s.icon} size={16} />
                  </span>
                  <span className={styles.howText}>
                    <strong>{s.label}</strong>
                    {a.signalDetails[s.key] ?? s.meaning}
                  </span>
                </li>
              ))}
              {a.declaresUserAgent && (
                <li className={styles.howItem}>
                  <span className={`${styles.howIcon} ${styles.howIconMuted}`}>
                    <Icon name="idcard" size={16} />
                  </span>
                  <span className={styles.howText}>
                    <strong>User agent</strong>
                    Names itself in its user agent, which we never trust on its own
                  </span>
                </li>
              )}
            </ul>
          </div>
          <div className={styles.panelColApi}>
            <h3 className={styles.panelHeading}>In the Verisoul API</h3>
            <CodeChip id={a.id} />
            <p className={styles.methodNote}>
              <strong>{a.method}:</strong> {methodInfo(a.method).meaning}
            </p>
            <Link href={`/agents/${a.slug}`} className={styles.pageLink}>
              Open the {a.name} page
              <Icon name="arrow" size={16} strokeWidth={2} />
            </Link>
          </div>
        </div>
      )}
    </li>
  );
}

function CodeChip({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(id);
    } catch {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div className="code-chip">
      <code>
        <span className="key">&quot;identified_agent&quot;</span>: &quot;{id}&quot;
      </code>
      <button type="button" className="copy-btn" onClick={copy} aria-label="Copy the identified_agent value">
        <Icon name={copied ? "check" : "copy"} size={14} strokeWidth={2} />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/** Shown while the client directory loads (server render and Suspense fallback) */
export function DirectoryFallback() {
  return (
    <>
      <Hero activeType={null} />
      <div className="container">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`${styles.grid} ${styles.skelRow}`}>
            <span className={styles.colAgent} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span className={styles.skel} style={{ width: 36, height: 36, borderRadius: 9 }} />
              <span className={styles.skel} style={{ width: 140, height: 10 }} />
            </span>
            <span className={`${styles.colDesc} ${styles.skel}`} style={{ height: 10 }} />
          </div>
        ))}
      </div>
    </>
  );
}
