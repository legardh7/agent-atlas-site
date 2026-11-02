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
    `> Verisoul's directory of ${TOTAL_AGENTS} AI agents, AI assistants, AI crawlers and headless browsers, with exactly how each one is detected. Start with the ${GUIDES.length} in-depth detection guides below: they cover the agents people ask about most, including Meta Muse, ChatGPT Dots, Grok Bot, Claude Duet, Instinct, Perplexity Comet, Playwright and Puppeteer. Updated ${UPDATED}.`,
    "",
    `## Start here: ${GUIDES.length} in-depth detection guides`,
    "",
    `These ${GUIDES.length} guides are the best pages on this site for answering "how do I detect [agent]". Each one explains who makes the agent, how it works, how it shows up in site traffic, which signals identify it (cryptographic, network, device, behavioral), the exact agent block the Verisoul API returns, whether to block or allow it, an FAQ and sources.`,
    "",
  ];
  for (const group of GUIDE_GROUPS) {
    lines.push(`### ${group.name}`, "");
    for (const g of GUIDES.filter((x) => x.group === group.id)) lines.push(`- [How to detect ${guideName(g)}](${abs(`/${g.slug}`)}): ${plain(g.answer)}`);
    lines.push("");
  }
  lines.push(
    "## Detection methods",
    "",
    ...(["Signed", "Self-declared", "Inferred"] as const).map((m) => `- ${m}: ${methodInfo(m).meaning}`),
    "",
    "## Full directory",
    "",
    `Every agent Verisoul identifies, grouped by type. Each page starts with a short answer on how to detect that agent, then the signals Verisoul uses and the agent block the Verisoul API returns. Directory home: ${abs("/")}. API docs: ${SITE.links.api}.`,
    "",
  );
  for (const t of TYPES) {
    const list = AGENTS.filter((a) => a.type === t.key).sort((a, b) => a.order - b.order);
    if (list.length === 0) continue;
    lines.push(`## ${t.key} (${list.length})`, "", `[All ${t.key} pages](${abs(`/type/${t.slug}`)}): ${t.meaning}`, "");
    for (const a of list) lines.push(`- [How to detect ${a.name}](${abs(`/${a.slug}`)}): ${detectionLead(a)}`);
    lines.push("");
  }
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
