export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="flex-1 bg-slate-950 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-950/20">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Access portal</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Login or register to manage bookings</h1>
            <p className="mt-4 text-lg text-slate-400">
              This starter includes a customer and an admin entry point so the product can be extended with Clerk or Better Auth later.
            </p>
          </div>
          <div className="rounded-3xl border border-cyan-400/20 bg-slate-950/70 p-6">
            <h2 className="text-xl font-semibold text-white">Customer portal</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <label className="block">
                <span className="mb-2 block">Email</span>
                <input className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" placeholder="you@example.com" />
              </label>
              <label className="block">
                <span className="mb-2 block">Password</span>
                <input className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" type="password" placeholder="••••••••" />
              </label>
              <button className="w-full rounded-full bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
