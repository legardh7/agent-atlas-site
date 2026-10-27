"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

/** Copies a value to the clipboard and says so for a couple of seconds */
export function CopyButton({ value, what, className }: { value: string; what?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      ok = fallbackCopy(value);
    }
    if (!ok) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button type="button" className={["copy-btn", className].filter(Boolean).join(" ")} onClick={copy}>
        <Icon name={copied ? "check" : "copy"} size={14} strokeWidth={2} />
        {copied ? "Copied" : "Copy"}
        {what ? <span className="sr-only"> {what}</span> : null}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}

/** For browsers or contexts without the async clipboard API */
function fallbackCopy(text: string): boolean {
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.top = "0";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}
