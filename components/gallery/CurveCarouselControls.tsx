"use client";

interface CurveCarouselControlsProps {
  previous: () => void;
  next: () => void;
}

export function CurveCarouselControls({ previous, next }: CurveCarouselControlsProps) {
  return (
    <div className="flex items-center gap-4 rounded-[2rem] border border-white/10 bg-slate-950/70 px-4 py-3 shadow-[0_24px_72px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <button
        type="button"
        onClick={previous}
        className="h-12 w-12 rounded-full border border-white/10 bg-white/5 text-xl text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        aria-label="Sebelumnya"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={next}
        className="h-12 w-12 rounded-full border border-white/10 bg-white/5 text-xl text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        aria-label="Berikutnya"
      >
        ›
      </button>
    </div>
  );
}
