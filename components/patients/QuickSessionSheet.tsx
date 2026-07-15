"use client";

import { useState } from "react";
import clsx from "clsx";
import { Sheet } from "@/components/ui/Sheet";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { addSessions, createPatient } from "@/lib/db";
import { generateSessionsForPatientMonth } from "@/lib/session-generator";
import { PLANS } from "@/lib/plans";
import { parseYearMonth, todayISO } from "@/lib/date-utils";
import type { PlanType } from "@/lib/types";

interface QuickSessionSheetProps {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

const AVULSO_PLANS: PlanType[] = ["experimental", "fisioterapia"];

export function QuickSessionSheet({ open, onClose, onDone }: QuickSessionSheetProps) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<PlanType>("experimental");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("08:00");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName("");
    setPlan("experimental");
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
        plan,
        weekdays: [],
        time,
        start_date: date,
        status: "active",
      });
      const { year, month } = parseYearMonth(date);
      await addSessions(generateSessionsForPatientMonth(patient, year, month));
      showToast("success", `${PLANS[plan].label} registrada para ${name.trim()}.`);
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
          Pra aula experimental ou fisioterapia pontual, sem pacote semanal e sem dias fixos.
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
            {AVULSO_PLANS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlan(p)}
                aria-pressed={plan === p}
                className={clsx(
                  "flex-1 rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
                  plan === p
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-foreground hover:bg-background-alt"
                )}
              >
                {PLANS[p].label}
              </button>
            ))}
          </div>
        </Field>
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
