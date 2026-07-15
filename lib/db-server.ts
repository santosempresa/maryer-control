import "server-only";
import type { NewPatientInput, NewSessionInput, Patient, Session, SessionStatus } from "./types";
import { todayISO } from "./date-utils";
import {
  generateFutureSessionsFromToday,
  generateSessionsForPatientMonth,
  makeSession,
} from "./session-generator";
import { supabaseService as supabase } from "./supabase/service-client";

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export async function getPatients(): Promise<Patient[]> {
  const { data, error } = await supabase.from("patients").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getActivePatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  const { data, error } = await supabase.from("patients").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ?? undefined;
}

export async function createPatient(input: NewPatientInput): Promise<Patient> {
  const { data, error } = await supabase.from("patients").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updatePatient(
  id: string,
  updates: Partial<NewPatientInput>
): Promise<Patient | undefined> {
  const { data, error } = await supabase
    .from("patients")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ?? undefined;
}

export async function setPatientStatus(id: string, status: Patient["status"]): Promise<void> {
  await updatePatient(id, { status });
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

async function reconcilePastPendingSessions(): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .update({ status: "missed" satisfies SessionStatus })
    .eq("status", "pending")
    .lt("scheduled_date", todayISO());
  if (error) throw error;
}

export async function getSessions(): Promise<Session[]> {
  await reconcilePastPendingSessions();
  const { data, error } = await supabase.from("sessions").select("*").order("scheduled_date");
  if (error) throw error;
  return data ?? [];
}

export async function getSession(id: string): Promise<Session | undefined> {
  const { data, error } = await supabase.from("sessions").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ?? undefined;
}

export async function getSessionsByDate(iso: string): Promise<Session[]> {
  const { data, error } = await supabase.from("sessions").select("*").eq("scheduled_date", iso);
  if (error) throw error;
  return data ?? [];
}

export async function getSessionsByDateRange(
  startISO: string,
  endISO: string
): Promise<Session[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .gte("scheduled_date", startISO)
    .lte("scheduled_date", endISO);
  if (error) throw error;
  return data ?? [];
}

export async function getSessionsForPatient(patientId: string): Promise<Session[]> {
  const { data, error } = await supabase.from("sessions").select("*").eq("patient_id", patientId);
  if (error) throw error;
  return data ?? [];
}

export async function addSessions(newSessions: NewSessionInput[]): Promise<Session[]> {
  if (newSessions.length === 0) return [];
  const { data, error } = await supabase.from("sessions").insert(newSessions).select();
  if (error) throw error;
  return data ?? [];
}

export async function updateSession(
  id: string,
  updates: Partial<Session>
): Promise<Session | undefined> {
  const { data, error } = await supabase
    .from("sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ?? undefined;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) throw error;
}

export async function confirmSession(id: string): Promise<Session | undefined> {
  return updateSession(id, { status: "done" });
}

export async function rescheduleSession(
  id: string,
  newDateISO: string,
  reason?: string
): Promise<{ original: Session; created: Session } | undefined> {
  const original = await getSession(id);
  if (!original) return undefined;

  const [created] = await addSessions([
    makeSession(original.patient_id, newDateISO, original.scheduled_time, original.plan, {
      rescheduled_from: original.id,
    }),
  ]);

  const updatedOriginal = await updateSession(id, {
    status: "rescheduled",
    reschedule_reason: reason?.trim() || undefined,
  });

  return { original: updatedOriginal ?? original, created };
}

export async function cancelReschedule(originalSessionId: string): Promise<Session | undefined> {
  const { error: deleteError } = await supabase
    .from("sessions")
    .delete()
    .eq("rescheduled_from", originalSessionId);
  if (deleteError) throw deleteError;

  const original = await getSession(originalSessionId);
  if (!original) return undefined;

  const nextStatus: SessionStatus = original.scheduled_date < todayISO() ? "missed" : "pending";
  return updateSession(originalSessionId, { status: nextStatus });
}

export async function removePendingSessionsForPatientFrom(
  patientId: string,
  fromISO: string
): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("patient_id", patientId)
    .eq("status", "pending")
    .gte("scheduled_date", fromISO);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export async function generateAndSaveSessionsForCurrentMonth(patient: Patient): Promise<Session[]> {
  const now = new Date();
  const sessions = generateSessionsForPatientMonth(patient, now.getFullYear(), now.getMonth() + 1);
  return addSessions(sessions);
}

// Only replaces today-forward pending sessions so past history (done/missed/rescheduled) stays intact.
export async function regenerateFutureSessionsForCurrentMonth(patient: Patient): Promise<Session[]> {
  const today = todayISO();
  await removePendingSessionsForPatientFrom(patient.id, today);
  const sessions = generateFutureSessionsFromToday(patient, today);
  return addSessions(sessions);
}

export const dbFunctions = {
  getPatients,
  getActivePatients,
  getPatient,
  createPatient,
  updatePatient,
  setPatientStatus,
  getSessions,
  getSession,
  getSessionsByDate,
  getSessionsByDateRange,
  getSessionsForPatient,
  addSessions,
  updateSession,
  deleteSession,
  confirmSession,
  rescheduleSession,
  cancelReschedule,
  removePendingSessionsForPatientFrom,
  generateAndSaveSessionsForCurrentMonth,
  regenerateFutureSessionsForCurrentMonth,
};
