import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { LogoTile, MethodPill, Meter } from "@/components/AgentBits";
import { CopyButton } from "@/components/CopyButton";
import { AGENTS, SIGNALS, agentsFromProvider, brandVars, getAgent, levelInfo, typeInfo, type Agent, type SignalKey } from "@/lib/atlas";
import { SITE } from "@/lib/site";
import styles from "./agent.module.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return AGENTS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) return {};
  const description = `${sentence(agent.description)} ${howWeKnow(agent)}`;
  const path = `/agents/${agent.slug}`;
  return {
    title: agent.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      url: path,
      title: `${agent.name} | ${SITE.name}`,
      description,
    },
  };
}

export default async function AgentPage({ params }: Props) {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) notFound();

  const { name, provider } = agent;
  const type = typeInfo(agent.type);
  const level = levelInfo(agent.rank);
  const unknownProvider = provider === "Unknown";
  const openSource = provider === "Open source";
  const providerHref = `/?q=${encodeURIComponent(provider)}`;
  const related = unknownProvider ? [] : agentsFromProvider(agent, 6);
  const regions = agent.variants && agent.variants.length > 0 ? agent.variants : null;
  const isFamily = agent.id.includes("<region>");

  return (
    <main className={`container ${styles.page}`}>
      <Link href="/" className={styles.back}>
        <Icon name="arrowLeft" size={16} strokeWidth={2} />
        All agents
      </Link>

      <section className={styles.hero} aria-labelledby="agent-name">
        <span className={`has-brand ${styles.logo}`} style={brandVars(agent) as React.CSSProperties}>
          <LogoTile agent={agent} size={72} />
        </span>
        <div className={styles.heroText}>
          <h1 id="agent-name" className={styles.name}>
            {name}
          </h1>
          <p className={styles.runBy}>
            {unknownProvider ? (
              "Run by an unnamed operator"
            ) : openSource ? (
              <>
                An <Link href={providerHref}>open source</Link> tool anyone can run
              </>
            ) : (
              <>
                Run by <Link href={providerHref}>{provider}</Link>
              </>
            )}
          </p>
        </div>
      </section>

      <div className={styles.pills}>
        <Link href={`/?type=${type.slug}`} className={`pill outline ${styles.typePill}`}>
          <Icon name={type.icon} size={15} />
          <span className="sr-only">Type: </span>
          {agent.type}
        </Link>
        <MethodPill method={agent.method} outline />
        <span className={`pill ${styles.levelPill}`}>
          <Meter rank={agent.rank} />
          <span className="sr-only">How common: </span>
          {level.label}
        </span>
      </div>

      <p className={styles.description}>{agent.description}</p>

      <div className={styles.columns}>
        <div className={styles.main}>
          <section aria-labelledby="how">
            <h2 id="how" className={styles.h2}>
              How Verisoul identifies {name}
            </h2>
            <p className={styles.intro}>{methodIntro(agent)}</p>
            <ul className={styles.signals}>
              {SIGNALS.map((s) => {
                const used = agent.signals[s.key];
                return (
                  <li key={s.key} className={`${styles.signal}${used ? ` ${styles.used}` : ""}`}>
                    <div className={styles.signalTop}>
                      <span className={styles.signalIcon}>
                        <Icon name={s.icon} size={18} />
                      </span>
                      {used ? (
                        <span className={styles.status}>
                          <Icon name="check" size={14} strokeWidth={2.4} />
                          Used
                        </span>
                      ) : (
                        <span className={styles.status}>Not used</span>
                      )}
                    </div>
                    <div>
                      <h3 className={styles.signalName}>{s.label}</h3>
                      <p className={styles.signalDetail}>{used ? agent.signalDetails[s.key] ?? s.meaning : "Not needed to identify it"}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            {agent.declaresUserAgent && (
              <p className={styles.uaNote}>
                <Icon name="idcard" size={16} />
                Also names itself in its user agent
              </p>
            )}
          </section>

          <section aria-labelledby="often">
            <h2 id="often" className={styles.h2}>
              {"How often you'll see it"}
            </h2>
            <div className={styles.often}>
              <Meter rank={agent.rank} variant="big" />
              <div className={styles.oftenText}>
                <p className={styles.levelLabel}>{level.label}</p>
                <p className={styles.levelNote}>{agent.evidence ?? level.meaning}</p>
              </div>
            </div>
          </section>

          {regions && (
            <section aria-labelledby="regions">
              <h2 id="regions" className={styles.h2}>
                Regions
              </h2>
              <p className={styles.intro}>
                {`${name} runs in ${regions.length} regions. Each region shows up as its own agent with its own identified_agent value.`}
              </p>
              <ul className={styles.regions}>
                {regions.map((r) => (
                  <li key={r} className={styles.region}>
                    <span className={styles.regionName}>{r}</span>
                    {isFamily && <code className={styles.regionId}>{regionId(agent.id, r)}</code>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {related.length > 0 && (
            <section aria-labelledby="more">
              <h2 id="more" className={styles.h2}>
                {openSource ? "More open source tools" : `More from ${provider}`}
              </h2>
              <ul className={styles.rows}>
                {related.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/agents/${a.slug}`} className={styles.row}>
                      <span className={styles.rowText}>
                        <span className={styles.rowName}>{a.name}</span>
                        <span className={styles.rowDesc}>{a.description}</span>
                      </span>
                      <span className={styles.rowMethod}>
                        <MethodPill method={a.method} />
                      </span>
                      <span className={styles.rowLevel}>
                        <Meter rank={a.rank} />
                        <span className="sr-only">How common: </span>
                        {levelInfo(a.rank).label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className={styles.aside} aria-label={`More about ${name}`}>
          <section className={styles.apiCard} aria-labelledby="api">
            <h2 id="api" className={styles.cardTitle}>
              In the Verisoul API
            </h2>
            <p className={styles.apiLead}>
              {isFamily
                ? `Every session Verisoul identifies as ${name} carries this value, with the region filled in`
                : `Every session Verisoul identifies as ${name} carries this value`}
            </p>
            <div className={`code-chip ${styles.chip}`}>
              <code>
                <span className="key">{'"identified_agent"'}</span>: {`"${agent.id}"`}
              </code>
              <CopyButton value={agent.id} what="the identified_agent value" />
            </div>
            <a href={SITE.links.api} className={styles.docs}>
              Read the docs
              <Icon name="arrow" size={16} strokeWidth={2} />
            </a>
          </section>

          <section className={styles.card} aria-labelledby="lookalikes">
            <h2 id="lookalikes" className={styles.cardTitle}>
              Look-alikes
            </h2>
            <p className={styles.cardText}>{lookAlikes(agent)}</p>
          </section>

          {agent.aliases.length > 0 && (
            <section className={styles.card} aria-labelledby="aka">
              <h2 id="aka" className={styles.cardTitle}>
                Also known as
              </h2>
              <p className={styles.cardText}>{agent.aliases.join(", ")}</p>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}

/* ---------- Copy ---------- */

function methodIntro(agent: Agent): string {
  const { name } = agent;
  switch (agent.method) {
    case "Signed":
      return `${name} signs its requests, so we verify who it is cryptographically, then check the rest of the session.`;
    case "Self-declared":
      return agent.declaresUserAgent
        ? `${name} names itself in its user agent. Anyone can copy that, so we only label a session ${name} when the other signals check out too.`
        : `${name} identifies itself through its own markers in the browser. Those can be faked, so we only label a session ${name} when the other signals check out too.`;
    case "Inferred":
      return `${name} doesn't announce itself. We recognize it from a combination of signals that together point to one agent.`;
  }
}

function lookAlikes(agent: Agent): string {
  const { name, provider } = agent;
  switch (agent.method) {
    case "Signed": {
      const owner = provider === "Unknown" ? "its operator's" : possessive(provider);
      return `Signatures can't be copied. A bot pretending to be ${name} without ${owner} signing keys won't be labeled ${name}.`;
    }
    case "Self-declared":
      return agent.declaresUserAgent
        ? `A bot that copies ${possessive(name)} user agent from somewhere else won't be labeled ${name}, because the rest of the signals won't match.`
        : `A bot that fakes one of ${possessive(name)} markers won't be labeled ${name}, because the rest of the signals won't match.`;
    case "Inferred":
      return `We only label a session ${name} when several signals agree, so one matching trait isn't enough.`;
  }
}

/** One sentence for the meta description on how Verisoul identifies the agent */
function howWeKnow(agent: Agent): string {
  const used = (["network", "device", "behavior"] as SignalKey[]).filter((k) => agent.signals[k]);
  const list = joinWords(used.map((k) => SIGNALS.find((s) => s.key === k)!.label.toLowerCase()));
  switch (agent.method) {
    case "Signed":
      return "Verisoul verifies it cryptographically from its signed requests.";
    case "Self-declared":
      if (!list) return "Verisoul confirms it with more than its user agent.";
      return agent.declaresUserAgent
        ? `Verisoul confirms its user agent with ${list} signals.`
        : `Verisoul identifies it from ${list} signals.`;
    case "Inferred":
      return list ? `Verisoul recognizes it from a combination of ${list} signals.` : "Verisoul recognizes it from a combination of signals.";
  }
}

function possessive(word: string): string {
  return word.endsWith("s") ? `${word}'` : `${word}'s`;
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

function sentence(text: string): string {
  const t = text.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/** amazon_bedrock_agentcore_browser_<region> + "US East 1" -> amazon_bedrock_agentcore_browser_us_east_1 */
function regionId(id: string, region: string): string {
  return id.replace("<region>", region.toLowerCase().replace(/[^a-z0-9]+/g, "_"));
}
