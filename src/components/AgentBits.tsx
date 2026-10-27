import { Icon } from "./Icon";
import { SIGNALS, levelInfo, methodInfo, typeInfo, type Agent, type AgentType, type Method, type Rank } from "@/lib/atlas";

export { LogoTile } from "./LogoTile";

export function MethodPill({ method, outline = false }: { method: Method; outline?: boolean }) {
  const info = methodInfo(method);
  const cls = ["pill", method === "Signed" ? "signed" : "", outline && method !== "Signed" ? "outline" : ""].join(" ").trim();
  return (
    <span className={cls}>
      <Icon name={info.icon} size={14} strokeWidth={2} />
      {method}
    </span>
  );
}

export function TypeLabel({ type, muted = true }: { type: AgentType; muted?: boolean }) {
  const info = typeInfo(type);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <Icon name={info.icon} size={16} strokeWidth={1.75} style={muted ? { color: "var(--muted)" } : undefined} />
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{type}</span>
    </span>
  );
}

/** Four fixed slots: Cryptographic, Network, Device, Behavior. Lit when the agent uses that signal. */
export function SignalSlots({ agent, size = 30 }: { agent: Agent; size?: number }) {
  return (
    <span className="signal-slots">
      {SIGNALS.map((s) => {
        const on = agent.signals[s.key];
        const label = `${s.label}: ${on ? agent.signalDetails[s.key] ?? s.meaning : "not used"}`;
        return (
          <span
            key={s.key}
            className={`signal-slot${on ? " on" : ""}`}
            role="img"
            aria-label={label}
            title={label}
            style={size !== 30 ? { width: size, height: size } : undefined}
          >
            <Icon name={s.icon} size={Math.round(size * 0.53)} strokeWidth={1.9} />
          </span>
        );
      })}
    </span>
  );
}

/** Commonality as a four-segment meter: Very common fills 4, Very uncommon fills 1 */
export function Meter({ rank, variant }: { rank: Rank; variant?: "tall" | "big" }) {
  const filled = 5 - rank;
  return (
    <span className={`meter${variant ? ` ${variant}` : ""}`} aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={i < filled ? "on" : undefined} />
      ))}
    </span>
  );
}

export function Commonality({ rank, showLabel = true }: { rank: Rank; showLabel?: boolean }) {
  const label = levelInfo(rank).label;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }} aria-label={label} role="img">
      <Meter rank={rank} />
      {showLabel && <span style={{ fontSize: 13, whiteSpace: "nowrap" }}>{label}</span>}
    </span>
  );
}
