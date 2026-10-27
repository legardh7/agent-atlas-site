"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Directory.module.css";

/** Resizable table columns. "What it does" also stretches to fill any leftover width */
export type ColKey = "agent" | "desc" | "type" | "method" | "sig" | "comm";

export const COLUMNS: { key: ColKey; label: string; className: string; min: number; max: number; def: number }[] = [
  { key: "agent", label: "Agent", className: styles.colAgent, min: 180, max: 520, def: 220 },
  { key: "desc", label: "What it does", className: styles.colDesc, min: 160, max: 900, def: 240 },
  { key: "type", label: "Type", className: styles.colType, min: 120, max: 300, def: 168 },
  { key: "method", label: "Method", className: styles.colMethod, min: 120, max: 260, def: 140 },
  { key: "sig", label: "Signals", className: styles.colSig, min: 136, max: 260, def: 136 },
  { key: "comm", label: "Commonality", className: styles.colComm, min: 110, max: 280, def: 150 },
];

export type Widths = Record<ColKey, number>;
const DEFAULTS = Object.fromEntries(COLUMNS.map((c) => [c.key, c.def])) as Widths;
const STORE = "agent-atlas-columns";
const clamp = (k: ColKey, v: number) => {
  const c = COLUMNS.find((x) => x.key === k)!;
  return Math.round(Math.min(c.max, Math.max(c.min, v)));
};

/** Column widths, remembered in this browser */
export function useColumnWidths() {
  const [widths, setWidths] = useState<Widths>(DEFAULTS);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? "null");
      if (saved && typeof saved === "object") {
        const next = { ...DEFAULTS };
        for (const c of COLUMNS) if (typeof saved[c.key] === "number") next[c.key] = clamp(c.key, saved[c.key]);
        setWidths(next);
      }
    } catch {}
  }, []);

  const setWidth = useCallback((k: ColKey, v: number) => {
    setWidths((w) => {
      const next = { ...w, [k]: clamp(k, v) };
      try {
        localStorage.setItem(STORE, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setWidths(DEFAULTS);
    try {
      localStorage.removeItem(STORE);
    } catch {}
  }, []);

  const changed = COLUMNS.some((c) => widths[c.key] !== c.def);
  const style = Object.fromEntries(COLUMNS.map((c) => [`--c-${c.key}`, `${widths[c.key]}px`])) as React.CSSProperties;
  return { widths, setWidth, reset, changed, style };
}

/** Header row with a drag handle on the right edge of each column */
export function ColumnHeader({ widths, setWidth }: { widths: Widths; setWidth: (k: ColKey, v: number) => void }) {
  return (
    <div className={`${styles.grid} ${styles.head}`}>
      {COLUMNS.map((c) => (
        <span key={c.key} className={`${c.className} ${styles.headCell}`}>
          <span className={styles.headLabel}>{c.label}</span>
          <ResizeHandle col={c.key} label={c.label} width={widths[c.key]} setWidth={setWidth} />
        </span>
      ))}
      <span className={styles.colChev} />
    </div>
  );
}

function ResizeHandle({ col, label, width, setWidth }: { col: ColKey; label: string; width: number; setWidth: (k: ColKey, v: number) => void }) {
  const start = useRef<{ x: number; w: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const def = COLUMNS.find((c) => c.key === col)!;

  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label} column`}
      aria-valuenow={width}
      aria-valuemin={def.min}
      aria-valuemax={def.max}
      tabIndex={0}
      title="Drag to resize, double-click to reset"
      className={`${styles.resizer}${dragging ? ` ${styles.resizerActive}` : ""}`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, w: width };
        setDragging(true);
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        setWidth(col, start.current.w + (e.clientX - start.current.x));
      }}
      onPointerUp={(e) => {
        start.current = null;
        setDragging(false);
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {}
      }}
      onPointerCancel={() => {
        start.current = null;
        setDragging(false);
      }}
      onDoubleClick={() => setWidth(col, def.def)}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 48 : 16;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setWidth(col, width + step);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setWidth(col, width - step);
        } else if (e.key === "Home" || e.key === "Enter") {
          e.preventDefault();
          setWidth(col, def.def);
        }
      }}
    />
  );
}
