"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDaysISO,
  formatDisplayDate,
  getJsDay,
  getWeekDatesISO,
  timeToMinutes,
  todayISO,
} from "@/lib/date-utils";
import type { Patient, Session, SessionStatus } from "@/lib/types";

interface WeekViewProps {
  sessions: Session[];
  patients: Patient[];
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  onSelectSession: (date: string) => void;
}

const DAY_LABELS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const STATUS_LABEL: Record<SessionStatus, string> = {
  pending: "Pendente",
  done: "Realizado",
  rescheduled: "Remarcado",
  missed: "Falta",
};

const STATUS_DOT: Record<SessionStatus, string> = {
  pending: "bg-gray-300",
  done: "bg-success",
  rescheduled: "bg-info",
  missed: "bg-danger",
};

const STATUS_CELL: Record<SessionStatus, string> = {
  pending: "bg-gray-50 border-gray-200 text-gray-600",
  done: "bg-green-50 border-green-200 text-success",
  rescheduled: "bg-blue-50 border-blue-200 text-info",
  missed: "bg-red-50 border-red-200 text-danger",
};

export function WeekView({
  sessions,
  patients,
  selectedDate,
  onSelectedDateChange,
  onSelectSession,
}: WeekViewProps) {
  const weekDates = getWeekDatesISO(selectedDate);
  const patientById = new Map(patients.map((p) => [p.id, p]));
  const weekSessions = sessions.filter((s) => weekDates.includes(s.scheduled_date));

  const times = Array.from(new Set(weekSessions.map((s) => s.scheduled_time))).sort(
    (a, b) => timeToMinutes(a) - timeToMinutes(b)
  );

  function sessionsAt(date: string, time: string) {
    return weekSessions.filter((s) => s.scheduled_date === date && s.scheduled_time === time);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2.5">
        <button
          type="button"
          onClick={() => onSelectedDateChange(addDaysISO(selectedDate, -7))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-background-alt"
          aria-label="Semana anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-medium text-foreground">
          Semana de {formatDisplayDate(weekDates[0])} a {formatDisplayDate(weekDates[6])}
        </p>
        <button
          type="button"
          onClick={() => onSelectedDateChange(addDaysISO(selectedDate, 7))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-background-alt"
          aria-label="Próxima semana"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {times.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white px-4 py-10 text-center text-sm text-muted">
          Nenhuma sessão prevista nesta semana.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[720px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-16 border-b border-r border-border bg-background-alt px-2 py-2" />
                {weekDates.map((date) => (
                  <th
                    key={date}
                    className={clsx(
                      "min-w-[110px] border-b border-border px-2 py-2 text-center font-medium",
                      date === todayISO() ? "bg-blue-50 text-primary" : "text-muted"
                    )}
                  >
                    <div>{DAY_LABELS_SHORT[getJsDay(date)]}</div>
                    <div className="text-[11px] font-normal">{formatDisplayDate(date)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map((time) => (
                <tr key={time}>
                  <td className="border-b border-r border-border bg-background-alt px-2 py-2 text-center font-medium text-muted">
                    {time}
                  </td>
                  {weekDates.map((date) => {
                    const cellSessions = sessionsAt(date, time);
                    return (
                      <td key={date} className="border-b border-border px-1.5 py-1.5 align-top">
                        <div className="flex flex-col gap-1">
                          {cellSessions.map((s) => {
                            const patient = patientById.get(s.patient_id);
                            if (!patient) return null;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => onSelectSession(date)}
                                className={clsx(
                                  "truncate rounded-md border px-1.5 py-1 text-left text-[11px] font-medium transition-colors hover:brightness-95",
                                  STATUS_CELL[s.status]
                                )}
                                title={patient.name}
                              >
                                {patient.name}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
        {(Object.keys(STATUS_LABEL) as SessionStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={clsx("h-2.5 w-2.5 rounded-full", STATUS_DOT[status])} />
            {STATUS_LABEL[status]}
          </div>
        ))}
      </div>
    </div>
  );
}
