import { CopyButton } from "./CopyButton";
import { apiAgentJson, type Agent } from "@/lib/atlas";

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
        <code>{json}</code>
      </pre>
    </div>
  );
}
