"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCsrfToken = async () => {
      try {
        const response = await fetch("/api/security/csrf", { credentials: "include" });
        const result = await response.json();
        if (isMounted && result?.data?.csrfToken) {
          setCsrfToken(result.data.csrfToken);
        }
      } catch {
        if (isMounted) {
          setMessage("Tidak bisa memuat token keamanan awal.");
        }
      }
    };

    loadCsrfToken();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage("Email dan password wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, csrfToken }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        setMessage(result?.message || "Login gagal. Silakan coba lagi.");
        return;
      }

      const user = {
        id: result?.user?.id || email,
        name: result?.user?.name || email.split("@")[0] || "Player",
        email: result?.user?.email || email,
        phone: result?.user?.phone || "",
        role: result?.user?.role || "customer",
      };

      window.localStorage.setItem("minisoccer-user", JSON.stringify(user));
      if (typeof result?.token === "string") {
        window.localStorage.setItem("minisoccer-auth-token", result.token);
      }
      router.push("/profile");
    } catch {
      setMessage("Tidak dapat terhubung ke server saat ini.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_35%)] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <AuthPanel
          eyebrow="Access portal"
          title="Masuk untuk lanjutkan booking"
          description="Masuk dengan akun Anda agar bisa memesan lapangan, melihat riwayat booking, dan mengelola profil secara cepat."
          features={[
            "Akses booking lebih cepat",
            "Lihat riwayat dan status pembayaran",
            "Data akun tersimpan aman",
          ]}
        />

        <section className="rounded-[2rem] border border-white/10 card-surface p-8 shadow-2xl shadow-[0_20px_80px_rgba(16,185,129,0.06)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold text-white">Sign in</h2>
            <Link href="/register" className="text-sm text-[color:var(--accent)] hover:text-[color:var(--accent-strong)]">
              Sign up instead
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-sm text-[color:var(--muted)]">
            <label className="block text-sm text-[color:var(--muted)]">
              <span className="mb-2 block">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
                placeholder="you@example.com"
              />
            </label>
            <label className="block text-sm text-[color:var(--muted)]">
              <span className="mb-2 block">Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
                type="password"
                placeholder="••••••••"
              />
            </label>
            <button className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
            <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
              <span>Belum punya akun?</span>
              <Link href="/register" className="text-[color:var(--accent)] hover:text-[color:var(--accent-strong)]">
                Buat akun sekarang
              </Link>
            </div>
            {message ? <p className="text-sm text-rose-300">{message}</p> : null}
          </form>
        </section>
      </div>
    </main>
  );
}
