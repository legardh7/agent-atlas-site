import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TYPES } from "@/lib/atlas";
import { agentsOfType } from "@/components/browse/BrowseAll";
import { abs } from "@/lib/site";
import styles from "@/components/browse/Browse.module.css";

type Props = { params: Promise<{ type: string }> };

/** Unknown slugs still 404 (notFound below). Pages render on request when the host has no prerender cache, as on Webflow Cloud */

export function generateStaticParams() {
  return TYPES.map((t) => ({ type: t.slug }));
}

const plural = (t: string) => (t === "Other" ? "Other automated agents" : `${t}s`);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const t = TYPES.find((x) => x.slug === type);
  if (!t) return {};
  const n = agentsOfType(t.key).length;
  return {
    title: `${plural(t.key)}: all ${n} and how to detect them`,
    description: `${n} ${plural(t.key)} Verisoul can identify. ${t.meaning}. Each page explains how the agent is detected.`,
    alternates: { canonical: abs(`/type/${t.slug}`) },
  };
}

export default async function TypePage({ params }: Props) {
  const { type } = await params;
  const t = TYPES.find((x) => x.slug === type);
  if (!t) notFound();
  const list = agentsOfType(t.key);

  return (
    <main className={`container ${styles.page}`}>
      <Link href="/" className={styles.back}>
        All agents
      </Link>
      <h1 className={styles.h1}>
        {plural(t.key)} ({list.length})
      </h1>
      <p className={styles.lead}>{t.meaning}. Open any one to see exactly how Verisoul detects it.</p>
      <ul className={styles.rows}>
        {list.map((a) => (
          <li key={a.slug} className={styles.row}>
            <Link href={`/${a.slug}`}>{a.name}</Link>
            <span className={styles.rowDesc}>{a.description}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
