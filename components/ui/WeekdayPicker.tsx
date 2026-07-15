"use client";

import clsx from "clsx";
import { WEEKDAYS } from "@/lib/plans";
import type { Weekday } from "@/lib/types";

export function WeekdayPicker({
  value,
  onChange,
}: {
  value: Weekday[];
  onChange: (next: Weekday[]) => void;
}) {
  function toggle(code: Weekday) {
    if (value.includes(code)) {
      onChange(value.filter((w) => w !== code));
    } else {
      onChange([...value, code]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {WEEKDAYS.map((w) => {
        const active = value.includes(w.code);
        return (
          <button
            type="button"
            key={w.code}
            onClick={() => toggle(w.code)}
            aria-pressed={active}
            className={clsx(
              "flex h-12 min-w-[48px] items-center justify-center rounded-xl border px-3 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-foreground hover:bg-background-alt"
            )}
          >
            {w.short}
          </button>
        );
      })}
    </div>
  );
}
