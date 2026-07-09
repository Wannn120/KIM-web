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
      <div className="absolute inset-0 bg-slate-950/60" />
      <div className="relative px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl text-center text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
            {content.locationLabel}
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight sm:text-6xl lg:text-7xl">
            {content.heroTitle}
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl">
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
              <div key={facility.title} className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-4 backdrop-blur">
                <div className="relative h-40 overflow-hidden rounded-3xl bg-slate-900">
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
