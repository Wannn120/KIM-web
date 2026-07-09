"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("minisoccer-theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    window.localStorage.setItem("minisoccer-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:rgba(255,255,255,0.92)]"
    >
      <span>{theme === "light" ? "☀️" : "🌙"}</span>
      <span>{theme === "light" ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}
