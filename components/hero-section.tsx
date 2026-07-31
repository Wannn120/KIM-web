"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { siteContent } from "@/lib/mock-data";
import type { FacilityImage } from "@/types";

export function HeroSection({ facilities, content = siteContent }: { facilities: FacilityImage[]; content?: typeof siteContent }) {
  const [assetsReady, setAssetsReady] = useState(false);
  const facilityUrls = useMemo(() => facilities.map((facility) => facility.imageUrl).join("|"), [facilities]);

  useEffect(() => {
    let cancelled = false;
    const urls = [content.backgroundImageUrl, ...facilities.map((facility) => facility.imageUrl)].filter(Boolean);
    let completed = 0;
    const finish = () => {
      completed += 1;
      if (!cancelled && completed >= urls.length) setAssetsReady(true);
    };

    setAssetsReady(false);
    if (urls.length === 0) {
      setAssetsReady(true);
      return () => { cancelled = true; };
    }

    const preloaders = urls.map((url) => {
      const image = new window.Image();
      image.onload = finish;
      image.onerror = finish;
      image.src = url;
      return image;
    });
    const timeout = window.setTimeout(() => {
      if (!cancelled) setAssetsReady(true);
    }, 15000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      preloaders.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [content.backgroundImageUrl, facilityUrls, facilities]);

  if (!assetsReady) {
    return (
      <section className="relative -mt-16 overflow-hidden bg-[color:var(--background)] pt-20 sm:pt-24" aria-busy="true" aria-label="Memuat halaman utama">
        <div className="absolute inset-0 hero-skeleton-bg" />
        <div className="relative px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <div className="hero-skeleton mx-auto h-3 w-40" />
            <div className="hero-skeleton mx-auto mt-6 h-12 max-w-3xl" />
            <div className="hero-skeleton mx-auto mt-7 h-4 max-w-2xl" />
            <div className="hero-skeleton mx-auto mt-3 h-4 max-w-xl" />
            <div className="mt-10 flex justify-center gap-4"><div className="hero-skeleton h-11 w-36 rounded-full" /><div className="hero-skeleton h-11 w-44 rounded-full" /></div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{facilities.map((facility, index) => <div key={facility.id ?? `${facility.title}-${index}`} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4"><div className="hero-skeleton aspect-[16/9] rounded-3xl" /><div className="hero-skeleton mx-auto mt-4 h-5 w-3/4" /><div className="hero-skeleton mx-auto mt-3 h-3 w-full" /><div className="hero-skeleton mx-auto mt-2 h-3 w-5/6" /></div>)}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden bg-[color:var(--background)] -mt-16 pt-20 sm:pt-24"
      style={{
        backgroundImage: `url(${content.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute left-1/2 top-6 h-96 w-96 -translate-x-1/2 rounded-full hero-accent blur-2xl" />
      <div className="pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full hero-glow blur-2xl shadow-[0_0_120px_rgba(255,255,255,0.65)]" />
      <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full hero-ring blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full hero-bottom blur-2xl" />
      <div className="absolute inset-0 hero-overlay" />
      <div className="relative px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-5xl text-center text-[color:var(--foreground)]">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[color:var(--accent-strong)]">
            {content.locationLabel}
          </p>
          <h1 className="hero-title mt-5 text-4xl font-semibold tracking-tight leading-[1.05] sm:text-5xl lg:text-6xl">
            {content.heroTitle}
          </h1>
          <p className="hero-subtitle mx-auto mt-8 max-w-2xl text-base font-medium leading-8 text-[color:var(--foreground)] sm:text-lg sm:leading-9">
            {content.heroSubtitle}
          </p>

          <div className="relative mx-auto mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[rgba(251,203,232,0.24)] via-[rgba(147,197,253,0.18)] to-[rgba(199,210,254,0.02)] blur-2xl" />
            <a
              href="/book"
              className="btn-primary relative z-10"
            >
              {content.ctaPrimary}
            </a>
            <a
              href="/booking-history"
              className="btn-secondary relative z-10"
            >
              {content.ctaSecondary}
            </a>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {facilities.map((facility) => (
              <div key={facility.id ?? facility.title} className="rounded-[2rem] border border-[color:var(--border-strong)] bg-[color:var(--surface)] p-4 shadow-sm backdrop-blur-xl">
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[color:var(--surface)] sm:aspect-[16/9]">
                  <Image src={facility.imageUrl} alt={facility.title} fill sizes="(max-width: 768px) 100vw, 25vw" loading="eager" className="object-cover" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[color:var(--foreground)]">{facility.title}</h3>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{facility.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
