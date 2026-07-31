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
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => setContainerWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const visibleRange = containerWidth < 640 ? 1 : containerWidth < 1024 ? 2 : 3;
  const activeImage = images[activeIndex];
  const itemWidth = containerWidth < 640 ? 220 : containerWidth < 1024 ? 260 : 320;
  const itemHeight = Math.round(itemWidth * 1.26);

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
      if (info.offset.x < -64) next();
      if (info.offset.x > 64) previous();
    },
    [next, previous]
  );

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (Math.abs(event.deltaY) < 16) return;
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
      className="rounded-[3rem] border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] px-4 py-12 shadow-[0_24px_80px_rgba(15,23,42,0.06)] sm:px-6 lg:px-8 lg:py-16"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Galeri lapangan</p>
            <h2 id="venue-gallery-heading" className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Klaten International Minisoccer</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">Selami suasana lapangan lewat galeri premium dengan efek lengkung 3D dan fokus pada foto utama.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Harga sewa</p>
            <p className="mt-1 text-lg font-semibold text-white">Rp {price.toLocaleString("id-ID")}<span className="text-sm font-normal text-[color:var(--muted)]"> / jam</span></p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-black/10 px-4 py-10 shadow-[0_40px_140px_rgba(0,0,0,0.18)] sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-x-6 top-0 h-40 rounded-b-[2.5rem] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_55%)]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/12 blur-4xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[radial-gradient(circle_at_bottom,rgba(0,0,0,0.22),transparent_35%)]" />

          <motion.div
            className="relative mx-auto flex h-[min(58vw,540px)] max-w-full items-center justify-center overflow-visible px-3"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.14}
            onDragEnd={handleDragEnd}
            onWheel={handleWheel}
            role="group"
            aria-label="Curve gallery"
          >
            {visibleItems.map(({ image, offset }) => (
              <CurveCarouselItem
                key={image.id}
                image={image}
                offset={offset}
                isActive={offset === 0}
                width={itemWidth}
                height={itemHeight}
                onSelect={() => setActiveIndex(images.indexOf(image))}
              />
            ))}
          </motion.div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:gap-10">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/80 px-6 py-8 shadow-[0_40px_120px_rgba(0,0,0,0.24)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_30%)]" />
              <div className="relative">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Foto unggulan</p>
                <h3 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">{activeImage.title}</h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">{activeImage.description ?? "Jelajahi suasana lapangan terbaik dengan perspektif premium yang menonjolkan foto utama."}</p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/80">{String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
                  <Link href="/book" className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">
                    Booking sekarang →
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <CurveCarouselControls previous={previous} next={next} />
              <CurveCarouselDots activeIndex={activeIndex} count={images.length} onSelect={setActiveIndex} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
