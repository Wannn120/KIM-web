"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { VenueGalleryImage } from "@/types";
import { useCarousel } from "@/hooks/useCarousel";
import { CurveCarouselControls } from "./CurveCarouselControls";
import { CurveCarouselDots } from "./CurveCarouselDots";
import { CurveCarouselItem } from "./CurveCarouselItem";

interface CurveCarouselProps {
  images: VenueGalleryImage[];
  price: number;
}

function normalizeOffset(index: number, activeIndex: number, count: number) {
  const raw = index - activeIndex;
  const half = Math.floor(count / 2);

  if (raw > half) return raw - count;
  if (raw < -half) return raw + count;
  return raw;
}

export default function CurveCarousel({ images, price }: CurveCarouselProps) {
  const { activeIndex, previous, next, setActiveIndex, handleKeyDown } = useCarousel(images.length);
  const [viewportWidth, setViewportWidth] = useState(1280);

  useEffect(() => {
    const updateWidth = () => setViewportWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
  const visibleRange = isMobile ? 1 : isTablet ? 2 : 3;
  const cardWidth = isMobile ? 300 : isTablet ? 340 : 420;
  const cardHeight = Math.round(cardWidth * 1.28);
  const spacing = isMobile ? 160 : isTablet ? 200 : 250;
  const activeImage = images[activeIndex];

  const visibleItems = useMemo(
    () =>
      images
        .map((image, index) => {
          const offset = normalizeOffset(index, activeIndex, images.length);
          return {
            image,
            offset,
            isVisible: Math.abs(offset) <= visibleRange,
          };
        })
        .filter((item) => item.isVisible),
    [images, activeIndex, visibleRange]
  );

  const handleDragEnd = useCallback(
    (_event: unknown, info: { offset: { x: number } }) => {
      if (info.offset.x < -80) next();
      if (info.offset.x > 80) previous();
    },
    [next, previous]
  );

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (Math.abs(event.deltaY) < 18) return;
      event.preventDefault();
      if (event.deltaY > 0) next();
      else previous();
    },
    [next, previous]
  );

  if (!images.length) return null;

  return (
    <section
      aria-labelledby="venue-gallery-heading"
      className="rounded-[3rem] border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] px-5 py-12 shadow-[0_24px_80px_rgba(15,23,42,0.06)] sm:px-6 lg:px-8 lg:py-16"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Galeri lapangan</p>
            <h2 id="venue-gallery-heading" className="mt-4 text-4xl font-semibold text-white leading-tight sm:text-5xl">
              Klaten International Minisoccer
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[color:var(--muted)] sm:text-lg">
              Jelajahi koleksi foto lapangan premium yang menempatkan setiap gambar dalam ruang bernapas dan fokus visual berkelas.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80 shadow-[0_18px_48px_rgba(0,0,0,0.16)]">
            <span className="font-semibold text-white">Harga sewa</span>
            <span className="rounded-full bg-slate-950/60 px-3 py-2 text-sm text-emerald-300">Rp {price.toLocaleString("id-ID")} / jam</span>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:items-start">
          <div className="space-y-6">
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.20)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Detail lapangan</p>
              <h3 className="mt-5 text-4xl font-semibold text-white leading-tight">Galeri premium dengan komposisi elegan</h3>
              <p className="mt-6 text-base leading-8 text-[color:var(--muted)]">
                Semua gambar ditarik langsung dari Supabase. Komposisi ini menampilkan foto utama yang besar dengan ruang bernapas, tipografi tegas, dan kontrol halus.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Jumlah gambar</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{images.length}</p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Fokus saat ini</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{activeImage.title}</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/book"
                  className="inline-flex min-w-[190px] items-center justify-center rounded-full bg-emerald-400 px-8 py-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  Booking sekarang
                </Link>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                  {String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
                </span>
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-white/10 bg-white/5/10 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.14)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Keterangan</p>
              <p className="mt-5 text-base leading-8 text-[color:var(--muted)]">
                {activeImage.description ?? "Galeri ini menempatkan foto utama di tengah sambil tetap menunjukkan preview halus dari gambar terdekat. Navigasi dan indikator disusun rapi untuk pengalaman yang lebih mewah."}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-slate-950/70 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.24)]">
            <div className="pointer-events-none absolute inset-0 rounded-[3rem] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_75%)]" />
            <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-16 h-[260px] w-[260px] rounded-full bg-slate-900/60 blur-3xl" />

            <motion.div
              className="relative mx-auto flex h-[min(68vw,640px)] items-center justify-center overflow-visible"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={handleDragEnd}
              onWheel={handleWheel}
              role="group"
              aria-label="Gallery carousel"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-40 w-40 rounded-full bg-slate-900/50 blur-3xl" />
              </div>

              {visibleItems.map(({ image, offset }) => (
                <CurveCarouselItem
                  key={image.id}
                  image={image}
                  offset={offset}
                  isActive={offset === 0}
                  width={cardWidth}
                  height={cardHeight}
                  spacing={spacing}
                  onSelect={() => setActiveIndex(images.indexOf(image))}
                />
              ))}
            </motion.div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CurveCarouselDots activeIndex={activeIndex} count={images.length} onSelect={setActiveIndex} />
              <div className="flex justify-end">
                <CurveCarouselControls previous={previous} next={next} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
