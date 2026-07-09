"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

export function UserMenu() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem("minisoccer-user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const logout = () => {
    window.localStorage.removeItem("minisoccer-user");
    setUser(null);
    setOpen(false);
    window.location.href = "/";
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className="text-lg">👤</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-3 min-w-[220px] rounded-3xl border border-white/10 bg-slate-950/95 p-3 text-sm text-slate-200 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="rounded-3xl bg-slate-900/80 p-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-2xl text-slate-200">
                {user ? user.name.charAt(0).toUpperCase() : "?"}
              </div>
              <p className="mt-2 text-sm font-semibold text-white">{user ? user.name : "Guest"}</p>
              <p className="text-xs text-slate-400">{user ? user.email : "Sign in or sign up"}</p>
            </div>

          <div className="mt-4 space-y-2">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="block rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm transition hover:border-cyan-400/30 hover:bg-white/5"
                  onClick={() => setOpen(false)}
                >
                  Edit profile
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full rounded-2xl bg-cyan-500 px-3 py-2 text-left text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm transition hover:border-cyan-400/30 hover:bg-white/5"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="block rounded-2xl bg-cyan-500 px-3 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                  onClick={() => setOpen(false)}
                >
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
