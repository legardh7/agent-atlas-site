import Link from "next/link";
import type { ReactNode } from "react";
import { asset } from "@/lib/site";
import { AGENT_SHARE, type Block, type Guide } from "@/lib/guides";
import styles from "./guide.module.css";

const VIDEO_ID = "3o1WhsL7Pek";
const VIDEO_TITLE = "How to detect AI agents like Muse, Instinct, Grok Bot, Dots and Duet";

/** [text](https://url) links and `code` inside guide text */
export function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\((https?:[^)\s]+)\)|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const atlas = m[2]?.match(/^https:\/\/www\.verisoul\.ai\/agents(?:\/([a-z0-9-]+))?\/?$/);
    if (m[1] && atlas) {
      // Links to other Atlas pages stay inside the app
      out.push(
        <Link key={i++} href={`/${atlas[1] ?? ""}`}>
          {m[1]}
        </Link>,
      );
    } else if (m[1]) {
      out.push(
        <a key={i++} href={m[2]} target="_blank" rel="noopener">
          {m[1]}
        </a>,
      );
    } else {
      out.push(<code key={i++}>{m[3]}</code>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** The guide's long-form body. `api` renders where the guide shows the API response */
export function GuideBody({ guide, name, api }: { guide: Guide; name: string; api: ReactNode }) {
  return (
    <article className={styles.guide} id="guide">
      {guide.body.map((b, i) => (
        <BlockView key={i} block={b} guide={guide} name={name} api={api} />
      ))}
    </article>
  );
}

function BlockView({ block: b, guide, name, api }: { block: Block; guide: Guide; name: string; api: ReactNode }) {
  switch (b.t) {
    case "p":
      return <p>{inline(b.text)}</p>;
    case "h2":
      return <h2 id={headingId(b.text)}>{inline(b.text)}</h2>;
    case "h3":
      return <h3>{inline(b.text)}</h3>;
    case "ul":
      return (
        <ul>
          {b.items.map((x, i) => (
            <li key={i}>{inline(x)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol>
          {b.items.map((x, i) => (
            <li key={i}>{inline(x)}</li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                {b.head.map((h, i) => (
                  <th key={i}>{inline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>{inline(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "flow":
      return (
        <figure className={styles.flowFigure}>
          <ol className={styles.flow}>
            {b.steps.map((s, i) => (
              <li key={i}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {inline(s)}
              </li>
            ))}
          </ol>
          <figcaption>How {name} reaches your site</figcaption>
        </figure>
      );
    case "code":
      return <div className={styles.api}>{api}</div>;
    case "chart":
      return guide.chart ? <ShareChart highlight={guide.chart} /> : null;
    case "screenshot":
      return (
        <>
          {guide.shots.map((s) => (
            <figure key={s.src} className={`${styles.shot}${s.tall ? ` ${styles.tall}` : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(s.src)} alt={s.alt} loading="lazy" decoding="async" />
              <figcaption>{s.caption}</figcaption>
            </figure>
          ))}
        </>
      );
    case "video":
      return (
        <figure className={styles.video}>
          <div className={styles.videoFrame}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}`}
              title={VIDEO_TITLE}
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <figcaption>{VIDEO_TITLE}, from Verisoul</figcaption>
        </figure>
      );
  }
}

/** Share of named personal-agent sessions, one bar per agent, the guide's agent in blue */
export function ShareChart({ highlight }: { highlight: string }) {
  const rows = AGENT_SHARE.rows;
  const me = rows.find((r) => r[0] === highlight);
  if (!me) return null;
  const max = Math.max(...rows.map((r) => r[2]));
  const pct = (v: number) => (v < 1 ? "<1" : String(v));
  const title = `${me[1]} was ${pct(me[2])}% of the personal-agent sessions Verisoul named, ${AGENT_SHARE.window}`;
  const W = 640;
  const rowH = 34;
  const left = 150;
  const right = 60;
  return (
    <figure className={styles.chart}>
      <h4>{title}</h4>
      <p className={styles.chartSub}>Share of sessions with a named personal agent on sites that use Verisoul, %. {AGENT_SHARE.window}</p>
      <svg viewBox={`0 0 ${W} ${rows.length * rowH + 6}`} role="img" aria-label={title}>
        <line x1={left} y1={0} x2={left} y2={rows.length * rowH + 4} stroke="var(--line)" />
        {rows.map((r, i) => {
          const on = r[0] === highlight;
          const w = Math.max(2, ((W - left - right) * r[2]) / max);
          const y = i * rowH;
          return (
            <g key={r[0]}>
              <text className={`${styles.chartLabel}${on ? ` ${styles.on}` : ""}`} x={left - 12} y={y + 21} textAnchor="end">
                {r[1]}
              </text>
              <rect x={left} y={y + 8} width={w} height={18} rx={3} fill={on ? "var(--blue)" : "var(--off)"} />
              <text className={`${styles.chartValue}${on ? ` ${styles.on}` : ""}`} x={left + w + 8} y={y + 21}>
                {pct(r[2])}%
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption>Source: Verisoul network data, the first four days agents were named in the API. Nov 1 is a partial day</figcaption>
    </figure>
  );
}
