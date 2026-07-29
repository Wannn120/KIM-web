"use client";

import { useEffect, useMemo, useState } from "react";

interface PaymentItem {
  id: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  provider: string;
  status: string;
  paidAt: string | null;
  expiredAt: string | null;
  booking: {
    id: string;
    customerName: string;
    customerPhone: string;
    bookingDate: string;
  };
}

interface PaymentFormState {
  bookingId: string;
  transactionId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  provider: string;
  paidAt: string;
  expiredAt: string;
}

export default function PaymentManagerClient({ adminName }: { adminName: string }) {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PaymentItem | null>(null);
  const [formState, setFormState] = useState<PaymentFormState>({
    bookingId: "",
    transactionId: "",
    amount: 0,
    status: "pending",
    paymentMethod: "Midtrans",
    provider: "Midtrans",
    paidAt: "",
    expiredAt: "",
  });

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

  useEffect(() => {
    fetchPayments();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setFormState({
      bookingId: "",
      transactionId: "",
      amount: 0,
      status: "pending",
      paymentMethod: "Midtrans",
      provider: "Midtrans",
      paidAt: "",
      expiredAt: "",
    });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = editing ? `/api/admin/payments/${editing.id}` : "/api/admin/payments";
      const method = editing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          amount: Number(formState.amount),
          paidAt: formState.paidAt || null,
          expiredAt: formState.expiredAt || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save payment");
      await fetchPayments();
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payment: PaymentItem) => {
    setEditing(payment);
    setFormState({
      bookingId: payment.booking.id,
      transactionId: payment.transactionId,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      provider: payment.provider,
      paidAt: payment.paidAt ? payment.paidAt.split("T")[0] : "",
      expiredAt: payment.expiredAt ? payment.expiredAt.split("T")[0] : "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this payment?")) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/payments/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to delete payment");
      await fetchPayments();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = useMemo(() => ["pending", "success", "failed", "refunded", "expired", "cancelled"], []);
  const paymentMethods = useMemo(() => ["Midtrans", "QRIS", "GoPay", "Dana", "ShopeePay", "OVO", "BCA", "BNI", "Mandiri", "Offline"], []);
  const providers = useMemo(() => ["Midtrans", "QRIS", "GoPay", "Dana", "ShopeePay", "OVO", "BCA", "BNI", "Mandiri", "Offline"], []);

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-white/10 bg-[color:var(--surface-strong)] p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Payment manager</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Payment CRUD table</h1>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                Manage payment records for bookings in one operational interface.
              </p>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-[color:var(--muted)]">Signed in as {adminName}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">Payment records</h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">Create, edit, and delete payment entries.</p>
              </div>
              <button onClick={resetForm} className="btn-secondary px-4 py-2">
                New payment
              </button>
            </div>
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
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="bg-[color:rgba(255,255,255,0.02)]">
                      <td className="px-4 py-3 text-white">{payment.transactionId}</td>
                      <td className="px-4 py-3">{payment.booking.customerName}</td>
                      <td className="px-4 py-3">Rp {payment.amount.toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3">{payment.status}</td>
                      <td className="px-4 py-3">{payment.paymentMethod}</td>
                      <td className="px-4 py-3">{payment.provider}</td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => handleEdit(payment)} className="rounded-full border border-[color:rgba(56,189,248,0.24)] px-3 py-2 text-sm text-[color:var(--accent)] hover:bg-[color:rgba(56,189,248,0.06)]">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(payment.id)} className="rounded-full border border-rose-500/20 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-sm text-[color:var(--muted)]">
                        {loading ? "Loading payments..." : "No payment records found."}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
            <h2 className="text-2xl font-semibold text-white">Create / update payment</h2>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-[color:var(--muted)]">Booking ID</label>
                <input value={formState.bookingId} onChange={(e) => handleChange("bookingId", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-sm text-[color:var(--muted)]">Transaction ID</label>
                <input value={formState.transactionId} onChange={(e) => handleChange("transactionId", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Amount</label>
                  <input type="number" value={formState.amount} onChange={(e) => handleChange("amount", Number(e.target.value))} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Status</label>
                  <select value={formState.status} onChange={(e) => handleChange("status", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none">
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Payment method</label>
                  <select value={formState.paymentMethod} onChange={(e) => handleChange("paymentMethod", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none">
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Provider</label>
                  <select value={formState.provider} onChange={(e) => handleChange("provider", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none">
                    {providers.map((provider) => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Paid at</label>
                  <input type="date" value={formState.paidAt} onChange={(e) => handleChange("paidAt", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Expired at</label>
                  <input type="date" value={formState.expiredAt} onChange={(e) => handleChange("expiredAt", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={loading} className="btn-primary px-6 py-3 disabled:opacity-60">
                  {editing ? "Update payment" : "Create payment"}
                </button>
                <button onClick={resetForm} type="button" className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-6 py-3 text-sm text-white">
                  Reset
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
