"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setMessage("Nama, email, dan password wajib diisi.");
      return;
    }

    const user = { name, email, phone };
    window.localStorage.setItem("minisoccer-user", JSON.stringify(user));
    router.push("/profile");
  };

  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_transparent_35%)] px-6 py-16 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-950/20">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Join the platform</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">Create your account and start booking</h1>
          <p className="mt-4 text-lg text-slate-400">
            Unlock instant booking, secure payments, and personalized field recommendations.
          </p>
          <div className="mt-8 space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">✓ Fast booking in under 2 minutes</div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">✓ Smart reminders and confirmations</div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">✓ Live availability and secure checkout</div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-cyan-950/20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Create account</h2>
            <Link href="/login" className="text-sm text-cyan-300 hover:text-cyan-200">Sign in instead</Link>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-sm text-slate-300">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                <span className="mb-2 block">Full name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                  placeholder="Ari Putra"
                />
              </label>
              <label className="text-sm text-slate-300">
                <span className="mb-2 block">Phone</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                  placeholder="0812xxxx"
                />
              </label>
            </div>
            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                placeholder="you@example.com"
              />
            </label>
            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                type="password"
                placeholder="••••••••"
              />
            </label>
            <button className="w-full rounded-full bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
              Create account
            </button>
            {message ? <p className="text-sm text-rose-300">{message}</p> : null}
          </form>
        </section>
      </div>
    </main>
  );
}
