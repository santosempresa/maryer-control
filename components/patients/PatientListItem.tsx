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

  const plan = PLANS[patient.plan];
  const requiredDays = plan.sessionsPerWeek;
  const marked = patient.weekdays.length;

  // Cadastro incoerente: o plano é semanal, então 2x tem que ter 2 dias. O formulário
  // trava isso desde 16/07, mas quem foi cadastrado antes ficou torto e não seria achado
  // se ela não abrisse um por um. Só ela pode decidir se o certo é o plano ou os dias.
  const daysMismatch = !oneOff && marked !== requiredDays;

  // Passou do que o plano cobre no mês (4x a frequência semanal). Fica escondido quando
  // os dias estão errados, porque aí a causa é o cadastro e não o comparecimento.
  const allowance = monthlyAllowance(patient.plan);
  const overPlan = !oneOff && !daysMismatch && doneThisMonth > allowance;

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
          {plan.label} · {schedule} às {patient.time}
        </p>
        {daysMismatch && (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-warning">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>
              Plano {plan.label.toLowerCase()} com {marked} {marked === 1 ? "dia" : "dias"}{" "}
              {marked === 1 ? "marcado" : "marcados"}. Troque o plano ou{" "}
              {marked > requiredDays ? "deixe" : "marque"} {requiredDays}{" "}
              {requiredDays === 1 ? "dia" : "dias"}.
            </span>
          </p>
        )}
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
