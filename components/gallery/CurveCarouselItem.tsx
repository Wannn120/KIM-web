"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { VenueGalleryImage } from "@/types";

interface CurveCarouselItemProps {
  image: VenueGalleryImage;
  offset: number;
  isActive: boolean;
  width: number;
  height: number;
  onSelect: () => void;
}

const itemVariants = {
  active: {
    zIndex: 20,
    opacity: 1,
    scale: 1,
    rotateY: 0,
    rotateZ: 0,
    x: 0,
    y: [0, -9, 0],
    z: 0,
    filter: "blur(0px)",
    boxShadow: "0 42px 140px rgba(16,185,129,0.24)",
    transition: { duration: 5, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const },
  },
  left: (offset: number) => ({
    zIndex: 10,
    opacity: 0.6,
    scale: 0.82,
    rotateY: 22,
    rotateZ: -6,
    x: -offset * 180,
    y: 18,
    z: -offset * 130,
    filter: "blur(1.4px)",
    boxShadow: "0 28px 100px rgba(0,0,0,0.24)",
    transition: { type: "spring" as const, stiffness: 110, damping: 18 },
  }),
  right: (offset: number) => ({
    zIndex: 10,
    opacity: 0.6,
    scale: 0.82,
    rotateY: -22,
    rotateZ: 6,
    x: offset * 180,
    y: 18,
    z: -offset * 130,
    filter: "blur(1.4px)",
    boxShadow: "0 28px 100px rgba(0,0,0,0.24)",
    transition: { type: "spring" as const, stiffness: 110, damping: 18 },
  }),
};

export function CurveCarouselItem({ image, offset, isActive, width, height, onSelect }: CurveCarouselItemProps) {
  const direction = offset < 0 ? "left" : offset > 0 ? "right" : "active";
  const variant = direction === "active" ? "active" : direction;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={isActive ? { scale: 1.02, y: -4 } : { scale: 0.9 }}
      whileTap={{ scale: isActive ? 0.98 : 0.84 }}
      className="absolute top-1/2 left-1/2 focus-visible:outline-none"
      style={{ width, height, transformStyle: "preserve-3d", perspective: 1800 }}
      custom={Math.abs(offset)}
      variants={itemVariants}
      animate={variant}
      initial={false}
      aria-label={`Tampilkan ${image.title}`}
    >
      <div className="relative h-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/90 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%)]" />
        <Image
          src={image.imageUrl}
          alt={image.title}
          fill
          sizes="(max-width: 1024px) 80vw, 400px"
          className="object-cover transition duration-500"
          priority={isActive}
        />
        <div className="absolute inset-x-0 bottom-0 rounded-b-[2.5rem] bg-gradient-to-t from-black/80 to-transparent p-5 backdrop-blur-sm">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-emerald-300">Foto {String(image.sortOrder + 1).padStart(2, "0")}</p>
          <h3 className="mt-2 text-sm font-semibold text-white line-clamp-2">{image.title}</h3>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_55%)] opacity-0 transition duration-300 hover:opacity-100" />
    </motion.button>
  );
}
