/** Helpers that keep titles and descriptions inside what search results show */

const MAX_TITLE = 60;
const MAX_DESC = 158;

/** The first candidate that fits in a search result title, else the shortest one */
export function fitTitle(candidates: string[]): string {
  return candidates.find((c) => c.length <= MAX_TITLE) ?? [...candidates].sort((a, b) => a.length - b.length)[0];
}

/** Trim a description to whole words so it isn't cut off mid-sentence in results */
export function fitDescription(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= MAX_DESC) return t;
  const sentences = t.match(/[^.!?]+[.!?]+/g) ?? [t];
  let out = "";
  for (const s of sentences) {
    if ((out + s).trim().length > MAX_DESC) break;
    out += s;
  }
  if (out.trim().length >= 70) return out.trim();
  const cut = t.slice(0, MAX_DESC - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/** "An AI crawler run by X" -> "Name is an AI crawler run by X", so similar agents get distinct descriptions */
export function namedDescription(name: string, description: string): string {
  const d = description.trim().replace(/\.$/, "");
  if (/^(a|an|the)\s/i.test(d)) return `${name} is ${d.charAt(0).toLowerCase()}${d.slice(1)}.`;
  return `${name}: ${d}.`;
}
