import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { LogoTile, MethodPill, Meter } from "@/components/AgentBits";
import { ApiBlock } from "@/components/ApiBlock";
import { AGENTS, SIGNALS, apiAgent, agentsFromProvider, getAgent, similarAgents, typePluralLower, levelInfo, methodInfo, typeInfo, type Agent, type SignalKey } from "@/lib/atlas";
import { SITE, abs } from "@/lib/site";
import { fitDescription, fitTitle, namedDescription } from "@/lib/seo";
import { canBeFaked, howCommon, howToDetect, identifiesItself, lookAlikes, whatItIs } from "@/lib/detection";
import { STANDALONE_GUIDES, getGuide, guideName } from "@/lib/guides";
import { GuidePage, plain } from "./GuidePage";
import styles from "./agent.module.css";

type Props = { params: Promise<{ slug: string }> };

/** Unknown slugs still 404 (notFound below). Pages render on request when the host has no prerender cache, as on Webflow Cloud */

export function generateStaticParams() {
  return [...AGENTS.map((a) => ({ slug: a.slug })), ...STANDALONE_GUIDES.map((g) => ({ slug: g.slug }))];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgent(slug);
  const guide = getGuide(slug);
  if (guide) {
    const name = guideName(guide);
    const url = abs(`/${guide.slug}`);
    const description = fitDescription(plain(guide.dek));
    const image = guide.shots[0] ? `${SITE.url}${guide.shots[0].src}` : undefined;
    return {
      title: { absolute: fitTitle([`How to detect ${name} | ${SITE.name}`, `How to detect ${name} | Verisoul`, `How to detect ${name}`]) },
      description,
      alternates: { canonical: url },
      openGraph: {
        type: "article",
        siteName: SITE.name,
        url,
        title: `How to detect ${name} | ${SITE.name}`,
        description,
        ...(image ? { images: [{ url: image }] } : {}),
      },
    };
  }
  if (!agent) return {};
  const description = fitDescription(`${namedDescription(agent.name, agent.description)} ${howWeKnow(agent)}`);
  const url = abs(`/${agent.slug}`);
  return {
    title: {
      absolute: fitTitle([
        `${agent.name}: what it is and how to detect it | Verisoul`,
        `${agent.name}: what it is and how to detect it`,
        `How to detect ${agent.name} | Verisoul`,
        `How to detect ${agent.name}`,
      ]),
    },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      url,
      title: `How to detect ${agent.name} | ${SITE.name}`,
      description,
    },
  };
}

export default async function AgentPage({ params }: Props) {
  const { slug } = await params;
  const agent = getAgent(slug);
  const guide = getGuide(slug);
  if (guide) return <GuidePage guide={guide} agent={agent ?? null} />;
  if (!agent) notFound();

  const { name, provider } = agent;
  const type = typeInfo(agent.type);
  const level = levelInfo(agent.rank);
  const unknownProvider = provider === "Unknown";
  const openSource = provider === "Open source";
  const providerHref = `/?q=${encodeURIComponent(provider)}`;
  const related = unknownProvider ? [] : agentsFromProvider(agent, 6);
  const similar = similarAgents(agent, related, 6);
  const regions = agent.variants && agent.variants.length > 0 ? agent.variants : null;
  const isFamily = agent.id.includes("<region>");
  const lead = howToDetect(agent);
  const what = whatItIs(agent);
  const usedSignals = SIGNALS.filter((s) => agent.signals[s.key]);
  const faq = [
    { q: `How do you detect ${name}?`, a: lead },
    { q: `What is ${name}?`, a: what },
    { q: `Does ${name} identify itself?`, a: identifiesItself(agent) },
    { q: `Can a bot pretend to be ${name}?`, a: canBeFaked(agent) },
    { q: `How common is ${name}?`, a: howCommon(agent) },
    {
      q: `What does the Verisoul API return for ${name}?`,
      a: `Every session Verisoul identifies as ${name} carries an agent block with id "${agent.id}", name, provider, type "${apiAgent(agent).type}", detection_method "${apiAgent(agent).detection_method}" and the detection_signals used (${apiAgent(agent).detection_signals.join(", ")}). Build rules on the id, type and detection method.`,
    },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Verisoul", item: SITE.links.home },
          { "@type": "ListItem", position: 2, name: "Agent Atlas", item: abs("/") },
          { "@type": "ListItem", position: 3, name, item: abs(`/${agent.slug}`) },
        ],
      },
    ],
  };

  return (
    <main className={`container ${styles.page}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/" className={styles.back}>
        <Icon name="arrowLeft" size={16} strokeWidth={2} />
        All agents
      </Link>

      <section className={styles.hero} aria-labelledby="agent-name">
        <span className={styles.logo}>
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
        <Link href={`/type/${type.slug}`} className={`pill outline ${styles.typePill}`}>
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

      <section className={styles.answer} id="how-to-detect" aria-labelledby="detect-heading">
        <h2 id="detect-heading" className={styles.answerTitle}>
          How to detect {name}
        </h2>
        <p className={styles.answerLead}>{lead}</p>
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>Detection method</dt>
            <dd>
              <MethodPill method={agent.method} outline />
              <span className={styles.factNote}>{methodInfo(agent.method).meaning}</span>
            </dd>
          </div>
          <div className={styles.fact}>
            <dt>Signals that identify it</dt>
            <dd>
              <ul className={styles.factList}>
                {usedSignals.map((s) => (
                  <li key={s.key}>
                    <span className={styles.factIcon} aria-hidden="true">
                      <Icon name={s.icon} size={16} />
                    </span>
                    <span>
                      <strong>{s.label}</strong>
                      <span className={styles.factDetail}>{agent.signalDetails[s.key] ?? s.meaning}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </section>

      <div className={styles.columns}>
        <div className={styles.main}>
          <section aria-labelledby="how">
            <h2 id="how" className={styles.h2}>
              Every signal Verisoul checks for {name}
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
                    <Link href={`/${a.slug}`} className={styles.row}>
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
          {similar.length > 0 && (
            <section aria-labelledby="similar">
              <h2 id="similar" className={styles.h2}>
                More {typePluralLower(agent.type)}
              </h2>
              <ul className={styles.rows}>
                {similar.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/${a.slug}`} className={styles.row}>
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
          <section aria-labelledby="faq">
            <h2 id="faq" className={styles.h2}>
              Questions about {name}
            </h2>
            <div className={styles.faq}>
              {faq.map((f) => (
                <div key={f.q} className={styles.faqItem}>
                  <h3 className={styles.faqQ}>{f.q}</h3>
                  <p className={styles.faqA}>{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.aside} aria-label={`More about ${name}`}>
          <section className={styles.apiCard} aria-labelledby="api">
            <h2 id="api" className={styles.cardTitle}>
              In the Verisoul API
            </h2>
            <p className={styles.apiLead}>
              {isFamily
                ? `Every session Verisoul identifies as ${name} carries this agent block, with the region filled in on the id`
                : `Every session Verisoul identifies as ${name} carries this agent block`}
            </p>
            <ApiBlock agent={agent} />
            {!apiAgent(agent).detection_signals.includes("device") && (
              <p className={styles.apiNote}>detection_signals also includes device when the session shows signs of automation tools.</p>
            )}
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
