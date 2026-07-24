import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAdminSummary } from "@/lib/admin-dashboard";
import { getAuthenticatedAdminFromToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value ?? "";
  const admin = await getAuthenticatedAdminFromToken(token);

  if (!admin) {
    redirect("/admin/login");
  }

  const summary = getAdminSummary();

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-white/10 bg-[color:var(--surface-strong)] p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Admin dashboard</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Control panel</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Role: {admin.role}</span>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">Authenticated session active</span>
              </div>
            </div>
            <Link href="/admin/login" className="btn-secondary">Back to sign in</Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
            <p className="text-sm text-[color:var(--muted)]">Revenue today</p>
            <p className="mt-3 text-3xl font-semibold text-white">Rp {summary.revenueToday.toLocaleString("id-ID")}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
            <p className="text-sm text-[color:var(--muted)]">Revenue this month</p>
            <p className="mt-3 text-3xl font-semibold text-white">Rp {summary.revenueThisMonth.toLocaleString("id-ID")}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
            <p className="text-sm text-[color:var(--muted)]">Bookings today</p>
            <p className="mt-3 text-3xl font-semibold text-white">{summary.bookingsToday}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
            <p className="text-sm text-[color:var(--muted)]">Bookings this month</p>
            <p className="mt-3 text-3xl font-semibold text-white">{summary.bookingsThisMonth}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
            <h2 className="text-xl font-semibold text-white">Peak hours</h2>
            <div className="mt-4 space-y-3">
              {summary.peakHours.map((entry) => (
                <div key={entry.hour} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--muted)]">
                  <span>{entry.hour}</span>
                  <span className="text-white">{entry.bookings} bookings</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
            <h2 className="text-xl font-semibold text-white">Customer analytics</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--muted)]">
                <span>Total customers</span>
                <span className="text-white">{summary.customerStats.totalCustomers}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--muted)]">
                <span>Active customers</span>
                <span className="text-white">{summary.customerStats.activeCustomers}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--muted)]">
                <span>New customers this month</span>
                <span className="text-white">{summary.customerStats.newCustomersThisMonth}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
