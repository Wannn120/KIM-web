"use client";

import { FormEvent, useState } from "react";
import { AnimatedCard } from "@/components/animated-card";

export function createRoleLoginPage(targetPath: string, title: string, subtitle: string) {
  return function RoleLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to sign in.");
        }

        window.location.assign(targetPath);
      } catch (caught) {
        setError((caught as Error).message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-6 py-16 lg:px-8">
        <div className="mx-auto w-full max-w-lg">
          <AnimatedCard className="p-8">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">{title}</p>
                <h1 className="mt-2 text-4xl font-semibold text-white">Masuk ke {subtitle}</h1>
                <p className="mt-3 text-sm text-[color:var(--muted)]">
                  Gunakan akun yang memiliki hak akses untuk role ini. Silakan masukkan email dan password Anda.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[color:var(--muted)]">Email</label>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@domain.com"
                    className="w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)/20]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[color:var(--muted)]">Password</label>
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan password Anda"
                    className="w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)/20]"
                  />
                </div>

                {error ? (
                  <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-300">!</span>
                      <div>
                        <p className="font-semibold text-white">Terjadi kesalahan</p>
                        <p className="mt-1 text-[0.95rem] text-rose-100">{error}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full rounded-3xl py-3 text-sm font-semibold disabled:opacity-60"
                >
                  {loading ? "Sedang masuk…" : "Masuk"}
                </button>
              </form>
            </div>
          </AnimatedCard>
        </div>
      </main>
    );
  };
}
