"use client";

import { FormEvent, useState } from "react";
import { AnimatedCard } from "@/components/animated-card";

const statuses = ["success", "cancelled"] as const;

export default function PaymentWebhookTestPage() {
  const [transactionId, setTransactionId] = useState("");
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{ transactionId: string; status: string } | null>(null);

  const runStatusTest = async (status: (typeof statuses)[number]) => {
    if (!transactionId.trim()) {
      setMessage("Please enter a transaction ID first.");
      return;
    }

    setRunning(true);
    setMessage(null);

    try {
      const response = await fetch("/api/payments/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, status }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to run webhook test.");
      }

      setResult({ transactionId: data.transactionId, status: data.status });
      setMessage(`Webhook transition executed: pending → ${status}.`);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runStatusTest("success");
  };

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <AnimatedCard className="p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Webhook test</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">Verify pending → success / cancelled</h1>
          <p className="mt-3 text-[color:var(--muted)]">Use this path to validate the payment status transition end-to-end against the real webhook processing handler.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--muted)]">Transaction ID</label>
              <input
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none focus:border-[color:var(--accent)]"
                placeholder="Enter payment transactionId"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => void runStatusTest(status)}
                  disabled={running || !transactionId.trim()}
                  className="btn-primary py-3"
                >
                  {running ? "Running…" : `Simulate ${status}`}
                </button>
              ))}
            </div>
          </form>

          {message ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-[color:var(--muted)]">
              {message}
            </div>
          ) : null}

          {result ? (
            <div className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <p><strong>Transaction:</strong> {result.transactionId}</p>
              <p><strong>Status:</strong> {result.status}</p>
            </div>
          ) : null}
        </AnimatedCard>
      </div>
    </main>
  );
}
