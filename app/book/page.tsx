import { bookingSteps } from "@/lib/mock-data";
import { getUpcomingBookings, getFields, mapBookingsToSlots } from "@/lib/data";
import { BookingForm } from "@/components/booking-form";

export const dynamic = "force-dynamic";

async function loadBookedSlots() {
  const bookings = await getUpcomingBookings(5);
  return mapBookingsToSlots(bookings);
}

async function loadFields() {
  return await getFields();
}

export default async function BookPage() {
  const bookedSlots = await loadBookedSlots();
  const fields = await loadFields();

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="card-surface p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Booking flow</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Choose your date, time, and payment method</h1>
          <p className="mt-4 max-w-2xl text-lg text-[color:var(--muted)]">
            The booking experience is designed for fast checkout with instant confirmation and a clean hourly schedule.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {bookingSteps.map((step) => (
              <div key={step.title} className="rounded-3xl border border-white/10 card-surface p-6">
                <h2 className="font-semibold text-white">{step.title}</h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="card-surface p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Available schedule</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">One client per slot, selected by hour</h2>
              </div>
              <p className="text-sm text-[color:var(--muted)] max-w-xl">
                Each booking is limited to one customer per field and time slot so schedules do not overlap.
              </p>
            </div>

            <div className="mt-8">
              <div className="hidden md:block overflow-x-auto rounded-3xl border border-white/10 card-surface">
                <table className="min-w-[640px] w-full table-auto text-left text-sm text-[color:var(--muted)]">
                  <thead className="bg-[color:var(--surface-strong)] text-[color:var(--muted)]">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3">Date</th>
                      <th className="whitespace-nowrap px-4 py-3">Time</th>
                      <th className="whitespace-nowrap px-4 py-3">Field</th>
                      <th className="whitespace-nowrap px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookedSlots.map((slot) => (
                      <tr key={`${slot.date}-${slot.time}-${slot.field}`} className="border-t border-white/10 card-surface">
                        <td className="px-4 py-3 text-white">{slot.date}</td>
                        <td className="px-4 py-3">{slot.time}</td>
                        <td className="px-4 py-3">{slot.field}</td>
                        <td className="px-4 py-3 text-[color:var(--accent)]">{slot.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {bookedSlots.map((slot) => (
                  <div key={`${slot.date}-${slot.time}-${slot.field}`} className="rounded-2xl border border-white/10 card-surface p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[color:var(--muted)]">Date</p>
                        <p className="font-semibold text-white">{slot.date}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[color:var(--muted)]">Time</p>
                        <p className="text-sm text-white">{slot.time}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-[color:var(--muted)]">Field</p>
                      <p className="text-sm text-white">{slot.field}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-[color:var(--muted)]">Status</p>
                      <span className="rounded-full bg-[color:rgba(16,185,129,0.12)] px-3 py-1 text-[color:var(--accent)] text-sm">{slot.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="card-glow p-8">
            <BookingForm fields={fields} />
          </aside>
        </section>
      </div>
    </main>
  );
}
