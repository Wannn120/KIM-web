"use client";

import { useEffect, useState } from "react";

function readStoredTheme(): "light" | "dark" {
  try {
    const savedTheme = window.localStorage.getItem("minisoccer-theme");
    return savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
  } catch {
    return "light";
  }
}

function writeStoredTheme(nextTheme: "light" | "dark") {
  try {
    window.localStorage.setItem("minisoccer-theme", nextTheme);
  } catch {
    // Ignore storage issues in restricted or private browsing environments.
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = readStoredTheme();
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    writeStoredTheme(next);
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
