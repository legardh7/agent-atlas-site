import { AGENTS, TOTAL_AGENTS, TYPES, UPDATED, methodInfo } from "@/lib/atlas";
import { SITE, abs } from "@/lib/site";
import { detectionLead } from "@/lib/detection";
import { GUIDES, GUIDE_GROUPS, guideName } from "@/lib/guides";

const plain = (t: string) => t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`/g, "");

export const dynamic = "force-static";

/** Plain-text map of the Atlas for AI assistants and answer engines (llms.txt format) */
export function GET() {
  const lines: string[] = [
    `# ${SITE.name}`,
    "",
    `> ${TOTAL_AGENTS} AI agents, AI crawlers, assistants and headless browsers Verisoul can identify, with exactly how each one is detected. Updated ${UPDATED}.`,
    "",
    "Each agent page starts with a short answer on how to detect that agent, then lists the signals Verisoul uses and the identified_agent value the Verisoul API returns.",
    "",
    "## Detection methods",
    "",
    ...(["Signed", "Self-declared", "Inferred"] as const).map((m) => `- ${m}: ${methodInfo(m).meaning}`),
    "",
    "## Detection guides",
    "",
    `In-depth guides to the ${GUIDES.length} agents, AI browsers, automation tools and crawlers people ask about most, with who makes each one, how it shows up on a site and how Verisoul detects it.`,
    "",
  ];
  for (const group of GUIDE_GROUPS) {
    lines.push(`### ${group.name}`, "");
    for (const g of GUIDES.filter((x) => x.group === group.id)) lines.push(`- [How to detect ${guideName(g)}](${abs(`/${g.slug}`)}): ${plain(g.answer)}`);
    lines.push("");
  }
  for (const t of TYPES) {
    const list = AGENTS.filter((a) => a.type === t.key).sort((a, b) => a.order - b.order);
    if (list.length === 0) continue;
    lines.push(`## ${t.key} (${list.length})`, "", `[All ${t.key} pages](${abs(`/type/${t.slug}`)}): ${t.meaning}`, "");
    for (const a of list) lines.push(`- [How to detect ${a.name}](${abs(`/${a.slug}`)}): ${detectionLead(a)}`);
    lines.push("");
  }
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
