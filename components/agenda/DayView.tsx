"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { SessionRow } from "@/components/sessions/SessionRow";
import {
  addDaysISO,
  formatDisplayDateFull,
  formatWeekdayFull,
  timeToMinutes,
  todayISO,
} from "@/lib/date-utils";
import type { Patient, Session } from "@/lib/types";

interface DayViewProps {
  sessions: Session[];
  patients: Patient[];
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  onChange: () => void;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function DayView({
  sessions,
  patients,
  selectedDate,
  onSelectedDateChange,
  onChange,
}: DayViewProps) {
  const patientById = new Map(patients.map((p) => [p.id, p]));
  const daySessions = sessions
    .filter((s) => s.scheduled_date === selectedDate)
    .sort((a, b) => timeToMinutes(a.scheduled_time) - timeToMinutes(b.scheduled_time));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2.5">
        <button
          type="button"
          onClick={() => onSelectedDateChange(addDaysISO(selectedDate, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-background-alt"
          aria-label="Dia anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {capitalize(formatWeekdayFull(selectedDate))}
          </p>
          <p className="text-xs text-muted">
            {formatDisplayDateFull(selectedDate)} · {daySessions.length}{" "}
            {daySessions.length === 1 ? "atendimento" : "atendimentos"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelectedDateChange(addDaysISO(selectedDate, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-background-alt"
          aria-label="Próximo dia"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {selectedDate !== todayISO() && (
        <button
          type="button"
          onClick={() => onSelectedDateChange(todayISO())}
          className="mb-4 text-xs font-medium text-primary hover:underline"
        >
          Voltar para hoje
        </button>
      )}

      {daySessions.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-white px-4 py-10 text-center text-sm text-muted">
          Nenhuma sessão prevista para este dia.
        </div>
      )}

      <div className="space-y-2">
        {daySessions.map((session) => {
          const patient = patientById.get(session.patient_id);
          if (!patient) return null;
          return (
            <SessionRow key={session.id} session={session} patient={patient} onChange={onChange} />
          );
        })}
      </div>
    </div>
  );
}
