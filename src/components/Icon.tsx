import { ICONS, type IconName } from "@/lib/icons";

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.9,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ flex: "none", ...style }}
    >
      <path d={ICONS[name]} />
    </svg>
  );
}
