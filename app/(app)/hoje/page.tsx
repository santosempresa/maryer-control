"use client";

import { useCallback, useEffect, useState } from "react";
import { PageContent, PageHeader } from "@/components/layout/Page";
import { SessionRow } from "@/components/sessions/SessionRow";
import { PageSpinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { getPatients, getSessionsByDate } from "@/lib/db";
import { formatDisplayDateFull, formatWeekdayFull, timeToMinutes, todayISO } from "@/lib/date-utils";
import type { Patient, Session } from "@/lib/types";

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function HojePage() {
  const { showToast } = useToast();
  const [data, setData] = useState<{ sessions: Session[]; patients: Patient[] } | null>(null);

  const load = useCallback(async () => {
    try {
      const [sessions, patients] = await Promise.all([
        getSessionsByDate(todayISO()),
        getPatients(),
      ]);
      setData({ sessions, patients });
    } catch (error) {
      console.error(error);
      setData({ sessions: [], patients: [] });
      showToast("error", "Não foi possível carregar os atendimentos de hoje.");
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() awaits Supabase before setting state
    load();
  }, [load]);

  if (!data) return <PageSpinner />;

  const patientById = new Map(data.patients.map((p) => [p.id, p]));
  const sorted = [...data.sessions].sort(
    (a, b) => timeToMinutes(a.scheduled_time) - timeToMinutes(b.scheduled_time)
  );
  const today = todayISO();

  return (
    <>
      <PageHeader
        title="Hoje"
        description={`${capitalize(formatWeekdayFull(today))}, ${formatDisplayDateFull(today)}`}
      />
      <PageContent>
        {sorted.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-white px-4 py-10 text-center text-sm text-muted">
            Nenhum atendimento previsto para hoje.
          </div>
        )}
        <div className="space-y-2">
          {sorted.map((session) => {
            const patient = patientById.get(session.patient_id);
            if (!patient) return null;
            return (
              <SessionRow key={session.id} session={session} patient={patient} onChange={load} />
            );
          })}
        </div>
      </PageContent>
    </>
  );
}
