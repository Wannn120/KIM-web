"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-rose-500/20 bg-[color:var(--surface)] p-6 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">Something went wrong</p>
        <h1 className="mt-4 text-balance text-3xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-4xl">A client-side error occurred</h1>
        <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
          The page failed to load correctly. Please refresh the page or try again in a few moments.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 inline-flex rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[color:var(--accent-strong)]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
