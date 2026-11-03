import raw from "@/data/agents.json";
import overrides from "@/data/overrides.json";
import type { IconName } from "./icons";

export type AgentType = "AI agent" | "AI assistant" | "AI crawler" | "Crawler" | "Headless automation" | "Other";
export type Method = "Signed" | "Self-declared" | "Inferred";
export type SignalKey = "cryptographic" | "network" | "device" | "behavior";
/** 1 = Very common ... 4 = Very uncommon; 5 = Growing (new and rising, set in overrides.json) */
export type Rank = 1 | 2 | 3 | 4 | 5;

export interface Agent {
  slug: string;
  /** The exact identified_agent value the Verisoul API returns */
  id: string;
  name: string;
  description: string;
  aliases: string[];
  provider: string;
  providerDomain: string | null;
  /** Key into LOGOS, or null when the agent shows a monogram tile */
  logo: string | null;
  monogram: string | null;
  type: AgentType;
  method: Method;
  /** 1 = Very common ... 4 = Very uncommon */
  rank: Rank;
  signals: Record<SignalKey, boolean>;
  signalDetails: Partial<Record<SignalKey, string>>;
  declaresUserAgent: boolean;
  /** Regional variants when one row stands for a family of agents */
  variants: string[] | null;
  /** How many agents this row stands for (9 for the Bedrock family, else 1) */
  count: number;
  /** Public evidence for the commonality rating, when there is any */
  evidence: string | null;
  /** Default order: most common first */
  order: number;
}

export interface Logo {
  /** Path of the full-color SVG under /public */
  src: string;
  /** True for black or near-black marks */
  dark: boolean;
}

interface AtlasData {
  updated: string;
  counts: {
    agents: number;
    method: Record<Method, number>;
    rank: Record<"1" | "2" | "3" | "4" | "5", number>;
    type: Record<AgentType, number>;
    signals: Record<SignalKey, number>;
  };
  logos: Record<string, Logo>;
  agents: Agent[];
}

const data = raw as unknown as AtlasData;

/**
 * Signals per agent: set by the detection method, plus device for headless automation and for any
 * agent that names itself (the user agent is part of the device signal).
 */
const METHOD_SIGNALS: Record<Method, SignalKey[]> = {
  Signed: ["cryptographic", "behavior"],
  "Self-declared": ["network", "behavior"],
  Inferred: ["network", "device", "behavior"],
};

/** Plain wording for a signal when the data has no agent-specific detail */
function defaultDetail(a: Agent, key: SignalKey): string {
  switch (key) {
    case "cryptographic":
      return "A Web Bot Auth signature on its requests, verified against the operator's published keys";
    case "network":
      return a.method === "Inferred"
        ? "Where the traffic comes from, such as the IP address and hosting network, matches what we have seen from it"
        : "Where the traffic comes from, such as the IP address and hosting network, matches the operator";
    case "device":
      if (a.declaresUserAgent) return `Names itself as ${a.name} in its user agent, which we check against the rest of the session`;
      if (a.method === "Self-declared") return `Leaves its own ${a.name} markers in the browser, which we check against the rest of the session`;
      return "The browser and device show signs of automation tools";
    case "behavior":
      return a.method === "Signed"
        ? "How the session clicks, types, moves and navigates, checked after the signature is verified"
        : "How the session clicks, types, moves and navigates matches an automated agent";
  }
}

const GROWING = new Set<string>(overrides.growing);

function normalize(a: Agent): Agent {
  const on = new Set<SignalKey>(METHOD_SIGNALS[a.method]);
  if (a.type === "Headless automation") on.add("device");
  // Device covers the browser and device, including the user agent: an agent that names itself there lights it
  if (a.declaresUserAgent || a.method === "Self-declared") on.add("device");
  // Signals that don't apply to this agent, e.g. network for an agent that routes through the user's own IP
  for (const k of ((overrides as { signalsOff?: Record<string, SignalKey[]> }).signalsOff?.[a.slug] ?? [])) on.delete(k);
  const keys: SignalKey[] = ["cryptographic", "network", "device", "behavior"];
  const signals = Object.fromEntries(keys.map((k) => [k, on.has(k)])) as Record<SignalKey, boolean>;
  const signalDetails: Partial<Record<SignalKey, string>> = {};
  for (const k of keys) if (on.has(k)) signalDetails[k] = a.signalDetails[k] ?? defaultDetail(a, k);
  const extraNames = (overrides.aliases as Record<string, string[]>)[a.slug] ?? [];
  const aliases = [...a.aliases, ...extraNames.filter((n) => !a.aliases.includes(n))];
  return { ...a, aliases, signals, signalDetails, rank: GROWING.has(a.slug) ? 5 : a.rank };
}

const extra = (overrides.extraAgents as unknown as Omit<Agent, "order">[]).filter((x) => !data.agents.some((a) => a.slug === x.slug));

export const AGENTS: Agent[] = [...data.agents, ...extra.map((x, i) => ({ ...x, order: data.agents.length + i }) as Agent)].map(normalize);
export const LOGOS: Record<string, Logo> = data.logos;
export const UPDATED = "November 2026";

const sum = (f: (a: Agent) => boolean) => AGENTS.reduce((n, a) => n + (f(a) ? a.count : 0), 0);
export const COUNTS: AtlasData["counts"] = {
  agents: sum(() => true),
  method: { Signed: sum((a) => a.method === "Signed"), "Self-declared": sum((a) => a.method === "Self-declared"), Inferred: sum((a) => a.method === "Inferred") },
  rank: { "1": sum((a) => a.rank === 1), "2": sum((a) => a.rank === 2), "3": sum((a) => a.rank === 3), "4": sum((a) => a.rank === 4), "5": sum((a) => a.rank === 5) },
  type: {
    "AI agent": sum((a) => a.type === "AI agent"),
    "AI assistant": sum((a) => a.type === "AI assistant"),
    "AI crawler": sum((a) => a.type === "AI crawler"),
    Crawler: sum((a) => a.type === "Crawler"),
    "Headless automation": sum((a) => a.type === "Headless automation"),
    Other: sum((a) => a.type === "Other"),
  },
  signals: { cryptographic: sum((a) => a.signals.cryptographic), network: sum((a) => a.signals.network), device: sum((a) => a.signals.device), behavior: sum((a) => a.signals.behavior) },
};
export const TOTAL_AGENTS = COUNTS.agents;

/** The API's snake_case values */
const API_TYPE: Record<AgentType, string> = {
  "AI agent": "ai_agent",
  "AI assistant": "ai_assistant",
  "AI crawler": "ai_crawler",
  Crawler: "crawler",
  "Headless automation": "headless_automation",
  Other: "other",
};
const API_METHOD: Record<Method, string> = { Signed: "signed", "Self-declared": "self_declared", Inferred: "inferred" };
const API_SIGNAL: Record<SignalKey, string> = { cryptographic: "cryptographic", network: "network", device: "device", behavior: "behavioral" };

/**
 * detection_signals exactly as the API sets them (buildAgent in packages/predict): by detection method,
 * plus device for headless automation. The API also adds device per session when it sees automation
 * tools, which the page notes under the block. The signal cards on the page can show more (device for
 * agents that name themselves); the block always mirrors the API.
 */
const API_METHOD_SIGNALS: Record<Method, SignalKey[]> = {
  Signed: ["cryptographic", "behavior"],
  "Self-declared": ["network", "behavior"],
  Inferred: ["network", "device", "behavior"],
};
function apiSignals(a: Agent): SignalKey[] {
  const on = new Set<SignalKey>(API_METHOD_SIGNALS[a.method]);
  if (a.type === "Headless automation") on.add("device");
  return (["cryptographic", "network", "device", "behavior"] as SignalKey[]).filter((k) => on.has(k));
}

/** The agent block the Verisoul API returns for a session identified as this agent */
export function apiAgent(a: Agent) {
  return {
    id: a.id,
    name: a.name,
    provider: a.provider,
    type: API_TYPE[a.type],
    detection_method: API_METHOD[a.method],
    detection_signals: apiSignals(a).map((k) => API_SIGNAL[k]),
  };
}

/** apiAgent as the "agent": {...} snippet shown on the site, one value per line so it never wraps mid-array */
export function apiAgentJson(a: Agent): string {
  return `"agent": ${JSON.stringify(apiAgent(a), null, 2)}`;
}


export const TYPES: { key: AgentType; slug: string; icon: IconName; meaning: string }[] = [
  { key: "AI agent", slug: "ai-agent", icon: "bot", meaning: "Carries out tasks in a browser or on a computer" },
  { key: "AI assistant", slug: "ai-assistant", icon: "assistant", meaning: "Fetches or browses pages for a person who asked" },
  { key: "AI crawler", slug: "ai-crawler", icon: "sparkles", meaning: "Collects pages for AI training or AI search" },
  { key: "Crawler", slug: "crawler", icon: "globe", meaning: "Indexes or checks pages for search, SEO, ads and site tools" },
  { key: "Headless automation", slug: "headless-automation", icon: "terminal", meaning: "Scripted or hosted browsers" },
  { key: "Other", slug: "other", icon: "blocks", meaning: "Link previews, read-aloud, safety scanners and uptime monitors" },
];

export const METHODS: { key: Method; slug: string; icon: IconName; meaning: string }[] = [
  { key: "Signed", slug: "signed", icon: "signed", meaning: "The agent signs its requests, so its identity is verified cryptographically." },
  {
    key: "Self-declared",
    slug: "self-declared",
    icon: "idcard",
    meaning: "The agent names itself in its user agent, and Verisoul confirms it with network, device or behavioral data. A user agent alone is never enough.",
  },
  {
    key: "Inferred",
    slug: "inferred",
    icon: "inferred",
    meaning: "Fingerprinted from clear, repeatable patterns. No single signal proves it, but together they point to one agent.",
  },
];

export const SIGNALS: { key: SignalKey; label: string; icon: IconName; meaning: string }[] = [
  { key: "cryptographic", label: "Cryptographic", icon: "key", meaning: "A signed request verified cryptographically" },
  { key: "network", label: "Network", icon: "wifi", meaning: "IP, network and hosting checks" },
  { key: "device", label: "Device", icon: "device", meaning: "Browser and device fingerprint markers" },
  { key: "behavior", label: "Behavioral", icon: "behavior", meaning: "How the session clicks, types, moves and navigates" },
];

export const LEVELS: { rank: Rank; label: string; slug: string; meaning: string }[] = [
  { rank: 1, label: "Very common", slug: "very-common", meaning: "One of the biggest sources of automated traffic on the web. Expect it on almost every site" },
  { rank: 2, label: "Common", slug: "common", meaning: "Shows up regularly on most sites" },
  { rank: 3, label: "Uncommon", slug: "uncommon", meaning: "Seen on some sites, in small volumes" },
  { rank: 5, label: "Growing", slug: "growing", meaning: "New, and showing up on more sites every week" },
  { rank: 4, label: "Very uncommon", slug: "very-uncommon", meaning: "Rare, brand new, or not seen on Verisoul traffic yet" },
];

export const typeInfo = (t: AgentType) => TYPES.find((x) => x.key === t)!;
export const methodInfo = (m: Method) => METHODS.find((x) => x.key === m)!;
export const levelInfo = (r: Rank) => LEVELS.find((l) => l.rank === r)!;

export function getAgent(slug: string): Agent | undefined {
  return AGENTS.find((a) => a.slug === slug);
}

export function agentsFromProvider(agent: Agent, limit = 6): Agent[] {
  if (agent.provider === "Unknown") return [];
  return AGENTS.filter((a) => a.provider === agent.provider && a.slug !== agent.slug).slice(0, limit);
}

/** Lowercased text the directory search matches against */
export function searchText(a: Agent): string {
  return [a.name, a.provider, a.id, a.description, ...a.aliases, ...(a.variants ?? [])].join(" ").toLowerCase();
}

/** Website icon for agents whose company has no logo file (falls back to the monogram) */
export function siteIcon(agent: Agent): string | null {
  return agent.providerDomain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(agent.providerDomain)}&sz=64` : null;
}

/** Plural for headings, e.g. "AI crawlers", "headless automation tools" */
export function typePluralLower(type: AgentType): string {
  return (
    {
      "AI agent": "AI agents",
      "AI assistant": "AI assistants",
      "AI crawler": "AI crawlers",
      Crawler: "crawlers",
      "Headless automation": "headless automation tools",
      Other: "automated agents",
    } as Record<AgentType, string>
  )[type];
}

/**
 * Neighbors of the same type in directory order (wrapping around), skipping ones already
 * listed. Gives every page links to a few others so none is reachable only from the index.
 */
export function similarAgents(agent: Agent, exclude: Agent[] = [], limit = 6): Agent[] {
  const list = AGENTS.filter((a) => a.type === agent.type).sort((a, b) => a.order - b.order);
  const skip = new Set([agent.slug, ...exclude.map((a) => a.slug)]);
  const i = list.findIndex((a) => a.slug === agent.slug);
  const out: Agent[] = [];
  for (let k = 1; k < list.length && out.length < limit; k++) {
    for (const a of [list[(i + k) % list.length], list[(i - k + list.length) % list.length]]) {
      if (out.length < limit && !skip.has(a.slug)) {
        skip.add(a.slug);
        out.push(a);
      }
    }
  }
  return out;
}
