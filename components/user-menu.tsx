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
    window.location.href = "/";
  };

  return (
    <div className="relative">
      {user ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            {user.name.charAt(0).toUpperCase()}
          </button>
          {open ? (
            <div className="absolute right-0 mt-3 w-48 rounded-3xl border border-white/10 bg-slate-950/95 p-3 text-sm text-slate-200 shadow-2xl shadow-black/40 backdrop-blur">
              <p className="font-semibold text-white">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
              <div className="mt-3 space-y-2">
                <Link href="/profile" className="block rounded-2xl px-3 py-2 transition hover:bg-white/5">Manage profile</Link>
                <button type="button" onClick={logout} className="w-full rounded-2xl bg-cyan-500 px-3 py-2 text-left text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20">
            Login
          </Link>
          <Link href="/register" className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
            Register
          </Link>
        </div>
      )}
    </div>
  );
}
