import "server-only";
import type {
  DeletePatientResult,
  NewPatientInput,
  NewSessionInput,
  Patient,
  PreviousSchedule,
  Session,
} from "./types";
import { monthStartISO, parseYearMonth, todayISO } from "./date-utils";
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

// Exclusão lógica: as sessões já resolvidas (realizada, falta, remarcada) alimentam o
// faturamento e o relatório do estúdio, então precisam sobreviver, e como sessions tem
// "on delete cascade" apagar a linha do paciente levaria o histórico junto. Só as
// sessões pendentes somem, porque nunca aconteceram e ficariam sujando a agenda.
export async function deletePatient(id: string): Promise<DeletePatientResult> {
  const sessions = await getSessionsForPatient(id);
  const kept = sessions.filter((s) => s.status !== "pending");

  if (kept.length === 0) {
    // Nada de histórico a preservar: apaga de verdade (o cascade leva as pendentes).
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) throw error;
    return { keptSessions: 0 };
  }

  // Marcar vem primeiro de propósito: se a migration que libera o status 'deleted' ainda
  // não tiver rodado, isso falha aqui e nada mais acontece, em vez de deixar o paciente
  // ativo e já sem as sessões pendentes.
  await updatePatient(id, { status: "deleted" });

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("patient_id", id)
    .eq("status", "pending");
  if (error) throw error;

  return { keptSessions: kept.length };
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function getSessions(): Promise<Session[]> {
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

export async function markSessionMissed(id: string): Promise<Session | undefined> {
  return updateSession(id, { status: "missed" });
}

// Ajuste direto de quando o atendimento aconteceu (ela arrasta o card na agenda da
// semana). Diferente de rescheduleSession: aqui não nasce sessão nova nem fica rastro
// de remarcação, porque o caso de uso é corrigir o registro de um atendimento que
// simplesmente caiu em outro dia. Dia passado é permitido de propósito.
export async function moveSession(
  id: string,
  newDateISO: string,
  newTime: string
): Promise<Session | undefined> {
  const session = await getSession(id);
  if (!session) return undefined;
  if (session.status === "rescheduled") {
    throw new Error("Uma sessão remarcada não pode ser movida: mova a sessão que a substituiu.");
  }
  return updateSession(id, { scheduled_date: newDateISO, scheduled_time: newTime });
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

  return updateSession(originalSessionId, { status: "pending" });
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
  const { year, month } = parseYearMonth(todayISO());
  const sessions = generateSessionsForPatientMonth(patient, year, month);
  return addSessions(sessions);
}

// Sobras da agenda antiga: quando os dias do paciente mudam no meio do mês, as sessões
// pendentes que já passaram continuavam de pé mesmo pertencendo ao padrão antigo. Como
// nada mais muda status sozinho (a reconciliação automática saiu em 15/07), elas ficavam
// pendentes pra sempre e o paciente aparecia em dias que não são mais os dele.
//
// Só apaga o que pertencia ao padrão ANTIGO e não pertence ao NOVO. Uma sessão que ela
// moveu na mão pra um dia fora dos dois padrões (arrastando o card) não é sobra, é
// ajuste deliberado, então fica.
async function removeStalePendingSessionsBefore(
  patient: Patient,
  previous: PreviousSchedule,
  before: string
): Promise<void> {
  const { year, month } = parseYearMonth(before);

  const oldDates = new Set(
    generateSessionsForPatientMonth({ ...patient, ...previous }, year, month).map(
      (s) => s.scheduled_date
    )
  );
  const newDates = new Set(
    generateSessionsForPatientMonth(patient, year, month).map((s) => s.scheduled_date)
  );

  const { data, error } = await supabase
    .from("sessions")
    .select("id, scheduled_date")
    .eq("patient_id", patient.id)
    .eq("status", "pending")
    .gte("scheduled_date", monthStartISO(year, month))
    .lt("scheduled_date", before);
  if (error) throw error;

  const staleIds = (data ?? [])
    .filter((s) => oldDates.has(s.scheduled_date) && !newDates.has(s.scheduled_date))
    .map((s) => s.id);
  if (staleIds.length === 0) return;

  const { error: deleteError } = await supabase.from("sessions").delete().in("id", staleIds);
  if (deleteError) throw deleteError;
}

// Recalcula a agenda do mês: de hoje pra frente reescreve as pendentes a partir do novo
// plano, e no passado só limpa as sobras do plano antigo. Histórico resolvido (realizada,
// falta, remarcada) nunca é tocado.
export async function regenerateFutureSessionsForCurrentMonth(
  patient: Patient,
  previous?: PreviousSchedule
): Promise<Session[]> {
  const today = todayISO();
  await removePendingSessionsForPatientFrom(patient.id, today);
  if (previous) {
    await removeStalePendingSessionsBefore(patient, previous, today);
  }
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
  deletePatient,
  getSessions,
  getSession,
  getSessionsByDate,
  getSessionsByDateRange,
  getSessionsForPatient,
  addSessions,
  updateSession,
  deleteSession,
  confirmSession,
  markSessionMissed,
  moveSession,
  rescheduleSession,
  cancelReschedule,
  removePendingSessionsForPatientFrom,
  generateAndSaveSessionsForCurrentMonth,
  regenerateFutureSessionsForCurrentMonth,
};
