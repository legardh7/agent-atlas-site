import { AGENTS, TOTAL_AGENTS, UPDATED, levelInfo } from "@/lib/robodex";
import { SITE } from "@/lib/site";

/** Built once at deploy time and served as a static file */
export const dynamic = "force-static";

/**
 * Public JSON feed of the directory. Only public fields go out here: no internal notes,
 * no ordering or display hints.
 *
 * `count` is the number of agents (489). The `agents` list has one row fewer per regional
 * variant, because a family such as Amazon Bedrock AgentCore Browser is one row with its
 * regions listed in `variants`.
 */
export function GET() {
  const base = SITE.url.replace(/\/+$/, "");
  const agents = AGENTS.map((a) => ({
    slug: a.slug,
    id: a.id,
    name: a.name,
    description: a.description,
    aliases: a.aliases,
    provider: a.provider,
    type: a.type,
    method: a.method,
    commonality: levelInfo(a.rank).label,
    signals: a.signals,
    signalDetails: a.signalDetails,
    declaresUserAgent: a.declaresUserAgent,
    variants: a.variants,
    url: `${base}/agents/${a.slug}`,
  }));

  return Response.json(
    { updated: UPDATED, count: TOTAL_AGENTS, agents },
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}
