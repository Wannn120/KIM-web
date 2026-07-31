"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { VenueGalleryImage } from "@/types";

export default function VenueGalleryCarousel({ images, price }: { images: VenueGalleryImage[]; price: number }) {
  const [active, setActive] = useState(0);
  const count = images.length;

  useEffect(() => {
    if (count < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % count), 5000);
    return () => window.clearInterval(timer);
  }, [count]);

  if (count === 0) return null;
  const current = images[active] ?? images[0];
  const previous = () => setActive((currentIndex) => (currentIndex - 1 + count) % count);
  const next = () => setActive((currentIndex) => (currentIndex + 1) % count);

  return <section aria-labelledby="venue-gallery-heading" className="rounded-[3rem] border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] px-4 py-12 shadow-[0_24px_80px_rgba(15,23,42,0.06)] sm:px-6 lg:px-8 lg:py-16">
    <div className="mx-auto max-w-7xl"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Galeri lapangan</p><h2 id="venue-gallery-heading" className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Klaten International Minisoccer</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">Lihat berbagai sudut lapangan sebelum memilih jadwal bermain.</p></div><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right"><p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Harga sewa</p><p className="mt-1 text-lg font-semibold text-white">Rp {price.toLocaleString("id-ID")}<span className="text-sm font-normal text-[color:var(--muted)]"> / jam</span></p></div></div>
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center"><div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/20"><div className="relative aspect-[16/10] min-h-[240px]"><Image key={current.id} src={current.imageUrl} alt={current.title} fill priority={active === 0} sizes="(max-width: 1024px) 100vw, 70vw" className="object-cover transition-opacity duration-500"/></div><div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 pt-16"><div><p className="text-xs uppercase tracking-[0.25em] text-emerald-300">{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</p><h3 className="mt-1 text-xl font-semibold text-white">{current.title}</h3></div><div className="flex gap-2"><button type="button" onClick={previous} aria-label="Foto sebelumnya" className="rounded-full border border-white/30 bg-black/30 px-4 py-2 text-xl text-white hover:bg-white/20">‹</button><button type="button" onClick={next} aria-label="Foto berikutnya" className="rounded-full border border-white/30 bg-black/30 px-4 py-2 text-xl text-white hover:bg-white/20">›</button></div></div></div><div className="flex flex-row gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-2 lg:overflow-visible">{images.map((image, index) => <button type="button" key={image.id} onClick={() => setActive(index)} aria-label={`Tampilkan ${image.title}`} className={`relative min-w-[130px] overflow-hidden rounded-2xl border p-1 transition sm:min-w-[160px] lg:min-w-0 ${index === active ? "border-emerald-400 ring-2 ring-emerald-400/30" : "border-white/10 opacity-70 hover:opacity-100"}`}><Image src={image.imageUrl} alt={image.title} width={220} height={130} className="h-20 w-full rounded-xl object-cover"/><span className="block truncate px-1 py-2 text-left text-xs text-white">{image.title}</span></button>)}</div></div><div className="mt-7 flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-[color:var(--muted)]">Foto berganti otomatis setiap 5 detik.</p><Link href="/book" className="btn-primary">Booking sekarang →</Link></div></div>
  </section>;
}
