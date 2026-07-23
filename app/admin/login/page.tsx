"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedCard } from "@/components/animated-card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@klatenminisoccer.id");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to sign in.");
      }

      router.push("/admin");
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-xl">
        <AnimatedCard className="p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Admin access</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">Sign in to the dashboard</h1>
          <p className="mt-3 text-[color:var(--muted)]">Use the seeded admin credentials to open the control panel.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--muted)]">Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none focus:border-[color:var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[color:var(--muted)]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none focus:border-[color:var(--accent)]"
              />
            </div>

            {error ? (
              <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
            ) : null}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </AnimatedCard>
      </div>
    </main>
  );
}
