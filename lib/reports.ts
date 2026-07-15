import type { Patient, Session } from "./types";
import { getDaysInMonth } from "./date-utils";

export interface ReportRow {
  patient: Patient;
  daysDone: Set<number>;
  total: number;
}

export interface ReportTotals {
  totalRealizadas: number;
  experimentais: number;
  fisioterapeuticos: number;
  total1x: number;
  total2x: number;
  total3x: number;
}

export interface ReportData {
  year: number;
  month: number;
  daysInMonth: number;
  rows: ReportRow[];
  totals: ReportTotals;
}

export function buildReport(
  patients: Patient[],
  sessions: Session[],
  year: number,
  month: number
): ReportData {
  const daysInMonth = getDaysInMonth(year, month);
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const doneInMonth = sessions.filter(
    (s) => s.status === "done" && s.scheduled_date.startsWith(monthPrefix)
  );

  const patientsWithSessions = new Set(doneInMonth.map((s) => s.patient_id));

  const relevantPatients = patients.filter(
    (p) => p.status === "active" || patientsWithSessions.has(p.id)
  );

  const rows: ReportRow[] = relevantPatients
    .map((patient) => {
      const patientSessions = doneInMonth.filter((s) => s.patient_id === patient.id);
      const daysDone = new Set(
        patientSessions.map((s) => Number(s.scheduled_date.slice(8, 10)))
      );
      return { patient, daysDone, total: patientSessions.length };
    })
    .sort((a, b) => a.patient.name.localeCompare(b.patient.name, "pt-BR"));

  const countByPlan = (plan: Patient["plan"]) =>
    doneInMonth.filter((s) => s.plan === plan).length;

  return {
    year,
    month,
    daysInMonth,
    rows,
    totals: {
      totalRealizadas: doneInMonth.length,
      experimentais: countByPlan("experimental"),
      fisioterapeuticos: countByPlan("fisioterapia"),
      total1x: countByPlan("1x_semana"),
      total2x: countByPlan("2x_semana"),
      total3x: countByPlan("3x_semana"),
    },
  };
}
