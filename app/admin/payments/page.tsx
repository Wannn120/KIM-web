import { AnimatedCard } from "@/components/animated-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function loadPayments() {
  const payments = await prisma.payment.findMany({
    include: {
      booking: {
        select: {
          id: true,
          customerName: true,
          fieldId: true,
          bookingDate: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return payments.map((payment) => ({
    id: payment.id,
    transactionId: payment.transactionId,
    status: payment.status,
    amount: payment.amount,
    provider: payment.provider,
    paymentMethod: payment.paymentMethod,
    createdAt: payment.createdAt.toISOString(),
    paidAt: payment.paidAt?.toISOString() ?? null,
    expiredAt: payment.expiredAt?.toISOString() ?? null,
    booking: payment.booking,
    user: payment.user,
  }));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB");
}

export default async function AdminPaymentsPage() {
  const payments = await loadPayments();

  return (
    <main className="flex-1 bg-[color:var(--background)] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Admin payments</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Payment statuses and transaction logs</h1>
            <p className="mt-3 max-w-2xl text-sm text-[color:var(--muted)] sm:text-base">
              Monitor the latest simulated and real payment attempts, including booking linkage and transaction state.
            </p>
          </div>
          <a href="/admin" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-white/10">
            Back to admin
          </a>
        </div>

        <AnimatedCard className="p-8">
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-[960px] w-full table-auto text-left text-sm text-[color:var(--muted)]">
              <thead className="bg-[color:rgba(0,0,0,0.28)] text-[color:var(--muted)]">
                <tr>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Paid / Expired</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-white/10 bg-[color:rgba(15,23,42,0.08)]">
                    <td className="px-4 py-3 text-white">
                      <div className="font-semibold">{payment.transactionId}</div>
                      <div className="text-xs text-[color:var(--muted)]">{payment.provider}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white">{payment.user?.name ?? "Guest"}</div>
                      <div className="text-xs text-[color:var(--muted)]">{payment.user?.email ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white">{payment.booking?.id ?? "—"}</div>
                      <div className="text-xs text-[color:var(--muted)]">{payment.booking?.fieldId ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-white">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3 text-white">{payment.paymentMethod}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm text-amber-200">{payment.status}</span></td>
                    <td className="px-4 py-3">{formatDate(payment.createdAt)}</td>
                    <td className="px-4 py-3">{formatDate(payment.paidAt ?? payment.expiredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
}
