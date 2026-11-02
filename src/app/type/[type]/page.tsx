import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TYPES } from "@/lib/atlas";
import { agentsOfType } from "@/components/browse/BrowseAll";
import { SITE, abs } from "@/lib/site";
import { fitDescription, fitTitle } from "@/lib/seo";
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
    title: {
      absolute: fitTitle([
        `${plural(t.key)}: all ${n} and how to detect them | Verisoul`,
        `${plural(t.key)}: all ${n} and how to detect them`,
        `How to detect ${plural(t.key)} | Verisoul`,
      ]),
    },
    description: fitDescription(`${n} ${plural(t.key)} Verisoul can identify. ${t.meaning}. Each page explains how the agent is detected.`),
    alternates: { canonical: abs(`/type/${t.slug}`) },
  };
}

export default async function TypePage({ params }: Props) {
  const { type } = await params;
  const t = TYPES.find((x) => x.slug === type);
  if (!t) notFound();
  const list = agentsOfType(t.key);

  const url = abs(`/type/${t.slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${plural(t.key)} Verisoul can identify`,
        description: t.meaning,
        url,
        isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: list.length,
          itemListElement: list.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.name, url: abs(`/${a.slug}`) })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Verisoul", item: "https://www.verisoul.ai" },
          { "@type": "ListItem", position: 2, name: "Agent Atlas", item: SITE.url },
          { "@type": "ListItem", position: 3, name: plural(t.key), item: url },
        ],
      },
    ],
  };

  return (
    <main className={`container ${styles.page}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
