"use client";

import clsx from "clsx";
import { WEEKDAYS } from "@/lib/plans";
import type { Weekday } from "@/lib/types";

export function WeekdayPicker({
  value,
  onChange,
  max,
}: {
  value: Weekday[];
  onChange: (next: Weekday[]) => void;
  // Quantos dias o plano permite. Sem isso, a escolha é livre.
  max?: number;
}) {
  const full = max !== undefined && value.length >= max;

  function toggle(code: Weekday) {
    if (value.includes(code)) {
      onChange(value.filter((w) => w !== code));
      return;
    }
    // Com um único dia permitido, clicar em outro troca direto: não há dúvida sobre qual
    // sai. Com dois ou três, trocar sozinho escolheria por ela qual dia cortar, então os
    // dias restantes ficam travados até ela desmarcar algum.
    if (max === 1) {
      onChange([code]);
      return;
    }
    if (!full) onChange([...value, code]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {WEEKDAYS.map((w) => {
        const active = value.includes(w.code);
        const locked = full && !active && max !== 1;
        return (
          <button
            type="button"
            key={w.code}
            onClick={() => toggle(w.code)}
            aria-pressed={active}
            disabled={locked}
            className={clsx(
              "flex h-12 min-w-[48px] items-center justify-center rounded-xl border px-3 text-sm font-medium transition-colors",
              active && "border-primary bg-primary text-white",
              !active && !locked && "border-border bg-white text-foreground hover:bg-background-alt",
              locked && "cursor-not-allowed border-border bg-background-alt text-muted/50"
            )}
          >
            {w.short}
          </button>
        );
      })}
    </div>
  );
}
