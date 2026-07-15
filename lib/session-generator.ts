import type { NewPatientInput, NewSessionInput, Patient, PlanType } from "./types";
import { PLANS } from "./plans";
import { generateMonthWeekdayDates } from "./date-utils";

export function makeSession(
  patientId: string,
  scheduledDate: string,
  scheduledTime: string,
  plan: PlanType,
  extra?: Partial<NewSessionInput>
): NewSessionInput {
  return {
    patient_id: patientId,
    scheduled_date: scheduledDate,
    scheduled_time: scheduledTime,
    plan,
    status: "pending",
    ...extra,
  };
}

export function generateSessionsForPatientMonth(
  patient: Patient,
  year: number,
  month: number
): NewSessionInput[] {
  const plan = PLANS[patient.plan];

  if (!plan.recurring) {
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
    if (patient.start_date.startsWith(monthPrefix)) {
      return [makeSession(patient.id, patient.start_date, patient.time, patient.plan)];
    }
    return [];
  }

  const dates = generateMonthWeekdayDates(year, month, patient.weekdays).filter(
    (d) => d >= patient.start_date
  );
  return dates.map((d) => makeSession(patient.id, d, patient.time, patient.plan));
}

// Only the today-forward slice, so past history (done/missed/rescheduled) is never touched.
export function generateFutureSessionsFromToday(patient: Patient, today: string): NewSessionInput[] {
  const [year, month] = today.split("-").map(Number);
  const plan = PLANS[patient.plan];

  if (!plan.recurring) {
    return generateSessionsForPatientMonth(patient, year, month).filter(
      (s) => s.scheduled_date >= today
    );
  }

  const dates = generateMonthWeekdayDates(year, month, patient.weekdays).filter(
    (d) => d >= today && d >= patient.start_date
  );
  return dates.map((d) => makeSession(patient.id, d, patient.time, patient.plan));
}

export function scheduleAffectingFieldsChanged(before: Patient, after: NewPatientInput): boolean {
  return (
    before.plan !== after.plan ||
    before.time !== after.time ||
    before.start_date !== after.start_date ||
    before.weekdays.length !== after.weekdays.length ||
    before.weekdays.some((w) => !after.weekdays.includes(w))
  );
}
