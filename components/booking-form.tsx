"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Field } from "@/types";
import { formatCurrency } from "@/utils/formatting";

type AvailabilitySlot = {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getDurationHours(startTime: string, endTime: string) {
  const startHour = Number(startTime.split(":")[0]);
  const endHour = Number(endTime.split(":")[0]);
  return Math.max(endHour - startHour, 1);
}

export function BookingForm({ fields }: { fields: Field[] }) {
  const router = useRouter();
  const [selectedFieldId, setSelectedFieldId] = useState(fields[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState(getTodayIso());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId) ?? fields[0],
    [fields, selectedFieldId]
  );

  useEffect(() => {
    if (!selectedFieldId || !selectedDate) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setSlots([]);
    setSelectedSlot(null);

    fetch(`/api/fields/${selectedFieldId}/availability?date=${selectedDate}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message || "Unable to load schedule.");
        }

        return response.json();
      })
      .then((data) => {
        if (!data?.success || !Array.isArray(data.schedules)) {
          throw new Error("Schedule data is malformed.");
        }

        setSlots(data.schedules);
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        setError((error as Error).message);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [selectedFieldId, selectedDate]);

  const selectedAmount = selectedSlot
    ? selectedField.price * getDurationHours(selectedSlot.startTime, selectedSlot.endTime)
    : selectedField?.price ?? 0;

  const handleContinue = async () => {
    if (!selectedSlot) {
      setSubmitError("Please choose a time slot before continuing.");
      return;
    }

    if (!selectedField) {
      setSubmitError("Select a field first.");
      return;
    }

    setSubmitError(null);

    const query = new URLSearchParams({
      fieldId: selectedField.id,
      fieldName: selectedField.name,
      bookingDate: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      amount: selectedAmount.toString(),
    }).toString();

    // Validate slot with backend before redirecting so we can show exact error
    setValidating(true);
    try {
      const resp = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: selectedField.id,
          bookingDate: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          validateOnly: true,
        }),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.success) {
        setSubmitError(data?.message || "Unable to validate booking.");
        setValidating(false);
        return;
      }
    } catch {
      setSubmitError("Unable to validate booking. Please try again.");
      setValidating(false);
      return;
    } finally {
      setValidating(false);
    }

    router.push(`/checkout?${query}`);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[color:var(--surface-strong)] p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Book a field</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Reserve your preferred slot</h2>
        </div>
        <div>
          <p className="text-sm text-[color:var(--muted)]">Choose a field and date, then confirm the available schedule.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[color:var(--muted)]">Select field</label>
          <select
            value={selectedFieldId}
            onChange={(event) => setSelectedFieldId(event.target.value)}
            className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none focus:border-[color:var(--accent)]"
          >
            {fields.map((field) => (
              <option key={field.id} value={field.id} className="bg-[color:var(--background)] text-white">
                {field.name} • {field.location}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[color:var(--muted)]">Booking date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none focus:border-[color:var(--accent)]"
          />
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Available time slots</h3>
            <p className="mt-1 text-sm text-[color:var(--muted)]">Only one customer can reserve a slot at a time.</p>
          </div>
          <p className="text-sm text-[color:var(--muted)]">Price per hour: {formatCurrency(selectedField?.price ?? 0)}</p>
        </div>

        <div className="mt-4 grid gap-3">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">Loading availability…</div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-500/10 bg-rose-500/5 p-6 text-sm text-rose-200">{error}</div>
          ) : slots.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">No schedule available for this field on the selected date.</div>
          ) : (
            <div className="grid gap-3">
              {slots.map((slot) => {
                const label = `${slot.startTime} - ${slot.endTime}`;
                const isSelected = selectedSlot?.id === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                    className={`rounded-3xl border px-4 py-4 text-left transition ${slot.isAvailable ? "border-white/10 bg-[color:var(--background)] hover:border-[color:var(--accent)]" : "border-white/5 bg-white/5 text-[color:var(--muted)] cursor-not-allowed"} ${isSelected ? "border-[color:var(--accent)] bg-[color:rgba(16,185,129,0.12)]" : ""}`}
                    disabled={!slot.isAvailable}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{label}</p>
                        <p className="mt-1 text-sm text-[color:var(--muted)]">{slot.isAvailable ? "Available" : "Booked"}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm ${slot.isAvailable ? "bg-emerald-500/10 text-emerald-200" : "bg-rose-500/10 text-rose-200"}`}>
                        {slot.isAvailable ? "Open" : "Unavailable"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-[color:var(--background)] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Booking preview</p>
            <p className="mt-2 text-lg font-semibold text-white">{selectedField?.name}</p>
            <p className="text-sm text-[color:var(--muted)]">{selectedField?.location}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[color:var(--muted)]">Duration</p>
            <p className="text-xl font-semibold text-white">
              {selectedSlot ? `${getDurationHours(selectedSlot.startTime, selectedSlot.endTime)} hour(s)` : "Select a slot"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[color:var(--surface)] p-4">
            <p className="text-sm text-[color:var(--muted)]">Date</p>
            <p className="mt-2 text-white">{selectedDate}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[color:var(--surface)] p-4">
            <p className="text-sm text-[color:var(--muted)]">Time</p>
            <p className="mt-2 text-white">{selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : "Not selected"}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-white">
          <span className="text-sm text-[color:var(--muted)]">Estimated total</span>
          <span className="text-2xl font-semibold">{formatCurrency(selectedAmount)}</span>
        </div>

        {submitError ? (
          <p className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{submitError}</p>
        ) : null}

        <button
          type="button"
          onClick={handleContinue}
          disabled={validating}
          aria-busy={validating}
          aria-label={validating ? "Checking availability" : "Continue to checkout"}
          className="mt-6 w-full rounded-3xl bg-[color:var(--accent)] px-6 py-4 text-base font-semibold text-black transition hover:bg-[color:var(--accent-strong)] disabled:opacity-60"
        >
          <span className={`flex items-center justify-center transform transition-opacity transition-transform duration-200 ease-in-out ${validating ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
            <svg className="h-5 w-5 animate-spin text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="sr-only">Checking availability</span>
          </span>
          <span className={`transform transition-opacity transition-transform duration-200 ease-in-out ${validating ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"}`}>
            Continue to checkout
          </span>
        </button>
      </div>
    </div>
  );
}
