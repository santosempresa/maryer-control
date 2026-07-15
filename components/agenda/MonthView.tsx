"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayDetailSheet } from "./DayDetailSheet";
import {
  addMonthsISO,
  getDaysInMonth,
  getJsDay,
  getMonthLabel,
  monthStartISO,
  parseYearMonth,
  todayISO,
} from "@/lib/date-utils";
import type { Patient, Session } from "@/lib/types";

interface MonthViewProps {
  sessions: Session[];
  patients: Patient[];
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  onChange: () => void;
}

const WEEKDAY_HEADERS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function MonthView({
  sessions,
  patients,
  selectedDate,
  onSelectedDateChange,
  onChange,
}: MonthViewProps) {
  const { year, month } = parseYearMonth(selectedDate);
  const [detailDate, setDetailDate] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayISO = monthStartISO(year, month);
  const leadingBlanks = getJsDay(firstDayISO);

  const sessionsByDate = new Map<string, Session[]>();
  for (const s of sessions) {
    const list = sessionsByDate.get(s.scheduled_date) ?? [];
    list.push(s);
    sessionsByDate.set(s.scheduled_date, list);
  }

  function goToMonth(delta: number) {
    onSelectedDateChange(addMonthsISO(monthStartISO(year, month), delta));
  }

  const cells: (string | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
    ),
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2.5">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-background-alt"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-medium text-foreground">{getMonthLabel(year, month)}</p>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-background-alt"
          aria-label="Próximo mês"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="grid grid-cols-7 border-b border-border bg-background-alt">
          {WEEKDAY_HEADERS.map((label) => (
            <div key={label} className="px-1 py-2 text-center text-xs font-medium text-muted">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((dateISO, idx) => {
            if (!dateISO) {
              return (
                <div
                  key={`blank-${idx}`}
                  className="min-h-[56px] border-b border-r border-border bg-background-alt/40 last:border-r-0 sm:min-h-[72px]"
                />
              );
            }
            const daySessions = sessionsByDate.get(dateISO) ?? [];
            const isToday = dateISO === todayISO();
            return (
              <button
                key={dateISO}
                type="button"
                onClick={() => setDetailDate(dateISO)}
                className={clsx(
                  "flex min-h-[56px] flex-col items-center justify-start gap-1 border-b border-r border-border px-1 py-2 transition-colors hover:bg-background-alt last:border-r-0 sm:min-h-[72px]",
                  isToday && "bg-blue-50"
                )}
              >
                <span
                  className={clsx(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday ? "bg-primary text-white" : "text-foreground"
                  )}
                >
                  {Number(dateISO.slice(8, 10))}
                </span>
                {daySessions.length > 0 && (
                  <span className="rounded-full bg-gray-100 px-1.5 text-[10px] font-medium text-muted">
                    {daySessions.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <DayDetailSheet
        date={detailDate}
        sessions={detailDate ? sessions.filter((s) => s.scheduled_date === detailDate) : []}
        patients={patients}
        onClose={() => setDetailDate(null)}
        onChange={onChange}
      />
    </div>
  );
}
