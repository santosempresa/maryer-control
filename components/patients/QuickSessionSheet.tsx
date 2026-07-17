"use client";

import { useState } from "react";
import clsx from "clsx";
import { Sheet } from "@/components/ui/Sheet";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { addSessions, createPatient } from "@/lib/db";
import { generateSessionsForPatientMonth } from "@/lib/session-generator";
import { PLANS, RECURRING_PLANS } from "@/lib/plans";
import { parseYearMonth, todayISO } from "@/lib/date-utils";
import type { PlanType } from "@/lib/types";

interface QuickSessionSheetProps {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

// "plano" cobre o caso de ela atender paciente de outro fisioterapeuta: não é
// recorrente, mas ela recebe a tarifa do plano semanal daquele paciente.
type AvulsoKind = "experimental" | "fisioterapia" | "plano";

const KINDS: { value: AvulsoKind; label: string }[] = [
  { value: "experimental", label: "Aula experimental" },
  { value: "fisioterapia", label: "Fisioterapia" },
  { value: "plano", label: "Plano" },
];

const DEFAULT_PLAN: PlanType = "1x_semana";

export function QuickSessionSheet({ open, onClose, onDone }: QuickSessionSheetProps) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<AvulsoKind>("experimental");
  const [plan, setPlan] = useState<PlanType>(DEFAULT_PLAN);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("08:00");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // O plano do avulso só define o preço da sessão: sem dias fixos, não vira pacote.
  const effectivePlan: PlanType = kind === "plano" ? plan : kind;

  function reset() {
    setName("");
    setKind("experimental");
    setPlan(DEFAULT_PLAN);
    setDate(todayISO());
    setTime("08:00");
    setError(null);
    setSubmitting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Informe o nome.");
      return;
    }
    if (!date || !time) {
      setError("Informe data e horário.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const patient = await createPatient({
        name: name.trim(),
        plan: effectivePlan,
        weekdays: [],
        time,
        start_date: date,
        status: "active",
      });
      const { year, month } = parseYearMonth(date);
      await addSessions(generateSessionsForPatientMonth(patient, year, month));
      showToast("success", `${PLANS[effectivePlan].label} registrada para ${name.trim()}.`);
      reset();
      onDone();
    } catch (error) {
      console.error(error);
      setSubmitting(false);
      showToast("error", "Não foi possível registrar o atendimento.");
    }
  }

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title="Atendimento avulso"
      footer={
        <Button className="w-full" onClick={handleSubmit} loading={submitting}>
          Registrar
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Atendimento pontual, sem pacote semanal e sem dias fixos.
        </p>
        <Field label="Nome">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do paciente"
          />
        </Field>
        <Field label="Tipo">
          <div className="flex gap-2">
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => setKind(k.value)}
                aria-pressed={kind === k.value}
                className={clsx(
                  "flex-1 rounded-xl border px-2 py-3 text-sm font-medium transition-colors",
                  kind === k.value
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-foreground hover:bg-background-alt"
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
        </Field>
        {kind === "plano" && (
          <Field
            label="Plano do paciente"
            hint="Define quanto ela recebe por este atendimento. Use quando ela atende paciente de outro fisioterapeuta."
          >
            <Select value={plan} onChange={(e) => setPlan(e.target.value as PlanType)}>
              {RECURRING_PLANS.map((p) => (
                <option key={p} value={p}>
                  {PLANS[p].label}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Horário">
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Sheet>
  );
}
