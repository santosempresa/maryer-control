import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { PatientStatusBadge } from "@/components/ui/Badge";
import { PLANS, isOneOffPatient, monthlyAllowance, weekdayLabel } from "@/lib/plans";
import { formatDisplayDateFull } from "@/lib/date-utils";
import type { Patient } from "@/lib/types";

export function PatientListItem({
  patient,
  doneThisMonth = 0,
}: {
  patient: Patient;
  doneThisMonth?: number;
}) {
  const oneOff = isOneOffPatient(patient);
  const schedule = oneOff
    ? formatDisplayDateFull(patient.start_date)
    : patient.weekdays.map(weekdayLabel).join(", ");

  // O plano é semanal, então no mês ele cobre 4x a frequência (4, 8 ou 12 sessões).
  // Passar disso não é proibido, mas ela precisa ver pra decidir se o plano mudou.
  const allowance = monthlyAllowance(patient.plan);
  const overPlan = !oneOff && doneThisMonth > allowance;

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
        {overPlan && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-warning">
            <AlertTriangle size={13} className="shrink-0" />
            {doneThisMonth} atendimentos neste mês, o plano cobre {allowance}
          </p>
        )}
      </div>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </Link>
  );
}
