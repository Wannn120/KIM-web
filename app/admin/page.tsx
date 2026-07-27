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

  const summary = await getAdminSummary();
  const permissions = [
    { label: "Manage fields", allowed: admin.permissions.canManageFields },
    { label: "Manage bookings", allowed: admin.permissions.canManageBookings },
    { label: "Manage payments", allowed: admin.permissions.canManagePayments },
    { label: "Manage schedule", allowed: admin.permissions.canManageSchedule },
    { label: "Manage CMS", allowed: admin.permissions.canManageCMS },
    { label: "Manage admins", allowed: admin.permissions.canManageAdmins },
    { label: "View reports", allowed: admin.permissions.canViewReports },
    { label: "Verify payments", allowed: admin.permissions.canVerifyPayments },
    { label: "Create bookings", allowed: admin.permissions.canCreateBookings },
    { label: "Read bookings", allowed: admin.permissions.canReadBookings },
    { label: "Manage settings", allowed: admin.permissions.canManageSettings },
  ];

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
            <p className="text-sm text-[color:var(--muted)]">Role permissions</p>
            <div className="mt-4 space-y-2">
              {permissions.map((permission) => (
                <div key={permission.label} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--muted)]">
                  <span>{permission.label}</span>
                  <span className={permission.allowed ? "text-emerald-300" : "text-rose-300"}>
                    {permission.allowed ? "Allowed" : "Denied"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {admin.permissions.canViewReports ? (
            <>
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
            </>
          ) : (
            <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6 md:col-span-3 xl:col-span-3">
              <h2 className="text-xl font-semibold text-white">Report access restricted</h2>
              <p className="mt-3 text-sm text-[color:var(--muted)]">
                Your current role does not include report access. Use the permitted actions above to manage bookings, verify payments, or collaborate with your team.
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
            <h2 className="text-xl font-semibold text-white">Quick access</h2>
            <div className="mt-4 space-y-3">
              {admin.permissions.canManageAdmins && (
                <Link href="/sql-editor" className="block rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white transition hover:border-[color:var(--accent)]">
                  SQL Query Editor
                </Link>
              )}
              {admin.permissions.canViewReports && (
                <div className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white/75">
                  Reports enabled
                </div>
              )}
              {admin.permissions.canManageFields && (
                <div className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white/75">
                  Field management enabled
                </div>
              )}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
            <h2 className="text-xl font-semibold text-white">Action guidance</h2>
            <div className="mt-4 space-y-3 text-sm text-[color:var(--muted)]">
              <p>{admin.permissions.canManageAdmins ? "Super admin access is available." : "Super admin actions are locked."}</p>
              <p>{admin.permissions.canViewReports ? "Reporting and analytics are enabled." : "Reports are unavailable for this role."}</p>
              <p>{admin.permissions.canCreateBookings ? "Booking creation is enabled." : "Booking creation is restricted."}</p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
            <h2 className="text-xl font-semibold text-white">Role summary</h2>
            <div className="mt-4 space-y-3 text-sm text-[color:var(--muted)]">
              <p>Current role: <span className="text-white">{admin.role}</span></p>
              <p>{admin.permissions.canVerifyPayments ? "Payment verification enabled." : "Payment verification disabled."}</p>
              <p>{admin.permissions.canManageSettings ? "Settings control enabled." : "Settings control disabled."}</p>
            </div>
          </div>
        </div>

        {admin.permissions.canViewReports ? (
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
        ) : null}
      </div>
    </main>
  );
}
