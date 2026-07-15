"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { PageContent, PageHeader } from "@/components/layout/Page";
import { DayView } from "@/components/agenda/DayView";
import { WeekView } from "@/components/agenda/WeekView";
import { MonthView } from "@/components/agenda/MonthView";
import { PageSpinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { getPatients, getSessions } from "@/lib/db";
import { todayISO } from "@/lib/date-utils";
import type { Patient, Session } from "@/lib/types";

type Tab = "dia" | "semana" | "mes";

const TABS: { value: Tab; label: string }[] = [
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
];

export default function AgendaPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("dia");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [data, setData] = useState<{ sessions: Session[]; patients: Patient[] } | null>(null);

  const load = useCallback(async () => {
    try {
      const [sessions, patients] = await Promise.all([getSessions(), getPatients()]);
      setData({ sessions, patients });
    } catch (error) {
      console.error(error);
      setData({ sessions: [], patients: [] });
      showToast("error", "Não foi possível carregar a agenda.");
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() awaits Supabase before setting state
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="Agenda" description="Atendimentos por dia, semana ou mês" />
      <PageContent>
        <div className="mb-4 inline-flex rounded-xl border border-border bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={clsx(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                tab === t.value ? "bg-primary text-white" : "text-muted hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {!data && <PageSpinner />}

        {data && tab === "dia" && (
          <DayView
            sessions={data.sessions}
            patients={data.patients}
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
            onChange={load}
          />
        )}
        {data && tab === "semana" && (
          <WeekView
            sessions={data.sessions}
            patients={data.patients}
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
          />
        )}
        {data && tab === "mes" && (
          <MonthView
            sessions={data.sessions}
            patients={data.patients}
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
            onChange={load}
          />
        )}
      </PageContent>
    </>
  );
}
