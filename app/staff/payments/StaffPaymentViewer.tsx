"use client";

import { useEffect, useState } from "react";

interface StaffPaymentItem {
  id: string;
  transactionId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  provider: string;
  booking: {
    id: string;
    customerName: string;
    bookingDate: string;
  };
}

export default function StaffPaymentViewer({ adminName }: { adminName: string }) {
  const [payments, setPayments] = useState<StaffPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/payments", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load payments");
        setPayments(data.data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-white/10 bg-[color:var(--surface-strong)] p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Staff payment viewer</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Payments</h1>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                Read-only payment history for staff review.
              </p>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-[color:var(--muted)]">Signed in as {adminName}</div>
          </div>
        </div>

        <section className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
          <h2 className="text-2xl font-semibold text-white">Payment records</h2>
          {error ? (
            <div className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
          ) : null}
          <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-[color:var(--background)]">
            <table className="w-full min-w-[860px] divide-y divide-white/10 text-left text-sm">
              <thead className="bg-[color:rgba(255,255,255,0.03)] text-[color:var(--muted)]">
                <tr>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Provider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {payments.map((payment) => (
                  <tr key={payment.id} className="bg-[color:rgba(255,255,255,0.02)]">
                    <td className="px-4 py-3 text-white">{payment.transactionId}</td>
                    <td className="px-4 py-3">{payment.booking.customerName}</td>
                    <td className="px-4 py-3">Rp {Number(payment.amount).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3">{payment.status}</td>
                    <td className="px-4 py-3">{payment.paymentMethod}</td>
                    <td className="px-4 py-3">{payment.provider}</td>
                  </tr>
                ))}
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-[color:var(--muted)]">
                      {loading ? "Loading payments..." : "No payments found."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
