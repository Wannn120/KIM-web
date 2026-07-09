import Link from "next/link";
import type { Field } from "@/types";
import { formatCurrency } from "@/utils/formatting";

export function FieldCard({ field }: { field: Field }) {
  return (
    <article className="card-surface overflow-hidden">
      {field.imageUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] bg-[color:var(--surface)] sm:aspect-[16/9]">
          <img src={field.imageUrl} alt={field.name} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[color:rgba(15,23,42,0.9)] to-transparent px-5 py-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[color:var(--accent-strong)]">{field.type}</p>
          </div>
        </div>
      ) : null}
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-[color:var(--foreground)]">{field.name}</h3>
            <p className="text-sm text-[color:var(--muted)]">{field.location}</p>
          </div>
          <span className="rounded-full border border-[color:rgba(16,185,129,0.12)] bg-[color:rgba(255,255,255,0.78)] px-3 py-1 text-sm text-[color:var(--accent)]">
            {field.size}
          </span>
        </div>
        <div className="mb-4 flex items-center justify-between text-sm text-[color:var(--muted)]">
          <span>{field.rating} ★</span>
          <span className="text-white font-semibold">{formatCurrency(field.price)}/hour</span>
        </div>
        <p className="mb-6 text-sm leading-6 text-[color:var(--muted)]">
          Premium mini soccer turf with bright lighting, quality ball nets, and fast booking.
        </p>
        <Link href="/book" className="btn-primary">
          Book this field
        </Link>
      </div>
    </article>
  );
}
