import Link from "next/link";
import type { Field } from "@/types";
import { formatCurrency } from "@/utils/formatting";

export function FieldCard({ field }: { field: Field }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-cyan-950/20">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">{field.name}</h3>
          <p className="text-sm text-slate-400">{field.location}</p>
        </div>
        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm text-cyan-300">
          {field.type}
        </span>
      </div>
      <div className="mb-4 flex items-center gap-3 text-sm text-slate-400">
        <span>{field.size}</span>
        <span>•</span>
        <span>{field.rating} ★</span>
      </div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-lg font-semibold text-white">{formatCurrency(field.price)}</p>
        <p className="text-sm text-slate-400">/ hour</p>
      </div>
      <Link
        href="/book"
        className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
      >
        Book this field
      </Link>
    </article>
  );
}
