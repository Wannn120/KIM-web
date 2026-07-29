"use client";

import { useEffect, useState } from "react";

interface BookingItem {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  notes: string | null;
  field: {
    id: string;
    name: string;
    location: string;
  };
  payments: Array<{ id: string; status: string; amount: number; transactionId: string }>;
}

interface BookingFormState {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  fieldId: string;
  notes: string;
}

export default function BookingManagerClient({ adminName, useMain = true }: { adminName: string; useMain?: boolean }) {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [fields, setFields] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BookingItem | null>(null);
  const [formState, setFormState] = useState<BookingFormState>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    bookingDate: "",
    startTime: "",
    endTime: "",
    fieldId: "",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [bookingsRes, fieldsRes] = await Promise.all([
        fetch("/api/admin/bookings", { cache: "no-store" }),
        fetch("/api/admin/fields", { cache: "no-store" }),
      ]);

      const bookingsJson = await bookingsRes.json();
      const fieldsJson = await fieldsRes.json();

      if (!bookingsRes.ok) throw new Error(bookingsJson.message || "Unable to load bookings");
      if (!fieldsRes.ok) throw new Error(fieldsJson.message || "Unable to load fields");

      setBookings(bookingsJson.data || []);
      setFields(
        (fieldsJson.data || []).map((field: { id: string; name: string }) => ({ id: field.id, name: field.name }))
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setFormState({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      bookingDate: "",
      startTime: "",
      endTime: "",
      fieldId: "",
      fieldName: "",
      notes: "",
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = editing ? `/api/admin/bookings/${editing.id}` : "/api/admin/bookings";
      const method = editing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save booking");
      await fetchData();
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (booking: BookingItem) => {
    setEditing(booking);
    setFormState({
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail ?? "",
      bookingDate: booking.bookingDate.split("T")[0],
      startTime: booking.startTime,
      endTime: booking.endTime,
      fieldId: booking.field.id,
      notes: booking.notes ?? "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to delete booking");
      await fetchData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="mx-auto max-w-7xl space-y-8" id="bookings">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-white/10 bg-[color:var(--surface-strong)] p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Booking manager</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Booking CRUD table</h1>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                Create, update, and delete bookings with staff-grade operational controls.
              </p>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-[color:var(--muted)]">Signed in as {adminName}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">Booking list</h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">Operational booking table with quick edit and delete actions.</p>
              </div>
              <button onClick={resetForm} className="btn-secondary px-4 py-2">
                New booking
              </button>
            </div>

            {error ? (
              <div className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
            ) : null}

            <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-[color:var(--background)]">
              <table className="w-full min-w-[860px] divide-y divide-white/10 text-left text-sm">
                <thead className="bg-[color:rgba(255,255,255,0.03)] text-[color:var(--muted)]">
                  <tr>
                    <th className="px-4 py-3">Booking ID</th>
                    <th className="px-4 py-3">Field</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Date / Time</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="bg-[color:rgba(255,255,255,0.02)]">
                      <td className="px-4 py-3 text-white">{booking.id.slice(0, 8)}</td>
                      <td className="px-4 py-3">{booking.field.name}</td>
                      <td className="px-4 py-3">{booking.customerName}</td>
                      <td className="px-4 py-3">{booking.bookingDate.split("T")[0]} {booking.startTime}–{booking.endTime}</td>
                      <td className="px-4 py-3">Rp {Number(booking.totalPrice).toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3">{booking.status}</td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => handleEdit(booking)} className="rounded-full border border-[color:rgba(56,189,248,0.24)] px-3 py-2 text-sm text-[color:var(--accent)] hover:bg-[color:rgba(56,189,248,0.06)]">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(booking.id)} className="rounded-full border border-rose-500/20 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-sm text-[color:var(--muted)]">
                        {loading ? "Loading bookings..." : "No bookings found."}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
            <h2 className="text-2xl font-semibold text-white">Create / update booking</h2>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-[color:var(--muted)]">Field</label>
                <select value={formState.fieldId} onChange={(e) => handleChange("fieldId", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none">
                  <option value="">Select field</option>
                  {fields.map((field) => (
                    <option key={field.id} value={field.id}>{field.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Booking date</label>
                  <input type="date" value={formState.bookingDate} onChange={(e) => handleChange("bookingDate", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Start time</label>
                  <input type="time" value={formState.startTime} onChange={(e) => handleChange("startTime", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">End time</label>
                  <input type="time" value={formState.endTime} onChange={(e) => handleChange("endTime", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Customer email</label>
                  <input value={formState.customerEmail} onChange={(e) => handleChange("customerEmail", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm text-[color:var(--muted)]">Customer name</label>
                <input value={formState.customerName} onChange={(e) => handleChange("customerName", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-sm text-[color:var(--muted)]">Customer phone</label>
                <input value={formState.customerPhone} onChange={(e) => handleChange("customerPhone", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-sm text-[color:var(--muted)]">Notes</label>
                <textarea value={formState.notes} onChange={(e) => handleChange("notes", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" rows={4} />
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={loading} className="btn-primary px-6 py-3 disabled:opacity-60">
                  {editing ? "Update booking" : "Create booking"}
                </button>
                <button onClick={resetForm} type="button" className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-6 py-3 text-sm text-white">
                  Reset
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  return useMain ? <main className="flex-1 px-6 py-16 lg:px-8">{content}</main> : content;
}
