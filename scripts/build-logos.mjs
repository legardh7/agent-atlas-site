// Builds public/logos/*.svg and src/data/logos.json from src/data/logo-map.json,
// then writes each agent's `logo` and `providerDomain` into src/data/agents.json.
//
// The icon sets are not app dependencies. Install them just for this run:
//   npm i --no-save @lobehub/icons-static-svg @iconify-json/logos @iconify-json/simple-icons simple-icons
//   node scripts/build-logos.mjs
//
// Sources (all open licenses): Lobe Icons (MIT), Iconify "logos" by Gil Barbara (CC0),
// Simple Icons (CC0). Brand marks remain the property of their owners.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/logo-map.json"), "utf8"));
const AGENTS_FILE = path.join(ROOT, "src/data/agents.json");
const OUT_DIR = path.join(ROOT, "public/logos");
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const iconify = {
  logos: require("@iconify-json/logos/icons.json"),
  "simple-icons": require("@iconify-json/simple-icons/icons.json"),
};
const siRoot = path.join(ROOT, "node_modules/simple-icons");
const siData = JSON.parse(fs.readFileSync(path.join(siRoot, fs.existsSync(path.join(siRoot, "data")) ? "data/simple-icons.json" : "_data/simple-icons.json"), "utf8"));
const siHex = Object.fromEntries((Array.isArray(siData) ? siData : siData.icons).map((i) => [i.slug ?? i.title.toLowerCase().replace(/[^a-z0-9]/g, ""), `#${i.hex}`]));
// Brand colors for Simple Icons entries that newer releases no longer carry
Object.assign(siHex, { amazon: "#FF9900", adp: "#D0271D", naver: "#03C75A", osano: "#7764FA", wappalyzer: "#4608AD" }, siHex.naver ? { naver: siHex.naver } : {});
const lobeDir = path.join(ROOT, "node_modules/@lobehub/icons-static-svg/icons");

function luminance(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Returns a standalone SVG string for a "set:icon" reference */
function resolve(ref) {
  const [set, name] = ref.split(":");
  if (set === "lobe") {
    let svg = fs.readFileSync(path.join(lobeDir, `${name}.svg`), "utf8");
    svg = svg.replace(/<title>.*?<\/title>/s, "");
    const vb = svg.match(/viewBox="([^"]+)"/)[1];
    const rootTag = svg.match(/<svg[^>]*>/)[0];
    let inner = svg.replace(/^.*?<svg[^>]*>/s, "").replace(/<\/svg>\s*$/s, "");
    // Mono Lobe icons set their color on the root tag; keep it (black) on a wrapper group
    if (/fill="currentColor"/.test(rootTag)) inner = `<g fill="#000000">${inner}</g>`;
    return { vb, inner: inner.replace(/currentColor/g, "#000000") };
  }
  const data = iconify[set];
  const icon = data.icons[name];
  if (!icon) throw new Error(`Missing icon ${ref}`);
  const w = icon.width ?? data.width ?? 24;
  const h = icon.height ?? data.height ?? 24;
  let inner = icon.body;
  if (set === "simple-icons") inner = inner.replace(/currentColor/g, siHex[name] ?? "#000000");
  return { vb: `${icon.left ?? 0} ${icon.top ?? 0} ${w} ${h}`, inner };
}

const fileKey = (ref) => ref.replace(/^[^:]+:/, "").replace(/-(color|icon)$/, "").replace(/[^a-z0-9-]/g, "");
const logos = {};
function build(ref) {
  const key = fileKey(ref);
  if (logos[key]) return key;
  const { vb, inner } = resolve(ref);
  const colors = [...inner.matchAll(/(?:fill|stop-color|stroke)="(#[0-9a-fA-F]{3,8})"/g)].map((m) => m[1].slice(0, 7));
  // "dark" = black or near-black gray marks that need inverting on the dark theme
  const grayish = (c) => {
    const h = c.replace("#", "").padEnd(6, "0");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return Math.max(r, g, b) - Math.min(r, g, b) < 28;
  };
  // No explicit color means the SVG default, black
  const dark = colors.length === 0 || colors.every((c) => luminance(c) < 0.12 && grayish(c));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="24" height="24">${inner}</svg>\n`;
  fs.writeFileSync(path.join(OUT_DIR, `${key}.svg`), svg);
  logos[key] = { src: `/logos/${key}.svg`, dark };
  return key;
}

const data = JSON.parse(fs.readFileSync(AGENTS_FILE, "utf8"));
let withLogo = 0;
let withSite = 0;
for (const a of data.agents) {
  const byAgent = MAP.byAgent[a.id] ?? (a.id.startsWith("amazon_bedrock_agentcore_browser") ? "lobe:bedrock-color" : undefined);
  const ref = byAgent ?? MAP.byProvider[a.provider];
  a.logo = ref ? build(ref) : null;
  if (!a.providerDomain && MAP.domains[a.provider]) a.providerDomain = MAP.domains[a.provider];
  if (a.logo) withLogo += a.count;
  else if (a.providerDomain) withSite += a.count;
}
data.logos = logos;
fs.writeFileSync(AGENTS_FILE, JSON.stringify(data));
console.log(`${Object.keys(logos).length} logo files, ${withLogo} agents with a logo, ${withSite} more with a website icon`);
