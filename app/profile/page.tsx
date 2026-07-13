"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<UserProfile>({ name: "", email: "", phone: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        const result = await response.json();
        if (!isMounted) return;

        if (response.ok && result?.success && result?.user) {
          setUser(result.user);
          setForm(result.user);
          window.localStorage.setItem("minisoccer-user", JSON.stringify(result.user));
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

  const saveProfile = () => {
    window.localStorage.setItem("minisoccer-user", JSON.stringify(form));
    setUser(form);
    setMessage("Profile updated successfully.");
    setTimeout(() => setMessage(""), 3000);
  };

  if (!user) {
    return (
      <main className="flex-1 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 card-surface p-10 text-center">
          <h1 className="text-3xl font-semibold text-white">Please login first</h1>
          <p className="mt-4 text-[color:var(--muted)]">Use the login or register button in the header to access your profile.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/login" className="btn-primary">Login</Link>
            <Link href="/register" className="btn-secondary">Register</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 card-surface p-10">
        <h1 className="text-3xl font-semibold text-white">My Profile</h1>
        <p className="mt-3 text-[color:var(--muted)]">You can update your name, email, and WhatsApp number here.</p>
        <div className="mt-8 grid gap-6">
          <label className="block text-sm text-[color:var(--muted)]">
            <span className="mb-2 block">Full name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-3xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
            />
          </label>
          <label className="block text-sm text-[color:var(--muted)]">
            <span className="mb-2 block">Email</span>
            <input
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-3xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
            />
          </label>
          <label className="block text-sm text-[color:var(--muted)]">
            <span className="mb-2 block">WhatsApp / Phone</span>
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="w-full rounded-3xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button type="button" onClick={saveProfile} className="btn-primary">
              Save profile
            </button>
            {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
