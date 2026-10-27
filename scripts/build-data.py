import json, sys
src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src)); A = d["agents"]; M = d["meta"]
agents, fam = [], {}
for r in A:
    ev = None
    if r["commonality_basis"].startswith("Share of global crawler traffic") and r["commonality_evidence"]:
        e = r["commonality_evidence"]
        ev = e[0].upper() + e[1:] + " in September 2026, per Cloudflare Radar"
    row = {
        "slug": r["slug"], "id": r["identified_agent"], "name": r["name"], "description": r["description"],
        "aliases": r["aliases"], "provider": r["provider"], "providerDomain": r["provider_domain"],
        "logo": r["logo_key"], "monogram": r["monogram"], "type": r["type"], "method": r["method"],
        "rank": r["commonality_rank"], "signals": r["signals"], "signalDetails": r["signal_details"],
        "declaresUserAgent": r["declares_in_user_agent"], "variants": None, "count": 1, "evidence": ev,
    }
    if r["family"]:
        f = fam.get(r["family"])
        if f:
            f["variants"].append(r["variant"]); f["count"] += 1; continue
        row.update({"slug": "amazon-bedrock-agentcore-browser", "id": "amazon_bedrock_agentcore_browser_<region>",
                    "name": r["family"], "variants": [r["variant"]],
                    "description": "Amazon's managed browser for Bedrock agents, which signs its requests in each AWS region."})
        fam[r["family"]] = row
    agents.append(row)
for i, a in enumerate(agents): a["order"] = i
logos = {k: {"d": v["d"], "color": v["brand_color"]} for k, v in M["logos"].items()}
counts = {
    "agents": sum(a["count"] for a in agents),
    "method": {m: sum(a["count"] for a in agents if a["method"] == m) for m in ("Signed", "Self-declared", "Inferred")},
    "rank": {str(k): sum(a["count"] for a in agents if a["rank"] == k) for k in (1, 2, 3, 4)},
    "type": {t: sum(a["count"] for a in agents if a["type"] == t) for t in ("AI agent", "AI assistant", "AI crawler", "Crawler", "Headless automation", "Other")},
    "signals": {s: sum(a["count"] for a in agents if a["signals"][s]) for s in ("cryptographic", "network", "device", "behavior")},
}
json.dump({"updated": "October 2026", "counts": counts, "logos": logos, "agents": agents}, open(out, "w"), separators=(",", ":"), ensure_ascii=False)
print(len(agents), json.dumps(counts))
