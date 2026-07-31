import Link from "next/link";
import { AdminSummary } from "@/lib/admin-dashboard";
import { AuthenticatedAdmin } from "@/lib/admin-auth";

export default function AdminDashboard({
  admin,
  summary,
}: {
  admin: AuthenticatedAdmin;
  summary: AdminSummary;
}) {
  // Quick access removed: RBAC provides in-page CRUD/viewer access for each role.

  const roleSummaryText =
    admin.role === "super_admin"
      ? "Full administrative access, including sensitive user management and revenue insights."
      : admin.role === "manager"
      ? "Can manage bookings, fields, schedules, payments, and operational content, while keeping admin-user management restricted."
      : "Read-only access for booking history, field availability, and operational overview. No access to sensitive admin-user management.";

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-white/10 bg-[color:var(--surface-strong)] p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Admin dashboard</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">{admin.role.replace("_", " ")}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">
                  Role: {admin.role}
                </span>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Authenticated session active
                </span>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">{roleSummaryText}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {admin.permissions.canReadFields || admin.permissions.canManageFields ? (
                  <a href="#fields" className="rounded-full bg-white/5 px-3 py-1 text-sm text-white hover:bg-white/10">Fields</a>
                ) : null}
                {admin.permissions.canReadBookings || admin.permissions.canManageBookings ? (
                  <a href="#bookings" className="rounded-full bg-white/5 px-3 py-1 text-sm text-white hover:bg-white/10">Bookings</a>
                ) : null}
                {admin.permissions.canReadPayments || admin.permissions.canManagePayments ? (
                  <a href="#payments" className="rounded-full bg-white/5 px-3 py-1 text-sm text-white hover:bg-white/10">Payments</a>
                ) : null}
                {admin.permissions.canReadInvoices ? (
                  <Link href={admin.role === "super_admin" ? "/superadmin/invoices" : admin.role === "manager" ? "/manager/invoices" : "/staff/invoices"} className="rounded-full bg-white/5 px-3 py-1 text-sm text-white hover:bg-white/10">Invoices</Link>
                ) : null}
                {admin.permissions.canReadReviews ? (
                  <Link href={admin.role === "super_admin" ? "/superadmin/reviews" : admin.role === "manager" ? "/manager/reviews" : "/staff/reviews"} className="rounded-full bg-white/5 px-3 py-1 text-sm text-white hover:bg-white/10">Reviews</Link>
                ) : null}
                {admin.permissions.canManageSettings ? (
                  <Link href={admin.role === "super_admin" ? "/superadmin/settings" : "/manager/settings"} className="rounded-full bg-white/5 px-3 py-1 text-sm text-white hover:bg-white/10">Settings</Link>
                ) : null}
                {admin.permissions.canManageAdmins ? (
                  <Link href="/superadmin/users" className="rounded-full bg-white/5 px-3 py-1 text-sm text-white hover:bg-white/10">Admin users</Link>
                ) : null}
                {admin.permissions.canViewReports && admin.role === "super_admin" ? (
                  <Link href="/superadmin/audit-logs" className="rounded-full bg-white/5 px-3 py-1 text-sm text-white hover:bg-white/10">Audit logs</Link>
                ) : null}
                {admin.role === "staff" && admin.permissions.canReadBookings ? (
                  <a href="#staff-bookings" className="rounded-full bg-white/5 px-3 py-1 text-sm text-white hover:bg-white/10">Staff bookings</a>
                ) : null}
                {admin.role === "staff" && admin.permissions.canReadPayments ? (
                  <a href="#staff-payments" className="rounded-full bg-white/5 px-3 py-1 text-sm text-white hover:bg-white/10">Staff payments</a>
                ) : null}
              </div>
            </div>
            <Link
              href={
                admin.role === "super_admin"
                  ? "/superadmin/login"
                  : admin.role === "manager"
                  ? "/manager/login"
                  : "/staff/login"
              }
              className="btn-secondary"
            >
              Back to sign in
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
            <p className="text-sm text-[color:var(--muted)]">Role permissions</p>
            <div className="mt-4 space-y-2">
              {Object.entries(admin.permissions).map(([label, allowed]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--muted)]"
                >
                  <span>{label}</span>
                  <span className={allowed ? "text-emerald-300" : "text-rose-300"}>
                    {allowed ? "Allowed" : "Denied"}
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

        {!admin.permissions.canViewReports ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
              <p className="text-sm text-[color:var(--muted)]">Bookings today</p>
              <p className="mt-3 text-3xl font-semibold text-white">{summary.bookingsToday}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
              <p className="text-sm text-[color:var(--muted)]">Bookings this month</p>
              <p className="mt-3 text-3xl font-semibold text-white">{summary.bookingsThisMonth}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
              <p className="text-sm text-[color:var(--muted)]">Pending bookings</p>
              <p className="mt-3 text-3xl font-semibold text-white">{summary.pendingBookings}</p>
            </div>
            {admin.permissions.canReadPayments ? (
              <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
                <p className="text-sm text-[color:var(--muted)]">Pending payments</p>
                <p className="mt-3 text-3xl font-semibold text-white">{summary.pendingPayments}</p>
              </div>
            ) : null}
          </div>
        ) : null}

          {/* Quick access removed — RBAC exposes CRUD/viewer sections inline per role */}

        {admin.permissions.canViewReports ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
              <h2 className="text-xl font-semibold text-white">Peak hours</h2>
              <div className="mt-4 space-y-3">
                {summary.peakHours.length > 0 ? (
                  summary.peakHours.map((entry) => (
                    <div key={entry.hour} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--muted)]">
                      <span>{entry.hour}</span>
                      <span className="text-white">{entry.bookings} bookings</span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--muted)]">
                    Belum ada data booking untuk ditampilkan.
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
              <h2 className="text-xl font-semibold text-white">Customer analytics</h2>
              <div className="mt-6 space-y-3">
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
