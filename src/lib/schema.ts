/**
 * Structured data (schema.org JSON-LD) for every page, built in one place so all pages describe
 * Verisoul, the site and themselves the same way.
 *
 * Every page's graph starts with the same base: the Verisoul organization, the Agent Atlas website,
 * the page itself and its breadcrumbs. Page types then add their own nodes (an article for guides,
 * an FAQ where a visible FAQ exists, an item list for collection pages).
 *
 * Nodes point to each other by @id, so search engines and AI tools can tell that every page belongs
 * to one website, published by one company.
 */
import { SITE, abs } from "./site";

type Node = Record<string, unknown>;

export const ORG_ID = `${SITE.links.home}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;
const LANGUAGE = "en";

const pageId = (url: string) => `${url}#webpage`;
const breadcrumbId = (url: string) => `${url}#breadcrumb`;

/** Verisoul, defined once and referenced everywhere else by ORG_ID */
export function organization(): Node {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: "Verisoul",
    url: SITE.links.home,
    logo: { "@type": "ImageObject", url: abs("/verisoul-logo.png") },
    sameAs: SITE.profiles,
  };
}

/** The Agent Atlas site, published by Verisoul */
export function website(): Node {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: LANGUAGE,
    publisher: { "@id": ORG_ID },
  };
}

/** Breadcrumbs: Verisoul > Agent Atlas > ...trail. Pass the trail below the Atlas home */
export function breadcrumbs(url: string, trail: { name: string; url: string }[] = []): Node {
  const items = [
    { name: "Verisoul", url: SITE.links.home },
    { name: "Agent Atlas", url: abs("/") },
    ...trail,
  ];
  return {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId(url),
    itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, item: x.url })),
  };
}

/** The page itself. Use "CollectionPage" for pages that list agents or guides */
export function webPage(p: {
  url: string;
  name: string;
  description: string;
  type?: "WebPage" | "CollectionPage";
  dateModified?: string;
  extra?: Node;
}): Node {
  return {
    "@type": p.type ?? "WebPage",
    "@id": pageId(p.url),
    url: p.url,
    name: p.name,
    description: p.description,
    inLanguage: LANGUAGE,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORG_ID },
    breadcrumb: { "@id": breadcrumbId(p.url) },
    ...(p.dateModified ? { dateModified: p.dateModified } : {}),
    ...p.extra,
  };
}

/** An ordered list of links, for collection pages */
export function itemList(name: string | undefined, items: { name: string; url: string }[]): Node {
  return {
    "@type": "ItemList",
    ...(name ? { name } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, url: x.url })),
  };
}

/** A detection guide as an article. Dates are YYYY-MM-DD */
export function article(p: {
  url: string;
  headline: string;
  description: string;
  abstract: string;
  about: string;
  datePublished: string;
  dateModified: string;
  image?: string;
  citations: string[];
}): Node {
  return {
    "@type": "TechArticle",
    "@id": `${p.url}#article`,
    headline: p.headline,
    description: p.description,
    abstract: p.abstract,
    datePublished: p.datePublished,
    dateModified: p.dateModified,
    inLanguage: LANGUAGE,
    author: { "@type": "Organization", name: "Verisoul Research", url: SITE.links.home, parentOrganization: { "@id": ORG_ID } },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: { "@id": pageId(p.url) },
    url: p.url,
    about: p.about,
    ...(p.image ? { image: p.image } : {}),
    citation: p.citations,
  };
}

/**
 * Questions and answers shown on the page. Only use this for an FAQ that is visible on the page,
 * with the same wording. Google shows FAQ rich results only for government and health sites, so
 * this is for Bing and AI answer engines rather than Google
 */
export function faqPage(url: string, faq: { q: string; a: string }[]): Node {
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    url,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

/** The full graph for a page: the shared base (organization, website) plus the page's own nodes */
export function graph(...nodes: Node[]): Node {
  return { "@context": "https://schema.org", "@graph": [organization(), website(), ...nodes] };
}
