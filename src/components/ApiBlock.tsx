import type { ReactNode } from "react";
import { CopyButton } from "./CopyButton";
import { apiAgentJson, type Agent } from "@/lib/atlas";

/** Colors JSON for reading: keys, string values and punctuation each get their own tone */
function highlight(json: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|([{}[\],:])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(json))) {
    if (m.index > last) out.push(json.slice(last, m.index));
    if (m[1] && m[2]) {
      out.push(<span key={i++} className="json-key">{m[1]}</span>, <span key={i++} className="json-punct">{m[2]}</span>);
    } else if (m[1]) {
      out.push(<span key={i++} className="json-string">{m[1]}</span>);
    } else {
      out.push(<span key={i++} className="json-punct">{m[3]}</span>);
    }
    last = re.lastIndex;
  }
  if (last < json.length) out.push(json.slice(last));
  return out;
}

/** The agent block exactly as the Verisoul API returns it, with a copy button */
export function ApiBlock({ agent }: { agent: Agent }) {
  const json = apiAgentJson(agent);
  return (
    <div className="api-block">
      <div className="api-block-top">
        <span className="api-block-label">API response</span>
        <CopyButton value={json} what="the agent block" />
      </div>
      <pre>
        <code>{highlight(json)}</code>
      </pre>
    </div>
  );
}
