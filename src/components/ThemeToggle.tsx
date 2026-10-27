"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

/** Light by default. The choice is remembered per browser. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("robodex-theme", next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      style={{
        width: 38,
        height: 38,
        borderRadius: 9,
        border: "1px solid var(--line)",
        background: "var(--bg)",
        color: "var(--muted)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
    </button>
  );
}

/** Runs before paint so a saved dark choice never flashes light */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("robodex-theme");if(t==="dark"){document.documentElement.dataset.theme="dark";}}catch(e){}})();`;
