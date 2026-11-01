import raw from "@/data/guides.json";
import { AGENTS, getAgent, type Agent, type Method, type SignalKey } from "./atlas";

/**
 * Detection guides: long-form "How to detect X" write-ups for the agents people ask about most.
 * A guide either sits on an existing Atlas page (same URL, richer page) or is its own Atlas page
 * for an agent, tool or crawler family that has no single entry (it links to the entries the API returns).
 */

export type Block =
  | { t: "p" | "h2" | "h3"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "flow"; steps: string[] }
  | { t: "code" | "chart" | "screenshot" | "video" };

export interface Standalone {
  name: string;
  provider: string;
  typeLabel: string;
  /** true: every session is named; "partial": only some setups; false: not named yet, flagged by bot score */
  named: boolean | "partial";
  method: Method | null;
  signals: SignalKey[];
  details: Partial<Record<SignalKey, string>>;
  /** Atlas slugs of the entries the API returns for it */
  members: string[];
}

export interface Guide {
  /** Name to show instead of the Atlas entry's, when people search for the product by another name */
  displayName?: string;
  /** Atlas slug of the page this guide is shown on */
  slug: string;
  /** The guide's own key */
  guide: string;
  order: number;
  group: string;
  groupName: string;
  dek: string;
  answer: string;
  body: Block[];
  faq: { q: string; a: string }[];
  sources: { title: string; url: string }[];
  shots: { src: string; alt: string; caption: string; tall: boolean }[];
  /** API id to highlight in the agent-share chart, when the guide has one */
  chart: string | null;
  logo: { src: string; full: boolean } | { atlas: string };
  /** Review notes: facts to check before publishing. Never rendered */
  flags: string[];
  /** null when the guide sits on an existing Atlas entry */
  standalone: Standalone | null;
}

interface GuideData {
  updated: string;
  share: { window: string; rows: [string, string, number][] };
  guides: Guide[];
}

const data = raw as unknown as GuideData;

export const GUIDES: Guide[] = [...data.guides].sort((a, b) => a.order - b.order);
export const GUIDES_UPDATED = data.updated;
export const AGENT_SHARE = data.share;

export const GUIDE_GROUPS: { id: string; name: string }[] = GUIDES.reduce<{ id: string; name: string }[]>((acc, g) => {
  if (!acc.some((x) => x.id === g.group)) acc.push({ id: g.group, name: g.groupName });
  return acc;
}, []);

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** Guides that are pages of their own (no Atlas entry with the same slug) */
export const STANDALONE_GUIDES = GUIDES.filter((g) => g.standalone && !AGENTS.some((a) => a.slug === g.slug));

/** The display name of the thing a guide covers */
export function guideName(g: Guide): string {
  return g.displayName ?? (g.standalone ? g.standalone.name : getAgent(g.slug)?.name ?? g.slug);
}

export function guideMembers(g: Guide): Agent[] {
  return (g.standalone?.members ?? []).map((s) => getAgent(s)).filter((a): a is Agent => Boolean(a));
}

/** Rough reading time for the byline */
export function readingMinutes(g: Guide): number {
  const words = [
    ...g.body.map((b) => ("text" in b ? b.text : "items" in b ? b.items.join(" ") : "rows" in b ? b.rows.flat().join(" ") : "")),
    ...g.faq.map((f) => `${f.q} ${f.a}`),
  ]
    .join(" ")
    .split(/\s+/).length;
  return Math.max(4, Math.round(words / 230));
}
