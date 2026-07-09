"use client";

import { useEffect, useState } from "react";
import { siteContent, facilityImages } from "@/lib/mock-data";

export function HeroSection() {
  const [content, setContent] = useState(siteContent);

  useEffect(() => {
    const stored = window.localStorage.getItem("minisoccer-site-content");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setContent({ ...siteContent, ...parsed });
      } catch {
        setContent(siteContent);
      }
    }
  }, []);

  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(3, 7, 18, 0.7), rgba(3, 7, 18, 0.7)), url(${content.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[color:rgba(0,0,0,0.4)] backdrop-blur-sm" />
      <div className="relative px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-5xl text-center text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[color:var(--accent-strong)]">
            {content.locationLabel}
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            {content.heroTitle}
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
            {content.heroSubtitle}
          </p>

          <div className="mx-auto mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/book"
              className="btn-primary"
            >
              {content.ctaPrimary}
            </a>
            <a
              href="/booking-history"
              className="btn-secondary"
            >
              {content.ctaSecondary}
            </a>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {facilityImages.map((facility) => (
              <div key={facility.title} className="rounded-[2rem] border border-white/10 card-surface p-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-900 sm:aspect-[16/9]">
                  <img src={facility.imageUrl} alt={facility.title} className="h-full w-full object-cover" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{facility.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{facility.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
