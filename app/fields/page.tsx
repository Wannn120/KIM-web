import Link from "next/link";
import { FieldCard } from "@/components/field-card";
import { getFields } from "@/lib/data";

export const dynamic = "force-dynamic";

async function loadFields() {
  return await getFields();
}

export default async function FieldsPage() {
  const fields = await loadFields();

  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_40%)] px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Browse fields</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">Find a field for your next match</h1>
          </div>
          <Link href="/book" className="rounded-full border border-[color:rgba(16,185,129,0.24)] px-5 py-2 text-sm text-[color:var(--accent)] transition hover:bg-[color:rgba(16,185,129,0.06)]">
            Continue to booking
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {fields.map((field) => (
            <FieldCard key={field.id} field={field} />
          ))}
        </div>
      </div>
    </main>
  );
}
