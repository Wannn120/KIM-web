"use client";

import Image from "next/image";
import Link from "next/link";
import { type PointerEvent, useEffect, useState } from "react";
import type { VenueGalleryImage } from "@/types";

function normalizeOffset(index: number, activeIndex: number, count: number) {
  const raw = index - activeIndex;
  const half = Math.floor(count / 2);
  if (raw > half) return raw - count;
  if (raw < -half) return raw + count;
  return raw;
}

export default function VenueGalleryCarousel({ images, price }: { images: VenueGalleryImage[]; price: number }) {
  const [active, setActive] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverRotation, setHoverRotation] = useState({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const count = images.length;

  useEffect(() => {
    if (count < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % count), 5500);
    return () => window.clearInterval(timer);
  }, [count]);

  useEffect(() => {
    const updateWidth = () => setContainerWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleCardPointerMove = (index: number, event: PointerEvent<HTMLButtonElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 20;
    setHoveredIndex(index);
    setHoverRotation({ x, y });
  };

  const handleCardPointerLeave = () => {
    setHoveredIndex(null);
    setHoverRotation({ x: 0, y: 0 });
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null || touchStartY === null) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) next();
      else previous();
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  if (count === 0) return null;

  const previous = () => setActive((currentIndex) => (currentIndex - 1 + count) % count);
  const next = () => setActive((currentIndex) => (currentIndex + 1) % count);

  return (
    <section aria-labelledby="venue-gallery-heading" className="rounded-[3rem] border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] px-4 py-12 shadow-[0_24px_80px_rgba(15,23,42,0.06)] sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Galeri lapangan</p>
            <h2 id="venue-gallery-heading" className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Klaten International Minisoccer</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">Lihat berbagai sudut lapangan sebelum memilih jadwal bermain.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Harga sewa</p>
            <p className="mt-1 text-lg font-semibold text-white">Rp {price.toLocaleString("id-ID")}<span className="text-sm font-normal text-[color:var(--muted)]"> / jam</span></p>
          </div>
        </div>

        <div className="relative overflow-visible rounded-[3rem] border border-white/10 bg-black/20 px-4 py-10 sm:px-6">
          <div className="pointer-events-none absolute inset-x-4 top-0 h-40 rounded-b-[2.5rem] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_56%)]" />
          <div className="pointer-events-none absolute left-1/2 top-[18%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-400/12 via-transparent to-transparent blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.12),transparent_45%)]" />

          <div className="relative mx-auto flex min-h-[340px] items-center justify-center overflow-visible" style={{ perspective: 1800 }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="relative flex h-[320px] items-center justify-center" style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d" }}>
              {images.map((image, index) => {
                const offset = normalizeOffset(index, active, count);
                const absOffset = Math.abs(offset);
                const width = containerWidth || 1024;
                const maxVisible = width < 640 ? 1 : width < 1024 ? 2 : 3;
                if (absOffset > maxVisible) return null;

                const spacing = width < 640 ? 110 : width < 1024 ? 140 : 190;
                const translateX = offset * spacing;
                const rotateY = offset * 18;
                const isActive = offset === 0;
                const scale = isActive ? 1.1 : width < 640 ? 0.9 - absOffset * 0.02 : 0.86 - absOffset * 0.04;
                const cardWidth = isActive ? Math.min(Math.max(width * 0.42, 220), 300) : Math.min(Math.max(width * 0.34, 170), 230);
                const cardHeight = isActive ? Math.min(Math.max(width * 0.44, 280), 340) : Math.min(Math.max(width * 0.37, 240), 280);
                const zIndex = 30 - absOffset;
                const opacity = isActive ? 1 : 0.6;
                const saturation = isActive ? 1 : 0.7;
                const cardShadow = isActive ? "0 54px 160px rgba(16,185,129,0.24)" : "0 30px 100px rgba(0,0,0,0.26)";
                const activeGlowClass = isActive ? "opacity-100" : "opacity-0";
                const activeLabelClass = isActive ? "from-black/95 via-black/65 to-transparent" : "from-black/90 to-transparent";
                const floatY = isActive ? -10 : 0;

                const tiltX = hoveredIndex === index ? -hoverRotation.y : 0;
                const tiltY = hoveredIndex === index ? hoverRotation.x : 0;

                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActive(index)}
                    onPointerMove={(event) => handleCardPointerMove(index, event)}
                    onPointerLeave={handleCardPointerLeave}
                    aria-label={`Tampilkan ${image.title}`}
                    className="absolute top-1/2 left-1/2 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 transition duration-500 hover:shadow-[0_30px_120px_rgba(0,0,0,0.32)]"
                    style={{
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                      transform: `translateX(${translateX}px) translateZ(${-absOffset * 48}px) translateY(calc(-50% + ${floatY}px + var(--card-float, 0px))) rotateY(${rotateY + tiltY}deg) rotateX(${tiltX}deg) scale(${scale}) translateX(-50%)`,
                      zIndex,
                      opacity,
                      filter: `saturate(${saturation})`,
                      boxShadow: cardShadow,
                      animation: isActive ? "floatingCard 6s ease-in-out infinite" : undefined,
                      transformStyle: "preserve-3d",
                      WebkitTransformStyle: "preserve-3d",
                    }}
                  >
                    <div className={`pointer-events-none absolute inset-x-0 top-0 h-full rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_45%)] transition duration-500 ${activeGlowClass}`} />
                    <div className="relative h-full overflow-hidden rounded-[2rem] bg-slate-950">
                      <Image src={image.imageUrl} alt={image.title} fill sizes="(max-width: 1024px) 60vw, 320px" className="object-cover" />
                    </div>
                    <div className={`absolute inset-x-0 bottom-0 rounded-b-[2rem] bg-gradient-to-t ${activeLabelClass} px-4 pb-4 pt-5 text-left transition duration-300`}>
                      <p className="text-[0.65rem] uppercase tracking-[0.25em] text-emerald-300">Foto {String(index + 1).padStart(2, "0")}</p>
                      <h3 className="mt-2 text-sm font-semibold text-white">{image.title}</h3>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={previous} aria-label="Foto sebelumnya" className="rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xl text-white transition hover:bg-white/10">‹</button>
            <button type="button" onClick={next} aria-label="Foto berikutnya" className="rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xl text-white transition hover:bg-white/10">›</button>
          </div>

          <div className="flex items-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActive(index)}
                className={`h-2.5 w-2.5 rounded-full transition ${index === active ? "bg-emerald-400" : "bg-white/25 hover:bg-white/40"}`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>

          <Link href="/book" className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">
            Booking sekarang →
          </Link>
        </div>
      </div>
    </section>
  );
}
