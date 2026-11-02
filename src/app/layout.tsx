import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { themeInitScript } from "@/components/ThemeToggle";
import { ORIGIN, SITE, asset } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(`${ORIGIN}/`),
  title: {
    default: "Agent Atlas: every AI agent and bot Verisoul identifies",
    template: "%s | Verisoul Agent Atlas",
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "Verisoul Agent Atlas",
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preload" href="https://cdn.prod.website-files.com/6627605478f226ce86d5c27f/fonts/6ae7ac0bb3d4b53d7696c31f-Youth-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="alternate" type="text/plain" title="llms.txt" href={asset("/llms.txt")} />
      </head>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
