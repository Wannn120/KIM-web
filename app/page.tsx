import Link from "next/link";
import { FieldCard } from "@/components/field-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { bookingSteps, fields } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_38%)] px-6 py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
                Mini soccer booking platform
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Book your next match in minutes.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
                Discover premium mini soccer fields, reserve your perfect slot, and pay securely with a beautiful experience built for players and venue owners.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/fields"
                  className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition duration-200 hover:bg-cyan-400"
                >
                  Browse fields
                </Link>
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-6 py-3 font-semibold text-cyan-300 transition duration-200 hover:bg-cyan-500/20"
                >
                  Start booking
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-400">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  24/7 availability
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Secure payments
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Instant confirmation
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(6,182,212,0.16)] backdrop-blur">
              <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                  How it works
                </p>
                <div className="mt-6 space-y-4">
                  {bookingSteps.map((step, index) => (
                    <div
                      key={step.title}
                      className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-semibold text-cyan-300">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{step.title}</h3>
                        <p className="mt-1 text-sm text-slate-400">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
                  Featured fields
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  Popular venues ready for your next game
                </h2>
              </div>
              <Link href="/fields" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
                View all fields →
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {fields.slice(0, 3).map((field) => (
                <FieldCard key={field.id} field={field} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
