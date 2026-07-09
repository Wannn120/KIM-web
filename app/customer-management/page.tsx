import { AnimatedCard } from "@/components/animated-card";

const customers = [
  { name: "Ari Putra", bookings: 12, status: "Active" },
  { name: "Rina Sari", bookings: 7, status: "Active" },
  { name: "Bima Kurnia", bookings: 3, status: "Pending" },
];

export const dynamic = "force-dynamic";

export default function CustomerManagementPage() {
  return (
    <main className="flex-1 bg-[color:var(--background)] px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AnimatedCard className="p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Customer management</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Maintain relationships and engagement</h1>
            </div>
            <button className="rounded-full border border-[color:rgba(16,185,129,0.18)] bg-[color:rgba(16,185,129,0.06)] px-4 py-2 text-sm text-[color:var(--accent)]">+ Add customer</button>
          </div>

          <div className="mt-8 grid gap-4">
            {customers.map((customer) => (
              <div key={customer.name} className="flex flex-col gap-3 rounded-2xl border border-white/10 card-surface p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-white">{customer.name}</h3>
                  <p className="text-sm text-slate-400">{customer.bookings} bookings</p>
                </div>
                <span className="rounded-full bg-[color:rgba(16,185,129,0.12)] px-3 py-1 text-sm text-[color:var(--accent)]">{customer.status}</span>
              </div>
            ))}
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
}
