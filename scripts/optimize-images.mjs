// Makes small WebP copies of the guide images and the header logo, and records
// screenshot sizes in guides.json. The PNG/JPG originals stay for the OG cards.
// Run with: node scripts/optimize-images.mjs  (needs `npm i --no-save sharp`)
import sharp from "sharp";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const pub = join(process.cwd(), "public");
const out = (f) => f.replace(/\.(png|jpe?g)$/i, ".webp");

// Logos are shown at 40px or less, so 128px covers 3x screens
for (const f of readdirSync(join(pub, "guides/logos")).filter((f) => /\.(png|jpe?g)$/i.test(f))) {
  await sharp(join(pub, "guides/logos", f)).resize(128, 128, { fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toFile(join(pub, "guides/logos", out(f)));
}
// Screenshots are shown at up to ~720px wide
const sizes = {};
for (const f of readdirSync(join(pub, "guides")).filter((f) => /\.(png|jpe?g)$/i.test(f))) {
  const info = await sharp(join(pub, "guides", f)).resize({ width: 1440, withoutEnlargement: true }).webp({ quality: 78 }).toFile(join(pub, "guides", out(f)));
  sizes[`/guides/${f}`] = [info.width, info.height];
}
// Header logo is shown 22px tall
await sharp(join(pub, "verisoul-logo.png")).resize({ height: 66 }).webp({ quality: 90 }).toFile(join(pub, "verisoul-logo.webp"));

const gp = join(process.cwd(), "src/data/guides.json");
const data = JSON.parse(readFileSync(gp, "utf8"));
for (const g of data.guides) for (const s of g.shots ?? []) if (sizes[s.src]) [s.width, s.height] = sizes[s.src];
writeFileSync(gp, JSON.stringify(data, null, 1) + "\n");
console.log("screenshots", Object.keys(sizes).length);
