export type PlanType =
  | "1x_semana"
  | "2x_semana"
  | "3x_semana"
  | "experimental"
  | "fisioterapia";

export type Weekday = "seg" | "ter" | "qua" | "qui" | "sex" | "sab";

// "deleted" é exclusão lógica: o paciente some das listas, mas a linha continua
// existindo para as sessões já realizadas seguirem contando no faturamento.
export type PatientStatus = "active" | "inactive" | "deleted";

export type SessionStatus = "pending" | "done" | "rescheduled" | "missed";

export interface Patient {
  id: string;
  name: string;
  plan: PlanType;
  weekdays: Weekday[];
  time: string;
  start_date: string;
  status: PatientStatus;
  created_at: string;
}

export type NewPatientInput = Omit<Patient, "id" | "created_at">;

export interface DeletePatientResult {
  // 0 = não havia histórico e o paciente saiu do banco de vez.
  keptSessions: number;
}

// Como a agenda do paciente estava antes de uma edição, pra saber quais sessões
// pendentes são sobra do padrão antigo.
export type PreviousSchedule = Pick<Patient, "plan" | "weekdays" | "time" | "start_date">;

export type NewSessionInput = Omit<Session, "id" | "created_at">;

export interface Session {
  id: string;
  patient_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: SessionStatus;
  // Snapshot of the patient's plan at creation time, so later plan edits never re-price the past.
  plan: PlanType;
  reschedule_reason?: string;
  rescheduled_from?: string;
  created_at: string;
}

