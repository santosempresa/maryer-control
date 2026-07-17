"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, X, Zap } from "lucide-react";
import clsx from "clsx";
import { PageContent, PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Skeleton";
import { PatientListItem } from "@/components/patients/PatientListItem";
import { QuickSessionSheet } from "@/components/patients/QuickSessionSheet";
import { useToast } from "@/components/ui/ToastProvider";
import { getPatients, getSessions } from "@/lib/db";
import { todayISO } from "@/lib/date-utils";
import { matchesSearch } from "@/lib/text";
import type { Patient, Session } from "@/lib/types";

type FilterType = "active" | "inactive" | "all";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" },
  { value: "all", label: "Todos" },
];

export default function PacientesPage() {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState<FilterType>("active");
  const [search, setSearch] = useState("");
  const [avulsoOpen, setAvulsoOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [loadedPatients, loadedSessions] = await Promise.all([getPatients(), getSessions()]);
      // Paciente excluído continua no banco só para o histórico dele seguir no
      // faturamento e no relatório, então nunca aparece nas listas.
      setPatients(loadedPatients.filter((p) => p.status !== "deleted"));
      setSessions(loadedSessions);
    } catch (error) {
      console.error(error);
      setPatients([]);
      showToast("error", "Não foi possível carregar os pacientes.");
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() awaits Supabase before setting state
    load();
  }, [load]);

  // Quantas sessões cada paciente já realizou no mês corrente, pra avisar quem passou
  // do que o plano cobre.
  const doneThisMonthByPatient = useMemo(() => {
    const counts = new Map<string, number>();
    const monthPrefix = todayISO().slice(0, 7);
    for (const s of sessions) {
      if (s.status !== "done" || !s.scheduled_date.startsWith(monthPrefix)) continue;
      counts.set(s.patient_id, (counts.get(s.patient_id) ?? 0) + 1);
    }
    return counts;
  }, [sessions]);

  const byStatus = useMemo(() => {
    if (!patients) return [];
    return filter === "all" ? patients : patients.filter((p) => p.status === filter);
  }, [patients, filter]);

  const filtered = useMemo(
    () =>
      [...byStatus]
        .filter((p) => matchesSearch(p.name, search))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [byStatus, search]
  );

  const counts = useMemo(() => {
    if (!patients) return { active: 0, inactive: 0, all: 0 };
    return {
      active: patients.filter((p) => p.status === "active").length,
      inactive: patients.filter((p) => p.status === "inactive").length,
      all: patients.length,
    };
  }, [patients]);

  const searching = search.trim().length > 0;

  return (
    <>
      <PageHeader
        title="Pacientes"
        description="Cadastro e planos de atendimento"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setAvulsoOpen(true)}>
              <Zap size={16} />
              Atendimento avulso
            </Button>
            <Link href="/pacientes/novo">
              <Button>
                <Plus size={16} />
                Novo paciente
              </Button>
            </Link>
          </div>
        }
      />
      <PageContent>
        <div className="mb-3 relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar paciente pelo nome"
            aria-label="Buscar paciente pelo nome"
            className="pl-9 pr-9"
          />
          {searching && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-background-alt"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="mb-4 flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={clsx(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.value
                  ? "bg-primary text-white"
                  : "border border-border bg-white text-muted hover:text-foreground"
              )}
            >
              {f.label}
              <span
                className={clsx(
                  "rounded-full px-1.5 text-xs font-medium tabular-nums",
                  filter === f.value ? "bg-white/20 text-white" : "bg-background-alt text-muted"
                )}
              >
                {counts[f.value]}
              </span>
            </button>
          ))}
        </div>

        {patients === null && <PageSpinner />}

        {patients !== null && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-white px-4 py-10 text-center text-sm text-muted">
            {searching
              ? `Nenhum paciente encontrado para "${search.trim()}".`
              : "Nenhum paciente encontrado."}
          </div>
        )}

        {patients !== null && searching && filtered.length > 0 && (
          <p className="mb-2 text-xs text-muted">
            {filtered.length === 1
              ? "1 paciente encontrado"
              : `${filtered.length} pacientes encontrados`}
          </p>
        )}

        <div className="space-y-2">
          {filtered.map((p) => (
            <PatientListItem
              key={p.id}
              patient={p}
              doneThisMonth={doneThisMonthByPatient.get(p.id) ?? 0}
            />
          ))}
        </div>
      </PageContent>

      <QuickSessionSheet
        open={avulsoOpen}
        onClose={() => setAvulsoOpen(false)}
        onDone={() => {
          setAvulsoOpen(false);
          load();
        }}
      />
    </>
  );
}
