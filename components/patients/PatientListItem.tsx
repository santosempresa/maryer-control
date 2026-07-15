import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PatientStatusBadge } from "@/components/ui/Badge";
import { PLANS, weekdayLabel } from "@/lib/plans";
import { formatDisplayDateFull } from "@/lib/date-utils";
import type { Patient } from "@/lib/types";

export function PatientListItem({ patient }: { patient: Patient }) {
  const isRecurring = PLANS[patient.plan].recurring;
  const schedule = isRecurring
    ? patient.weekdays.map(weekdayLabel).join(", ")
    : formatDisplayDateFull(patient.start_date);

  return (
    <Link
      href={`/pacientes/${patient.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3.5 transition-colors hover:border-primary/40"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{patient.name}</p>
          <PatientStatusBadge status={patient.status} />
        </div>
        <p className="mt-1 truncate text-xs text-muted">
          {PLANS[patient.plan].label} · {schedule} às {patient.time}
        </p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </Link>
  );
}
