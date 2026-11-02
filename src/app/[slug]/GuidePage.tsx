import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { MethodPill, Meter } from "@/components/AgentBits";
import { ApiBlock } from "@/components/ApiBlock";
import { CopyButton } from "@/components/CopyButton";
import { GuideBody, headingId, inline } from "@/components/guide/GuideBody";
import { GuideLogo } from "@/components/guide/GuideLogo";
import {
  SIGNALS,
  agentsFromProvider,
  apiAgent,
  levelInfo,
  methodInfo,
  typeInfo,
  type Agent,
  type Method,
  type SignalKey,
} from "@/lib/atlas";
import { GUIDES, GUIDES_UPDATED, guideMembers, guideName, readingMinutes, type Guide } from "@/lib/guides";
import { lookAlikes } from "@/lib/detection";
import type { IconName } from "@/lib/icons";
import { SITE, abs } from "@/lib/site";
import styles from "./agent.module.css";
import g from "@/components/guide/guide.module.css";

const NOT_NAMED_NOTE =
  "It never names itself and isn't named in the API yet. Verisoul still flags the session as automated through its bot score.";
const PARTIAL_NOTE = " Verisoul names it only in some setups; other sessions are flagged through bot score.";

const STANDALONE_ICON: Record<string, IconName> = {
  "AI browser": "globe",
  "Browser extension": "blocks",
  "AI agent": "bot",
  "Open-source agent": "bot",
  "Agent framework": "terminal",
  "Model API": "terminal",
  "Automation library": "terminal",
  "AI crawlers": "sparkles",
};

/** "2026-11-01" -> "Nov 1, 2026" */
export function guideDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
  return `${month} ${d}, ${y}`;
}

/** Strip [text](url) and `code` marks for plain-text uses (meta tags, JSON-LD) */
export function plain(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`([^`]+)`/g, "$1");
}

/**
 * A detection guide page. `agent` is the Atlas entry when the guide sits on an existing agent page;
 * otherwise the guide is its own page and describes itself through guide.standalone.
 */
export function GuidePage({ guide, agent }: { guide: Guide; agent: Agent | null }) {
  const s = guide.standalone;
  const name = guide.displayName ?? (agent ? agent.name : s!.name);
  const provider = agent ? agent.provider : s!.provider;
  const openSource = provider === "Open source";
  const linkProvider = Boolean(agent) && provider !== "Unknown" && !openSource;
  const members = agent ? [] : guideMembers(guide);
  const related = agent && provider !== "Unknown" ? agentsFromProvider(agent, 6) : [];
  const regions = agent?.variants && agent.variants.length > 0 ? agent.variants : null;

  // Method and signals: the Atlas entry, or what the guide says for a page of its own
  const method: Method | null = agent ? agent.method : s!.named === false ? null : s!.method;
  const signalKeys: SignalKey[] = agent ? SIGNALS.filter((x) => agent.signals[x.key]).map((x) => x.key) : s!.signals;
  const details: Partial<Record<SignalKey, string>> = agent ? agent.signalDetails : s!.details;
  const methodNote = agent
    ? methodInfo(agent.method).meaning
    : method === null
      ? NOT_NAMED_NOTE
      : `${methodInfo(method).meaning}${s!.named === "partial" ? PARTIAL_NOTE : ""}`;

  // The API block: this agent, the first Atlas entry the API returns for it, or null until it is named
  const apiMember = !agent && s!.named !== false ? members[0] ?? null : null;
  const apiFor = agent ?? apiMember;
  const api: ReactNode = apiFor ? <ApiBlock agent={apiFor} /> : <NullApiBlock />;
  const apiLead = agent
    ? `Every session Verisoul identifies as ${name} carries this agent block${agent.name !== name ? `, named ${agent.name} in the API` : ""}`
    : apiMember
      ? `Sessions Verisoul can name come back as ${apiMember.name}`
      : "Verisoul flags these sessions through bot score, and the agent field stays empty until we name it";

  const faq = [...guide.faq];
  if (agent) {
    const a = apiAgent(agent);
    faq.push({
      q: `What does the Verisoul API return for ${name}?`,
      a: `Every session Verisoul identifies as ${name} carries an agent block with id "${a.id}", type "${a.type}", detection_method "${a.detection_method}" and the detection_signals used (${a.detection_signals.join(", ")}). Build rules on the id, type and detection method.`,
    });
  }

  const toc = guide.body.filter((b): b is { t: "h2"; text: string } => b.t === "h2");
  const url = abs(`/${guide.slug}`);
  const headline = `How to detect ${name}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline,
        description: plain(guide.dek),
        abstract: plain(guide.answer),
        datePublished: GUIDES_UPDATED,
        dateModified: GUIDES_UPDATED,
        author: { "@type": "Organization", name: "Verisoul Research", url: SITE.links.home },
        publisher: { "@type": "Organization", name: "Verisoul", url: SITE.links.home },
        mainEntityOfPage: url,
        url,
        about: name,
        ...(guide.shots[0] ? { image: `${SITE.url}${guide.shots[0].src}` } : {}),
        citation: guide.sources.map((x) => x.url),
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: plain(f.a) } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Verisoul", item: SITE.links.home },
          { "@type": "ListItem", position: 2, name: "Agent Atlas", item: abs("/") },
          { "@type": "ListItem", position: 3, name, item: url },
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
          <GuideLogo guide={guide} agent={agent} size={72} />
        </span>
        <div className={styles.heroText}>
          <h1 id="agent-name" className={styles.name}>
            {name}
          </h1>
          <p className={styles.runBy}>
            {openSource ? (
              agent ? (
                <>
                  An <Link href={`/?q=${encodeURIComponent(provider)}`}>open source</Link> tool anyone can run
                </>
              ) : (
                "An open source tool anyone can run"
              )
            ) : provider === "Unknown" ? (
              "Run by an unnamed operator"
            ) : linkProvider ? (
              <>
                Run by <Link href={`/?q=${encodeURIComponent(provider)}`}>{provider}</Link>
              </>
            ) : (
              <>
                From <strong>{provider}</strong>
              </>
            )}
          </p>
        </div>
      </section>

      <div className={styles.pills}>
        {agent ? (
          <Link href={`/type/${typeInfo(agent.type).slug}`} className={`pill outline ${styles.typePill}`}>
            <Icon name={typeInfo(agent.type).icon} size={15} />
            <span className="sr-only">Type: </span>
            {agent.type}
          </Link>
        ) : (
          <span className="pill outline">
            <Icon name={STANDALONE_ICON[s!.typeLabel] ?? "bot"} size={15} />
            <span className="sr-only">Type: </span>
            {s!.typeLabel}
          </span>
        )}
        <GuideMethodPill method={method} />
        {agent && (
          <span className={`pill ${styles.levelPill}`}>
            <Meter rank={agent.rank} />
            <span className="sr-only">How common: </span>
            {levelInfo(agent.rank).label}
          </span>
        )}
        <span className={`pill ${g.guidePill}`}>
          <Icon name="layers" size={15} />
          Detection guide
        </span>
      </div>

      <div className={g.byline}>
        <span className={g.avatar} aria-hidden="true">
          V
        </span>
        <strong>Verisoul Research</strong>
        <span className={g.dot} aria-hidden="true" />
        <span>
          Updated <time dateTime={GUIDES_UPDATED}>{guideDate(GUIDES_UPDATED)}</time>
        </span>
        <span className={g.dot} aria-hidden="true" />
        <span>{readingMinutes(guide)} min read</span>
      </div>

      <p className={g.dek}>{inline(guide.dek)}</p>

      <section className={styles.answer} id="how-to-detect" aria-labelledby="detect-heading">
        <h2 id="detect-heading" className={styles.answerTitle}>
          How to detect {name}
        </h2>
        <p className={styles.answerLead}>{inline(guide.answer)}</p>
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>Detection method</dt>
            <dd>
              <GuideMethodPill method={method} />
              <span className={styles.factNote}>{methodNote}</span>
            </dd>
          </div>
          <div className={styles.fact}>
            <dt>{method ? "Signals that identify it" : "Signals that flag it"}</dt>
            <dd>
              <ul className={styles.factList}>
                {signalKeys.map((k) => {
                  const sig = SIGNALS.find((x) => x.key === k)!;
                  return (
                    <li key={k}>
                      <span className={styles.factIcon} aria-hidden="true">
                        <Icon name={sig.icon} size={16} />
                      </span>
                      <span>
                        <strong>{sig.label}</strong>
                        <span className={styles.factDetail}>{details[k] ?? sig.meaning}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </dd>
          </div>
        </dl>
      </section>

      <div className={styles.columns}>
        <div className={styles.main}>
          <GuideBody guide={guide} name={name} api={api} />

          {agent && (
            <section aria-labelledby="often">
              <h2 id="often" className={styles.h2}>
                {"How often you'll see it"}
              </h2>
              <div className={styles.often}>
                <Meter rank={agent.rank} variant="big" />
                <div className={styles.oftenText}>
                  <p className={styles.levelLabel}>{levelInfo(agent.rank).label}</p>
                  <p className={styles.levelNote}>{agent.evidence ?? levelInfo(agent.rank).meaning}</p>
                </div>
              </div>
            </section>
          )}

          {regions && (
            <section aria-labelledby="regions">
              <h2 id="regions" className={styles.h2}>
                Regions
              </h2>
              <ul className={styles.regions}>
                {regions.map((r) => (
                  <li key={r} className={styles.region}>
                    <span className={styles.regionName}>{r}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {members.length > 0 && (
            <section aria-labelledby="in-atlas">
              <h2 id="in-atlas" className={styles.h2}>
                How {name} shows up in the Atlas
              </h2>
              <p className={styles.intro}>
                {s!.named === false
                  ? `Verisoul doesn't name ${name} sessions yet. These are the related Atlas entries you may see alongside it.`
                  : `Verisoul returns these Atlas entries for ${name} sessions it can name.`}
              </p>
              <AgentRows agents={members} />
            </section>
          )}

          {related.length > 0 && (
            <section aria-labelledby="more">
              <h2 id="more" className={styles.h2}>
                {openSource ? "More open source tools" : `More from ${provider}`}
              </h2>
              <AgentRows agents={related} />
            </section>
          )}

          {(() => {
            // Other guides in the same group first, then the rest, so every guide links to several others
            const group = GUIDES.filter((x) => x.group === guide.group);
            const at = group.findIndex((x) => x.slug === guide.slug);
            const same = [...group.slice(at + 1), ...group.slice(0, at)];
            const rest = GUIDES.filter((x) => x.group !== guide.group);
            const more = [...same, ...rest].slice(0, 6);
            return (
              <section aria-labelledby="more-guides">
                <h2 id="more-guides" className={styles.h2}>
                  More detection guides
                </h2>
                <ul className={styles.rows}>
                  {more.map((x) => (
                    <li key={x.slug}>
                      <Link href={`/${x.slug}`} className={styles.row}>
                        <span className={styles.rowText}>
                          <span className={styles.rowName}>How to detect {guideName(x)}</span>
                          <span className={styles.rowDesc}>{x.groupName}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })()}

          <section aria-labelledby="faq">
            <h2 id="faq" className={styles.h2}>
              Questions about {name}
            </h2>
            <div className={styles.faq}>
              {faq.map((f) => (
                <div key={f.q}>
                  <h3 className={styles.faqQ}>{f.q}</h3>
                  <p className={styles.faqA}>{inline(f.a)}</p>
                </div>
              ))}
            </div>
          </section>

          {guide.sources.length > 0 && (
            <section aria-labelledby="sources">
              <h2 id="sources" className={styles.h2}>
                Sources
              </h2>
              <ol className={g.sources}>
                {guide.sources.map((x) => (
                  <li key={x.url}>
                    <a href={x.url} target="_blank" rel="noopener">
                      {x.title}
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className={`${styles.aside} ${g.sticky}`} aria-label={`More about ${name}`}>
          {toc.length > 0 && (
            <section className={`${styles.card} ${g.tocCard}`} aria-labelledby="toc">
              <h2 id="toc" className={styles.cardTitle}>
                On this page
              </h2>
              <nav className={g.toc}>
                {toc.map((h) => (
                  <a key={h.text} href={`#${headingId(h.text)}`}>
                    {plain(h.text)}
                  </a>
                ))}
                <a href="#faq">Questions about {name}</a>
              </nav>
            </section>
          )}

          <section className={styles.apiCard} aria-labelledby="api">
            <h2 id="api" className={styles.cardTitle}>
              In the Verisoul API
            </h2>
            <p className={styles.apiLead}>{apiLead}</p>
            {api}
            {apiFor && !apiAgent(apiFor).detection_signals.includes("device") && (
              <p className={styles.apiNote}>detection_signals also includes device when the session shows signs of automation tools.</p>
            )}
            <a href={SITE.links.api} className={styles.docs}>
              Read the docs
              <Icon name="arrow" size={16} strokeWidth={2} />
            </a>
          </section>

          {agent && (
            <section className={styles.card} aria-labelledby="lookalikes">
              <h2 id="lookalikes" className={styles.cardTitle}>
                Look-alikes
              </h2>
              <p className={styles.cardText}>{lookAlikes(agent)}</p>
            </section>
          )}

          {agent && (agent.aliases.length > 0 || agent.name !== name) && (
            <section className={styles.card} aria-labelledby="aka">
              <h2 id="aka" className={styles.cardTitle}>
                Also known as
              </h2>
              <p className={styles.cardText}>{[...(agent.name !== name ? [agent.name] : []), ...agent.aliases]
                  .filter((x, i, all) => x.toLowerCase() !== name.toLowerCase() && all.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i)
                  .join(", ")}</p>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}

function GuideMethodPill({ method }: { method: Method | null }) {
  if (method) return <MethodPill method={method} outline />;
  return <span className={`pill ${g.notNamed}`}>Not named yet</span>;
}

function AgentRows({ agents }: { agents: Agent[] }) {
  return (
    <ul className={styles.rows}>
      {agents.map((a) => (
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
  );
}

function NullApiBlock() {
  return (
    <div className="api-block">
      <div className="api-block-top">
        <span className="api-block-label">API response</span>
        <CopyButton value={'"agent": null'} what="the agent block" />
      </div>
      <pre>
        <code>
          <span className="json-key">{'"agent"'}</span>
          <span className="json-punct">:</span> null
        </code>
      </pre>
    </div>
  );
}
