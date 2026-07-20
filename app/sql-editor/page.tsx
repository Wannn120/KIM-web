"use client";

import { useState } from "react";
import { AnimatedCard } from "@/components/animated-card";

export default function SqlEditorPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templates = {
    "All Bookings": `SELECT 
  b.id,
  b.customer_name,
  b.customer_email,
  b.customer_phone,
  b.booking_date,
  b.start_time,
  b.end_time,
  b.total_price,
  b.status,
  f.name AS field_name
FROM booking b
JOIN field f ON b.field_id = f.id
ORDER BY b.booking_date DESC;`,
    "Today's Bookings": `SELECT 
  b.id,
  b.customer_name,
  b.booking_date,
  b.start_time,
  b.end_time,
  f.name AS field_name,
  b.status
FROM booking b
JOIN field f ON b.field_id = f.id
WHERE DATE(b.booking_date) = CURRENT_DATE
ORDER BY b.start_time;`,
    "Payment Summary": `SELECT 
  p.id,
  p.transaction_id,
  p.amount,
  p.status,
  p.paid_at,
  b.customer_name,
  b.customer_email,
  f.name AS field_name
FROM payment p
JOIN booking b ON p.booking_id = b.id
JOIN field f ON b.field_id = f.id
ORDER BY p.created_at DESC;`,
    "Fields List": `SELECT 
  id,
  name,
  location,
  price,
  type,
  capacity,
  rating,
  is_active
FROM field
ORDER BY name;`,
    "Available Slots": `SELECT 
  fs.field_id,
  f.name AS field_name,
  fs.date,
  fs.start_time,
  fs.end_time,
  fs.is_available
FROM field_schedule fs
JOIN field f ON fs.field_id = f.id
WHERE fs.date >= CURRENT_DATE
  AND fs.is_available = true
ORDER BY fs.date, fs.start_time
LIMIT 50;`,
    "Revenue Report": `SELECT 
  DATE(b.booking_date) AS booking_date,
  COUNT(DISTINCT b.id) AS total_bookings,
  COUNT(DISTINCT CASE WHEN p.status = 'success' THEN b.id END) AS successful_bookings,
  COALESCE(SUM(CASE WHEN p.status = 'success' THEN p.amount ELSE 0 END), 0) AS total_revenue
FROM booking b
LEFT JOIN payment p ON b.id = p.booking_id
GROUP BY DATE(b.booking_date)
ORDER BY booking_date DESC;`,
  };

  const handleExecute = async () => {
    if (!query.trim()) {
      setError("Please enter a query");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/admin/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Query execution failed");
      }

      setResults(data.results || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <AnimatedCard className="p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Database Tools</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">SQL Query Editor</h1>
            <p className="mt-2 text-[color:var(--muted)]">
              Execute SQL queries to view and analyze booking data. Select a template or write your own query.
            </p>
          </div>

          <div className="mt-8 grid gap-2">
            <p className="text-sm font-medium text-[color:var(--muted)]">Quick Templates</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(templates).map(([name, sql]) => (
                <button
                  key={name}
                  onClick={() => setQuery(sql)}
                  className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-left text-sm transition hover:border-[color:var(--accent)] hover:bg-[color:rgba(16,185,129,0.06)]"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--muted)]">SQL Query</label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM booking..."
                className="mt-2 h-48 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 font-mono text-sm text-white outline-none focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted)]"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExecute}
                disabled={loading || !query.trim()}
                className="btn-primary px-8 py-3 disabled:opacity-60"
              >
                {loading ? "Executing..." : "Execute Query"}
              </button>
              <button
                onClick={() => {
                  setQuery("");
                  setResults(null);
                  setError(null);
                }}
                className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-8 py-3 text-white transition hover:border-[color:var(--accent)]"
              >
                Clear
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}
        </AnimatedCard>

        {results !== null && (
          <AnimatedCard className="p-8">
            <h2 className="text-2xl font-semibold text-white">Results ({results.length} rows)</h2>

            {results.length === 0 ? (
              <p className="mt-4 text-[color:var(--muted)]">No results returned</p>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[color:rgba(0,0,0,0.28)] text-[color:var(--muted)]">
                    <tr>
                      {Object.keys(results[0] as Record<string, unknown>).map((key) => (
                        <th key={key} className="whitespace-nowrap px-4 py-3">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, idx) => (
                      <tr key={idx} className="border-t border-white/10 bg-[color:rgba(15,23,42,0.08)] text-[color:var(--foreground)]">
                        {Object.values(row as Record<string, unknown>).map((value, idx) => (
                          <td key={idx} className="whitespace-nowrap px-4 py-3 text-[color:var(--muted)]">
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value || "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AnimatedCard>
        )}

        <AnimatedCard className="p-8">
          <h2 className="text-2xl font-semibold text-white">Database Schema Reference</h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Tables</h3>
              <div className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
                <p><strong className="text-white">field</strong> - Lapangan/field information</p>
                <p><strong className="text-white">field_schedule</strong> - Available time slots</p>
                <p><strong className="text-white">booking</strong> - Customer bookings (guest-only)</p>
                <p><strong className="text-white">payment</strong> - Payment transactions (Midtrans)</p>
                <p><strong className="text-white">invoice</strong> - Invoices for bookings</p>
                <p><strong className="text-white">audit_log</strong> - Activity logs</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">Key Columns</h3>
              <div className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
                <p><strong className="text-white">booking.customer_name</strong> &ndash; Guest&apos;s name</p>
                <p><strong className="text-white">booking.customer_email</strong> &ndash; Guest&apos;s email for invoices</p>
                <p><strong className="text-white">booking.customer_phone</strong> &ndash; Guest&apos;s phone for contact</p>
                <p><strong className="text-white">payment.status</strong> &ndash; pending, success, failed, refunded</p>
                <p><strong className="text-white">payment.provider</strong> &ndash; Always &quot;Midtrans&quot; for this app</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">Available Views</h3>
              <div className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
                <p><strong className="text-white">guest_booking_history</strong> - Booking history with payment status</p>
                <p><strong className="text-white">daily_revenue</strong> - Revenue by date</p>
                <p><strong className="text-white">field_availability</strong> - Available time slots</p>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
}
