import raw from "@/data/agents.json";
import type { IconName } from "./icons";

export type AgentType = "AI agent" | "AI assistant" | "AI crawler" | "Crawler" | "Headless automation" | "Other";
export type Method = "Signed" | "Self-declared" | "Inferred";
export type SignalKey = "cryptographic" | "network" | "device" | "behavior";
export type Rank = 1 | 2 | 3 | 4;

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
    rank: Record<"1" | "2" | "3" | "4", number>;
    type: Record<AgentType, number>;
    signals: Record<SignalKey, number>;
  };
  logos: Record<string, Logo>;
  agents: Agent[];
}

const data = raw as unknown as AtlasData;

export const AGENTS: Agent[] = data.agents;
export const LOGOS: Record<string, Logo> = data.logos;
export const COUNTS = data.counts;
export const UPDATED = data.updated;
export const TOTAL_AGENTS = data.counts.agents;

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
  { key: "behavior", label: "Behavior", icon: "behavior", meaning: "How the session clicks, types, moves and navigates" },
];

export const LEVELS: { rank: Rank; label: string; slug: string; meaning: string }[] = [
  { rank: 1, label: "Very common", slug: "very-common", meaning: "One of the biggest sources of automated traffic on the web. Expect it on almost every site" },
  { rank: 2, label: "Common", slug: "common", meaning: "Shows up regularly on most sites" },
  { rank: 3, label: "Uncommon", slug: "uncommon", meaning: "Seen on some sites, in small volumes" },
  { rank: 4, label: "Very uncommon", slug: "very-uncommon", meaning: "Rare, brand new, or not seen on Verisoul traffic yet" },
];

export const typeInfo = (t: AgentType) => TYPES.find((x) => x.key === t)!;
export const methodInfo = (m: Method) => METHODS.find((x) => x.key === m)!;
export const levelInfo = (r: Rank) => LEVELS[r - 1];

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
