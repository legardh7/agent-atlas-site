import { SIGNALS, levelInfo, type Agent, type SignalKey } from "./atlas";

/**
 * The plain-language answer to "how do you detect this agent?", built from the same data the
 * page shows. Used in the answer box at the top of each agent page, its FAQ, the meta
 * description and llms.txt, so every place says the same thing.
 */

const ORDER: SignalKey[] = ["cryptographic", "network", "device", "behavior"];

/** "Meta Muse is Meta's autonomous personal AI agent, which ..." */
export function whatItIs(agent: Agent): string {
  const d = sentence(agent.description);
  const first = d.split(" ")[0];
  const body = ["A", "An", "The"].includes(first) ? d.charAt(0).toLowerCase() + d.slice(1) : d;
  return `${agent.name} is ${body}`;
}

/** One or two sentences on exactly how it is detected */
export function howToDetect(agent: Agent): string {
  const { name } = agent;
  const checks = signalPhrases(agent);
  switch (agent.method) {
    case "Signed":
      return `${name} signs its requests, so you detect it by verifying the cryptographic signature on each request. A valid signature proves the request came from ${owner(agent)}; a copied user agent without the signature does not.`;
    case "Self-declared":
      if (agent.declaresUserAgent) {
        return checks
          ? `${name} names itself in its user agent, but anyone can copy a user agent, so it is detected by confirming the user agent against other signals: ${checks}.`
          : `${name} names itself in its user agent, but anyone can copy a user agent, so it is only labeled ${name} when the rest of the session checks out too.`;
      }
      return checks
        ? `${name} identifies itself through its own markers in the browser. Those can be faked, so it is detected by confirming them against other signals: ${checks}.`
        : `${name} identifies itself through its own markers in the browser, which are confirmed against the rest of the session.`;
    case "Inferred":
      return checks
        ? `${name} does not sign its requests or name itself, so a user agent check will miss it. It is detected from several signals that together point to it: ${checks}.`
        : `${name} does not sign its requests or name itself. It is detected from a combination of signals that together point to it.`;
  }
}

/** Short answer used at the top of the page and in llms.txt */
export function detectionLead(agent: Agent): string {
  return howToDetect(agent);
}

export function identifiesItself(agent: Agent): string {
  const { name } = agent;
  if (agent.method === "Signed") return `Yes. ${name} signs its requests cryptographically, which is the strongest way an agent can identify itself.`;
  if (agent.declaresUserAgent) return `Partly. ${name} names itself in its user agent, but user agents are easy to copy, so the name alone is not proof.`;
  if (agent.method === "Self-declared") return `Partly. ${name} leaves its own markers in the browser, but those can be faked, so they are checked against other signals.`;
  return `No. ${name} does not sign its requests or name itself in its user agent. To most websites it looks like an ordinary browser session.`;
}

export function canBeFaked(agent: Agent): string {
  const { name } = agent;
  switch (agent.method) {
    case "Signed":
      return `Not convincingly. A bot can copy ${possessive(name)} user agent, but without ${owner(agent)} signing keys its requests fail verification and it is not labeled ${name}.`;
    case "Self-declared":
      return `A bot can copy ${possessive(name)} user agent or markers, but the network, device and behavior signals will not match, so it is not labeled ${name}.`;
    case "Inferred":
      return `One matching trait is not enough. A session is only labeled ${name} when several independent signals agree.`;
  }
}

export function howCommon(agent: Agent): string {
  const level = levelInfo(agent.rank);
  return `${level.label}. ${agent.evidence ? sentence(agent.evidence) : sentence(level.meaning)}`;
}

/** "source IP confirmed as the operator's own network; cloud-hosted browser ..." */
function signalPhrases(agent: Agent): string {
  // The user agent is already named in the sentence, so the device line would repeat it
  const skipDevice = agent.declaresUserAgent || agent.method === "Self-declared";
  const parts = ORDER.filter((k) => k !== "cryptographic" && agent.signals[k] && !(k === "device" && skipDevice)).map((k) => {
    const detail = agent.signalDetails[k] ?? SIGNALS.find((s) => s.key === k)!.meaning;
    return lowerFirst(detail.replace(/[.\s]+$/, ""));
  });
  return joinWords(parts);
}

function owner(agent: Agent): string {
  if (agent.provider === "Unknown" || agent.provider === "Open source") return "its operator";
  return agent.provider;
}

function lowerFirst(s: string): string {
  // Keep acronyms and names (IP, TLS, Google) as they are
  return /^[A-Z][a-z]/.test(s) && !/^(Google|Amazon|Meta|Microsoft|Apple|OpenAI|Anthropic)\b/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

export function possessive(word: string): string {
  return word.endsWith("s") ? `${word}'` : `${word}'s`;
}

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join("; ")}; and ${words[words.length - 1]}`;
}

export function sentence(text: string): string {
  const t = text.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/** Why a copycat bot is not labeled as this agent */
export function lookAlikes(agent: Agent): string {
  const { name, provider } = agent;
  switch (agent.method) {
    case "Signed": {
      const ownerKeys = provider === "Unknown" ? "its operator's" : possessive(provider);
      return `Signatures can't be copied. A bot pretending to be ${name} without ${ownerKeys} signing keys won't be labeled ${name}.`;
    }
    case "Self-declared":
      return agent.declaresUserAgent
        ? `A bot that copies ${possessive(name)} user agent from somewhere else won't be labeled ${name}, because the rest of the signals won't match.`
        : `A bot that fakes one of ${possessive(name)} markers won't be labeled ${name}, because the rest of the signals won't match.`;
    case "Inferred":
      return `We only label a session ${name} when several signals agree, so one matching trait isn't enough.`;
  }
}
