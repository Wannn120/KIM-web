import Link from "next/link";
import { HeroSection } from "@/components/hero-section";
import { ReviewSection } from "@/components/review-section";
import { FieldCard } from "@/components/field-card";
import { fields } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="flex-1">
      <HeroSection />

      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Lapangan unggulan</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Satu lapangan terbaik untuk setiap laga</h2>
            </div>
            <Link href="/book" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
              Booking sekarang →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {fields.map((field) => (
              <FieldCard key={field.id} field={field} />
            ))}
          </div>
        </div>
      </section>

      <ReviewSection />

      <section className="border-t border-white/10 bg-slate-950/80 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Lokasi lapangan</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Temukan lapangan kami di Klaten</h2>
              <p className="mt-4 text-lg text-slate-400 max-w-2xl">
                Lapangan terletak strategis, mudah dijangkau, dan didukung fasilitas pendukung untuk tim mini soccer.
              </p>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70">
              <iframe
                title="Klaten International Minisoccer location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=110.5950%2C-7.7210%2C110.6110%2C-7.7020&layer=mapnik"
                className="h-[360px] w-full border-0"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
