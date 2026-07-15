"use client";

import { useState, type FormEvent } from "react";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { WeekdayPicker } from "@/components/ui/WeekdayPicker";
import { Button } from "@/components/ui/Button";
import { PLAN_ORDER, PLANS, RECURRING_PLANS } from "@/lib/plans";
import { todayISO } from "@/lib/date-utils";
import type { NewPatientInput, Patient, PatientStatus, PlanType, Weekday } from "@/lib/types";

interface PatientFormProps {
  initialValue?: Patient;
  onSubmit: (data: NewPatientInput) => void;
  submitting?: boolean;
  submitLabel?: string;
}

export function PatientForm({
  initialValue,
  onSubmit,
  submitting = false,
  submitLabel = "Salvar",
}: PatientFormProps) {
  const [name, setName] = useState(initialValue?.name ?? "");
  const [plan, setPlan] = useState<PlanType>(initialValue?.plan ?? "1x_semana");
  const [weekdays, setWeekdays] = useState<Weekday[]>(initialValue?.weekdays ?? []);
  const [time, setTime] = useState(initialValue?.time ?? "08:00");
  const [startDate, setStartDate] = useState(initialValue?.start_date ?? todayISO());
  const [status, setStatus] = useState<PatientStatus>(initialValue?.status ?? "active");
  const [error, setError] = useState<string | null>(null);

  const isRecurring = PLANS[plan].recurring;
  // Avulso plans now come from "Atendimento avulso"; only surface them here for existing avulso patients.
  const planOptions =
    initialValue && !PLANS[initialValue.plan].recurring ? PLAN_ORDER : RECURRING_PLANS;

  function handlePlanChange(nextPlan: PlanType) {
    setPlan(nextPlan);
    if (!PLANS[nextPlan].recurring) {
      setWeekdays([]);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Informe o nome do paciente.");
      return;
    }
    if (isRecurring && weekdays.length === 0) {
      setError("Selecione ao menos um dia da semana.");
      return;
    }
    if (!time) {
      setError("Informe o horário de atendimento.");
      return;
    }
    if (!startDate) {
      setError(isRecurring ? "Informe a data de início do pacote." : "Informe a data da sessão.");
      return;
    }
    setError(null);
    onSubmit({ name: name.trim(), plan, weekdays, time, start_date: startDate, status });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Nome completo">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do paciente"
          required
        />
      </Field>

      <Field label="Plano" hint="Define o valor por sessão e a frequência semanal.">
        <Select value={plan} onChange={(e) => handlePlanChange(e.target.value as PlanType)}>
          {planOptions.map((p) => (
            <option key={p} value={p}>
              {PLANS[p].label}
            </option>
          ))}
        </Select>
      </Field>

      {isRecurring && (
        <Field label="Dias da semana de atendimento">
          <WeekdayPicker value={weekdays} onChange={setWeekdays} />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Horário">
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </Field>
        <Field label={isRecurring ? "Início do pacote" : "Data da sessão"}>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </Field>
      </div>

      <Field label="Status">
        <Select value={status} onChange={(e) => setStatus(e.target.value as PatientStatus)}>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </Select>
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" className="w-full" loading={submitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
