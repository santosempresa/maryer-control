import type {
  DeletePatientResult,
  NewPatientInput,
  NewSessionInput,
  Patient,
  PreviousSchedule,
  Session,
} from "./types";

async function callDb<T>(fn: string, args: unknown[] = []): Promise<T> {
  const res = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fn, args }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(typeof body?.error === "string" ? body.error : "Erro ao acessar os dados.");
  }
  const body = await res.json();
  return body.data as T;
}

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export function getPatients(): Promise<Patient[]> {
  return callDb("getPatients");
}

export function getActivePatients(): Promise<Patient[]> {
  return callDb("getActivePatients");
}

export function getPatient(id: string): Promise<Patient | undefined> {
  return callDb("getPatient", [id]);
}

export function createPatient(input: NewPatientInput): Promise<Patient> {
  return callDb("createPatient", [input]);
}

export function updatePatient(
  id: string,
  updates: Partial<NewPatientInput>
): Promise<Patient | undefined> {
  return callDb("updatePatient", [id, updates]);
}

export function setPatientStatus(id: string, status: Patient["status"]): Promise<void> {
  return callDb("setPatientStatus", [id, status]);
}

export function deletePatient(id: string): Promise<DeletePatientResult> {
  return callDb("deletePatient", [id]);
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export function getSessions(): Promise<Session[]> {
  return callDb("getSessions");
}

export function getSession(id: string): Promise<Session | undefined> {
  return callDb("getSession", [id]);
}

export function getSessionsByDate(iso: string): Promise<Session[]> {
  return callDb("getSessionsByDate", [iso]);
}

export function getSessionsByDateRange(startISO: string, endISO: string): Promise<Session[]> {
  return callDb("getSessionsByDateRange", [startISO, endISO]);
}

export function getSessionsForPatient(patientId: string): Promise<Session[]> {
  return callDb("getSessionsForPatient", [patientId]);
}

export function addSessions(newSessions: NewSessionInput[]): Promise<Session[]> {
  return callDb("addSessions", [newSessions]);
}

export function updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
  return callDb("updateSession", [id, updates]);
}

export function deleteSession(id: string): Promise<void> {
  return callDb("deleteSession", [id]);
}

export function confirmSession(id: string): Promise<Session | undefined> {
  return callDb("confirmSession", [id]);
}

export function markSessionMissed(id: string): Promise<Session | undefined> {
  return callDb("markSessionMissed", [id]);
}

export function moveSession(
  id: string,
  newDateISO: string,
  newTime: string
): Promise<Session | undefined> {
  return callDb("moveSession", [id, newDateISO, newTime]);
}

export function rescheduleSession(
  id: string,
  newDateISO: string,
  reason?: string
): Promise<{ original: Session; created: Session } | undefined> {
  return callDb("rescheduleSession", [id, newDateISO, reason]);
}

export function cancelReschedule(originalSessionId: string): Promise<Session | undefined> {
  return callDb("cancelReschedule", [originalSessionId]);
}

export function removePendingSessionsForPatientFrom(
  patientId: string,
  fromISO: string
): Promise<void> {
  return callDb("removePendingSessionsForPatientFrom", [patientId, fromISO]);
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export function generateAndSaveSessionsForCurrentMonth(patient: Patient): Promise<Session[]> {
  return callDb("generateAndSaveSessionsForCurrentMonth", [patient]);
}

export function regenerateFutureSessionsForCurrentMonth(
  patient: Patient,
  previous?: PreviousSchedule
): Promise<Session[]> {
  return callDb("regenerateFutureSessionsForCurrentMonth", [patient, previous]);
}
