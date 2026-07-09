import { AnimatedCard } from "@/components/animated-card";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const slots = [
  { day: "Mon", items: ["09:00 Elite Turf 1", "19:00 Club Arena"] },
  { day: "Tue", items: ["10:00 Elite Turf 2"] },
  { day: "Wed", items: ["18:00 Elite Turf 1"] },
  { day: "Thu", items: ["20:00 Club Arena"] },
  { day: "Fri", items: ["11:00 Elite Turf 2"] },
  { day: "Sat", items: ["16:00 Elite Turf 1", "21:00 Club Arena"] },
  { day: "Sun", items: ["12:00 Elite Turf 2"] },
];

export const dynamic = "force-dynamic";

export default function AdminCalendarPage() {
  return (
    <main className="flex-1 bg-slate-950 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AnimatedCard className="p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Admin calendar</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Weekly field schedule</h1>
            </div>
            <button className="rounded-full border border-[color:rgba(16,185,129,0.18)] bg-[color:rgba(16,185,129,0.06)] px-4 py-2 text-sm text-[color:var(--accent)]">+ Add availability</button>
          </div>

          <div className="mt-8 grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-7">
            {slots.map((slot) => (
              <div key={slot.day} className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                <h3 className="text-lg font-semibold text-white">{slot.day}</h3>
                <div className="mt-4 space-y-2">
                  {slot.items.map((item) => (
                    <div key={item} className="rounded-2xl bg-[color:rgba(16,185,129,0.06)] p-3 text-sm text-[color:var(--accent)]">{item}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
}
