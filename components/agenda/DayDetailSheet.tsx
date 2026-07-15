"use client";

import { Sheet } from "@/components/ui/Sheet";
import { SessionRow } from "@/components/sessions/SessionRow";
import { formatDisplayDateFull, formatWeekdayFull, timeToMinutes } from "@/lib/date-utils";
import type { Patient, Session } from "@/lib/types";

interface DayDetailSheetProps {
  date: string | null;
  sessions: Session[];
  patients: Patient[];
  onClose: () => void;
  onChange: () => void;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function DayDetailSheet({ date, sessions, patients, onClose, onChange }: DayDetailSheetProps) {
  if (!date) return null;

  const patientById = new Map(patients.map((p) => [p.id, p]));
  const sorted = [...sessions].sort(
    (a, b) => timeToMinutes(a.scheduled_time) - timeToMinutes(b.scheduled_time)
  );

  return (
    <Sheet
      open
      onClose={onClose}
      title={`${capitalize(formatWeekdayFull(date))}, ${formatDisplayDateFull(date)}`}
    >
      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Nenhuma sessão prevista.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((session) => {
            const patient = patientById.get(session.patient_id);
            if (!patient) return null;
            return (
              <SessionRow key={session.id} session={session} patient={patient} onChange={onChange} />
            );
          })}
        </div>
      )}
    </Sheet>
  );
}
