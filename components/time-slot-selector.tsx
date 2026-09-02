"use client";
import React, { useMemo, useState } from "react";

export type Slot = { time: string; available: boolean };

export default function TimeSlotSelector({
  availability,
  onChange,
}: {
  availability: Slot[];
  onChange?: (selected: string[]) => void;
}) {
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

  const toggle = (i: number) => {
    setSelectedIndexes((prev) => {
      const exists = prev.includes(i);
      let next: number[];
      if (exists) next = prev.filter((p) => p !== i);
      else next = [...prev, i].sort((a, b) => a - b);

      onChange?.(next.map((idx) => availability[idx].time));
      return next;
    });
  };

  const selectedSet = useMemo(() => new Set(selectedIndexes), [selectedIndexes]);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {availability.map((slot, i) => {
        const selected = selectedSet.has(i);
        const leftSelected = selected && selectedSet.has(i - 1);
        const rightSelected = selected && selectedSet.has(i + 1);

        const base = "px-4 py-3 text-sm font-medium transition select-none w-full text-left relative";

        const availableClasses = slot.available
          ? "cursor-pointer"
          : "cursor-not-allowed opacity-60";

        const selectedBg = selected
          ? "bg-emerald-400 text-slate-900 border-emerald-500"
          : "bg-transparent text-white border-white/10";

        const roundedLeft = selected && leftSelected ? "rounded-l-none" : "rounded-l-2xl";
        const roundedRight = selected && rightSelected ? "rounded-r-none" : "rounded-r-2xl";

        const borderLeftStyle = selected && leftSelected ? "border-l-transparent" : "";
        const borderRightStyle = selected && rightSelected ? "border-r-transparent" : "";

        return (
          <button
            key={slot.time}
            type="button"
            disabled={!slot.available}
            onClick={() => slot.available && toggle(i)}
            className={`rounded-2xl border ${base} ${availableClasses} ${selectedBg} ${roundedLeft} ${roundedRight} ${borderLeftStyle} ${borderRightStyle}`}
            style={{
              borderWidth: 1,
            }}
          >
            <div className="flex items-center justify-between w-full">
              <div>
                <div className={selected ? "font-semibold" : "font-medium"}>{slot.time}</div>
                <div className="text-xs text-[color:var(--muted)]">{slot.available ? "Available" : "Closed"}</div>
              </div>
              <div className={`ml-3 inline-flex items-center justify-center rounded-full px-3 py-1 text-xs ${selected ? "bg-emerald-600 text-white" : "bg-emerald-700/10 text-emerald-300"}`}>
                {selected ? "Selected" : slot.available ? "Open" : "—"}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
