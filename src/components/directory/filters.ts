import {
  AGENTS,
  LEVELS,
  METHODS,
  SIGNALS,
  TYPES,
  levelInfo,
  methodInfo,
  searchText,
  typeInfo,
  type Agent,
  type AgentType,
  type Method,
  type Rank,
  type SignalKey,
} from "@/lib/atlas";

export type SortKey = "common" | "az" | "provider";
export type MultiGroup = "commonality" | "method" | "signal";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "common", label: "Most common" },
  { key: "az", label: "A to Z" },
  { key: "provider", label: "Provider" },
];

/** Everything the directory filters on. All of it lives in the URL query */
export interface Filters {
  q: string;
  type: AgentType | null;
  commonality: Rank[];
  method: Method[];
  signal: SignalKey[];
  sort: SortKey;
}

export interface DirectoryActions {
  setQuery(q: string, immediate?: boolean): void;
  setType(type: AgentType | null): void;
  toggleCommonality(rank: Rank): void;
  toggleMethod(method: Method): void;
  toggleSignal(signal: SignalKey): void;
  clearGroup(group: MultiGroup): void;
  setSort(sort: SortKey): void;
  clearAll(): void;
}

export const EMPTY_FILTERS: Filters = { q: "", type: null, commonality: [], method: [], signal: [], sort: "common" };

export const RANK_ORDER: Rank[] = LEVELS.map((l) => l.rank);
export const METHOD_ORDER: Method[] = METHODS.map((m) => m.key);
export const SIGNAL_ORDER: SignalKey[] = SIGNALS.map((s) => s.key);

interface ParamsLike {
  get(name: string): string | null;
  getAll(name: string): string[];
}

/** Accepts both `?method=signed,inferred` and `?method=signed&method=inferred` */
function readList(params: ParamsLike, key: string): Set<string> {
  return new Set(
    params
      .getAll(key)
      .flatMap((v) => v.split(","))
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function parseFilters(params: ParamsLike): Filters {
  const typeSlug = (params.get("type") ?? "").trim().toLowerCase();
  const comm = readList(params, "commonality");
  const meth = readList(params, "method");
  const sig = readList(params, "signal");
  const sort = (params.get("sort") ?? "").trim().toLowerCase();
  return {
    q: params.get("q") ?? "",
    type: TYPES.find((t) => t.slug === typeSlug)?.key ?? null,
    commonality: LEVELS.filter((l) => comm.has(l.slug)).map((l) => l.rank),
    method: METHODS.filter((m) => meth.has(m.slug)).map((m) => m.key),
    signal: SIGNALS.filter((s) => sig.has(s.key)).map((s) => s.key),
    sort: sort === "az" || sort === "provider" ? sort : "common",
  };
}

/** Stable, readable query string (no leading "?"). Equal filters always give the same string */
export function serializeFilters(f: Filters): string {
  const parts: string[] = [];
  const q = f.q.trim();
  if (q) parts.push(`q=${encodeURIComponent(q)}`);
  if (f.type) parts.push(`type=${typeInfo(f.type).slug}`);
  if (f.commonality.length) {
    parts.push(`commonality=${RANK_ORDER.filter((r) => f.commonality.includes(r)).map((r) => levelInfo(r).slug).join(",")}`);
  }
  if (f.method.length) {
    parts.push(`method=${METHOD_ORDER.filter((m) => f.method.includes(m)).map((m) => methodInfo(m).slug).join(",")}`);
  }
  if (f.signal.length) parts.push(`signal=${SIGNAL_ORDER.filter((s) => f.signal.includes(s)).join(",")}`);
  if (f.sort !== "common") parts.push(`sort=${f.sort}`);
  return parts.join("&");
}

/** Adds or removes a value, keeping the canonical order */
export function toggleIn<T>(order: readonly T[], current: readonly T[], value: T): T[] {
  const set = new Set(current);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return order.filter((v) => set.has(v));
}

export function hasActiveFilters(f: Filters): boolean {
  return Boolean(f.q.trim() || f.type || f.commonality.length || f.method.length || f.signal.length);
}

const SEARCH = new Map<string, string>(AGENTS.map((a) => [a.slug, searchText(a)]));

const byName = (a: Agent, b: Agent) => a.name.localeCompare(b.name, "en", { sensitivity: "base", numeric: true }) || a.order - b.order;

const byProvider = (a: Agent, b: Agent) => {
  const ua = a.provider === "Unknown";
  const ub = b.provider === "Unknown";
  if (ua !== ub) return ua ? 1 : -1;
  return a.provider.localeCompare(b.provider, "en", { sensitivity: "base" }) || a.order - b.order;
};

/**
 * AND across groups. Within a group any selected value matches, except signals,
 * where an agent must use every selected signal. Search matches every word.
 */
export function filterAgents(f: Filters): Agent[] {
  const words = f.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const out = AGENTS.filter((a) => {
    if (f.type && a.type !== f.type) return false;
    if (f.commonality.length && !f.commonality.includes(a.rank)) return false;
    if (f.method.length && !f.method.includes(a.method)) return false;
    if (f.signal.length && !f.signal.every((s) => a.signals[s])) return false;
    if (words.length) {
      const text = SEARCH.get(a.slug) ?? "";
      if (!words.every((w) => text.includes(w))) return false;
    }
    return true;
  });
  if (f.sort === "az") return out.sort(byName);
  if (f.sort === "provider") return out.sort(byProvider);
  return out;
}

/** Agent count for a set of rows (a family row stands for several agents) */
export function agentCount(rows: Agent[]): number {
  return rows.reduce((sum, a) => sum + a.count, 0);
}
