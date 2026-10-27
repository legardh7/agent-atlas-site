# Verisoul Robodex

Robodex is Verisoul's public directory of every AI agent, crawler and automation tool Verisoul can identify (489 today), and how we know each one. Every agent has its own page showing who runs it, what kind of agent it is, how common it is, and which of four signals (cryptographic, network, device, behavior) Verisoul uses to identify it. It is a small Next.js website that builds every page ahead of time from one data file, so it is fast, cheap to host and easy to refresh.

## Where things live

| Path | What it is |
| --- | --- |
| `src/data/robodex.json` | The data every page reads. Generated, so do not edit by hand |
| `scripts/build-data.py` | Turns the Robodex kit's data file into `src/data/robodex.json` |
| `src/lib/site.ts` | Site name, public URL and every outbound link |
| `src/lib/robodex.ts` | Labels and descriptions for types, methods, signals and commonality levels |
| `src/app` | Pages, social images, sitemap, robots file and the JSON API |
| `public/verisoul-logo.png` | Logo used in the header and on the social card |

## Run it on your computer

You need Node.js 20 or newer (check with `node -v`). From this folder:

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Pages update as soon as you save a file.

To try the real production build locally, run `npm run build` and then `npm start`.

## Put it on the web with Vercel

1. Put the code in a GitHub repo. Create an empty private repo on GitHub, then push this folder to it:

   ```bash
   git init
   git add .
   git commit -m "Robodex"
   git branch -M main
   git remote add origin https://github.com/YOUR-ORG/robodex.git
   git push -u origin main
   ```

2. In Vercel, click **Add New**, then **Project**
3. Find the repo and click **Import** (if it is missing, click "Adjust GitHub App Permissions" and give Vercel access to it)
4. Vercel detects the framework as **Next.js**. Leave the build and output settings as they are
5. Open **Environment Variables** and add `NEXT_PUBLIC_SITE_URL` set to the final address, with no slash at the end, for example `https://robodex.verisoul.ai`
6. Click **Deploy**. The first build takes a few minutes because it draws a social image for every agent
7. From then on, every push to `main` deploys on its own, and every other branch gets its own preview link

`NEXT_PUBLIC_SITE_URL` feeds the sitemap, the canonical links, the links in the API and the social images. It is read when the site is built, so if you change it, redeploy (**Deployments**, then the menu on the latest one, then **Redeploy**).

### Custom domain

Use a subdomain such as `robodex.verisoul.ai`:

1. In the Vercel project, open **Settings**, then **Domains**, and add `robodex.verisoul.ai`
2. At the DNS provider for verisoul.ai, add a **CNAME** record with the name `robodex` and the value `cname.vercel-dns.com`
3. Wait for Vercel to show the domain as valid (usually a few minutes). It sets up HTTPS by itself
4. Check that `NEXT_PUBLIC_SITE_URL` matches the domain, and redeploy if you changed it

Why not `verisoul.ai/robodex`? The main site runs on Webflow, and Webflow cannot hand one path to another app. Serving Robodex there would need a proxy in front of Webflow (for example Cloudflare) that sends `/robodex` to Vercel and everything else to Webflow, plus a `basePath: "/robodex"` setting in `next.config.mjs`. A subdomain needs one DNS record and nothing else, so it is the simpler place to start.

## Update the data

Every page, the sitemap, the social images and the API read from `src/data/robodex.json`. That file is generated from the Robodex kit's `robodex.json`:

```bash
python3 scripts/build-data.py <kit robodex.json> src/data/robodex.json
```

For example `python3 scripts/build-data.py ../robodex-kit/data/robodex.json src/data/robodex.json`. The script prints the number of rows and the new counts. Commit and push the result, and Vercel rebuilds every page, the sitemap and the social images on deploy.

What the script does:

- Copies the public fields of each agent and renames a few for the site (for example `identified_agent` becomes `id` and `commonality_rank` becomes `rank`)
- Folds a family of regional agents into one row with the regions listed in `variants` (today the 9 regions of Amazon Bedrock AgentCore Browser, which is why there are 481 rows for 489 agents)
- Keeps the commonality evidence line only when it comes from Cloudflare Radar crawler traffic data
- Recounts every total, so the numbers on the page always match the list
- Leaves out internal fields such as `internal_note`, `notable` and `seen_on_verisoul`

Three dates are set by hand, so update them on each refresh:

- The "updated" label (`"October 2026"`) on the last line of `scripts/build-data.py`
- The month in the evidence line (`"in September 2026, per Cloudflare Radar"`), also in `scripts/build-data.py`
- `LAST_MODIFIED` in `src/app/sitemap.ts`

### Fields in `src/data/robodex.json`

The file has `updated`, `counts` (totals by method, commonality, type and signal), `logos` (SVG path data on a 24 by 24 grid plus a brand color) and `agents`. Each agent has:

| Field | Meaning |
| --- | --- |
| `slug` | Address of the agent page: `/agents/<slug>` |
| `id` | The exact `identified_agent` value the Verisoul API returns |
| `name`, `description`, `aliases` | What people see and search on |
| `provider`, `providerDomain` | Who runs it (`Unknown` when we do not know) |
| `logo` | Key into `logos`, or `null` to show a monogram tile |
| `monogram` | One or two letters for the tile when there is no logo |
| `type` | AI agent, AI assistant, AI crawler, Crawler, Headless automation or Other |
| `method` | Signed, Self-declared or Inferred |
| `rank` | Commonality: 1 Very common, 2 Common, 3 Uncommon, 4 Very uncommon |
| `signals` | Four true or false values: `cryptographic`, `network`, `device`, `behavior` |
| `signalDetails` | One line for each signal that is on, shown on hover and on the agent page |
| `declaresUserAgent` | True when the agent names itself in its user agent |
| `variants`, `count` | Regional variants for a family row, and how many agents the row stands for |
| `evidence` | Public source for the commonality rating, when there is one |
| `order` | Default sort order, most common first |

## How the four signals are assigned

Every agent shows four slots in the same order. A slot is lit when Verisoul uses that signal to identify the agent:

- **Cryptographic**: every signed agent. The request carries a signature that Verisoul verifies cryptographically
- **Network**: operator IP checks for self-declared crawlers and fetchers (the source IP belongs to the operator's own network), plus cloud data center traffic for hosted browsers
- **Device**: Google's crawlers (the device profile of Google's page-rendering browser), headless and hosted browsers (automation markers in the device fingerprint), and cloud browser agents (a virtual machine device profile)
- **Behavior**: every agent that drives a real browser (clicks, typing and page flow that are not a person's), plus desktop coding apps that automate a browser from someone's computer

A self-declared agent always has at least one of network, device or behavior lit, because a user agent on its own is never enough. The signals and their one-line details come from the kit (`signals` and `signal_details`). To change one, change it in the kit and rerun the script, and keep the detail line in step with the signal.

## Links, API and social images

**Links.** Every outbound link (Verisoul home, agent detection, docs, contact, signed agents, API) is in `src/lib/site.ts` under `links`. Several point at the homepage or the docs root for now, so point them at the real pages before launch.

**JSON API.** `GET /api/agents` returns the whole directory as JSON:

```json
{
  "updated": "October 2026",
  "count": 489,
  "agents": [
    {
      "slug": "amazonbot",
      "id": "amazonbot",
      "name": "Amazonbot",
      "commonality": "Very common",
      "signals": { "cryptographic": false, "network": true, "device": false, "behavior": false },
      "url": "https://robodex.verisoul.ai/agents/amazonbot"
    }
  ]
}
```

- Each agent also carries `description`, `aliases`, `provider`, `type`, `method`, `signalDetails`, `declaresUserAgent` and `variants`
- `count` is the number of agents, while `agents` has one row per family (481 today)
- Built once per deploy, so it always matches the pages
- Any website can call it (the response allows all origins)
- Only public fields go out, never internal notes

**Social images and search.** These are generated from code, so there is nothing to upload:

- `src/app/opengraph-image.tsx`: the preview card for the home page
- `src/app/agents/[slug]/opengraph-image.tsx`: one card per agent, drawn at build time
- `src/app/icon.svg`: the browser tab icon
- `src/app/sitemap.ts` and `src/app/robots.ts`: `/sitemap.xml` and `/robots.txt`

The cards use the font that ships with Next.js, so builds never need to download anything.

## Copy and style rules

For anything written or drawn on the site, in the data or in this README:

- No em dashes. Use commas, colons, periods or parentheses instead
- No period at the end of a bullet point
- Agents that sign their requests are "signed", and their identity is "verified cryptographically"
- One accent color (#2160fd), navy text (#0f1e3d), white backgrounds, no gradients and no emoji
