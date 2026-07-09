import Link from "next/link";
import type { Field } from "@/types";
import { formatCurrency } from "@/utils/formatting";

export function FieldCard({ field }: { field: Field }) {
  return (
    <article className="card-surface overflow-hidden">
      {field.imageUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] bg-slate-800 sm:aspect-[16/9]">
          <img src={field.imageUrl} alt={field.name} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent px-5 py-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">{field.type}</p>
          </div>
        </div>
      ) : null}
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">{field.name}</h3>
            <p className="text-sm text-slate-400">{field.location}</p>
          </div>
          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300">
            {field.size}
          </span>
        </div>
        <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
          <span>{field.rating} ★</span>
          <span className="text-white font-semibold">{formatCurrency(field.price)}/hour</span>
        </div>
        <p className="mb-6 text-sm leading-6 text-slate-300">
          Premium mini soccer turf with bright lighting, quality ball nets, and fast booking.
        </p>
        <Link
          href="/book"
          className="inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Book this field
        </Link>
      </div>
    </article>
  );
}
