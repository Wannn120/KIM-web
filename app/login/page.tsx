"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMessage("Email dan password wajib diisi.");
      return;
    }

    const name = email.split("@")[0] || "Player";
    const user = { name, email, phone: "" };
    window.localStorage.setItem("minisoccer-user", JSON.stringify(user));
    router.push("/profile");
  };

  return (
    <main className="flex-1 bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-[0_20px_80px_rgba(16,185,129,0.08)]">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Access portal</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Login untuk melanjutkan booking</h1>
            <p className="mt-4 text-base text-slate-400 sm:text-lg">
              Masuk cepat dengan email, lalu pesan slot lapangan dan kelola profil pengguna Anda.
            </p>
          </div>
          <div className="rounded-3xl border border-cyan-400/20 bg-slate-950/70 p-6">
            <h2 className="text-xl font-semibold text-white">Customer portal</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm text-slate-300">
              <label className="block">
                <span className="mb-2 block">Email</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block">
                <span className="mb-2 block">Password</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                  type="password"
                  placeholder="••••••••"
                />
              </label>
              <button className="btn-primary">
                Sign in
              </button>
              {message ? <p className="text-sm text-rose-300">{message}</p> : null}
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
