"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

export function UserMenu() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        const result = await response.json();
        if (!isMounted) return;

        if (response.ok && result?.success && result?.user) {
          setUser(result.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setUser(null);
      setOpen(false);
      window.location.href = "/";
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface)] text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:rgba(255,255,255,0.88)]"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className="text-lg">👤</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-3 min-w-[220px] rounded-3xl border border-[color:var(--border-strong)] card-surface p-3 text-sm text-[color:var(--foreground)] shadow-none">
            <div className="rounded-3xl bg-[color:var(--surface)] p-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface)] text-2xl text-[color:var(--foreground)]">
                {user ? user.name.charAt(0).toUpperCase() : "?"}
              </div>
              <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">{user ? user.name : "Guest"}</p>
              <p className="text-xs text-[color:var(--muted)]">{user ? user.email : "Sign in or sign up"}</p>
            </div>

          <div className="mt-4 space-y-2">
            <div className="rounded-3xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] p-3">
              <ThemeToggle />
            </div>
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="block rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)] transition hover:border-[color:rgba(16,185,129,0.12)] hover:bg-[color:rgba(255,255,255,0.9)]"
                  onClick={() => setOpen(false)}
                >
                  Edit profile
                </Link>
                <button type="button" onClick={logout} className="w-full rounded-2xl bg-[color:var(--accent)] px-3 py-2 text-left text-sm font-semibold text-slate-950 transition hover:bg-[color:var(--accent-strong)]">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)] transition hover:border-[color:rgba(16,185,129,0.12)] hover:bg-[color:rgba(255,255,255,0.9)]"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <Link href="/register" className="block rounded-2xl bg-[color:var(--accent)] px-3 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-[color:var(--accent-strong)]" onClick={() => setOpen(false)}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
