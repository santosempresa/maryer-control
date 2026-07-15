"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Zap } from "lucide-react";
import clsx from "clsx";
import { PageContent, PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Skeleton";
import { PatientListItem } from "@/components/patients/PatientListItem";
import { QuickSessionSheet } from "@/components/patients/QuickSessionSheet";
import { useToast } from "@/components/ui/ToastProvider";
import { getPatients } from "@/lib/db";
import type { Patient } from "@/lib/types";

type FilterType = "active" | "inactive" | "all";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" },
  { value: "all", label: "Todos" },
];

export default function PacientesPage() {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [filter, setFilter] = useState<FilterType>("active");
  const [avulsoOpen, setAvulsoOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setPatients(await getPatients());
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

  const filtered = useMemo(() => {
    if (!patients) return [];
    const list = filter === "all" ? patients : patients.filter((p) => p.status === filter);
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [patients, filter]);

  const counts = useMemo(() => {
    if (!patients) return { active: 0, inactive: 0, all: 0 };
    return {
      active: patients.filter((p) => p.status === "active").length,
      inactive: patients.filter((p) => p.status === "inactive").length,
      all: patients.length,
    };
  }, [patients]);

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
            Nenhum paciente encontrado.
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((p) => (
            <PatientListItem key={p.id} patient={p} />
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
