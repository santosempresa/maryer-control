"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { rescheduleSession } from "@/lib/db";
import { formatDisplayDate, todayISO } from "@/lib/date-utils";
import type { Session } from "@/lib/types";

interface RescheduleSheetProps {
  open: boolean;
  onClose: () => void;
  session: Session;
  patientName: string;
  onDone: () => void;
}

export function RescheduleSheet({
  open,
  onClose,
  session,
  patientName,
  onDone,
}: RescheduleSheetProps) {
  const { showToast } = useToast();
  const [date, setDate] = useState(session.scheduled_date);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!date) {
      setError("Escolha a nova data.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await rescheduleSession(session.id, date, reason);
      setReason("");
      showToast("success", `Sessão de ${patientName} remarcada para ${formatDisplayDate(date)}.`);
      onDone();
    } catch (error) {
      console.error(error);
      showToast("error", "Não foi possível remarcar a sessão.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Remarcar sessão"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="info" className="flex-1" onClick={handleSubmit} loading={submitting}>
            Remarcar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          {patientName}, sessão original de {formatDisplayDate(session.scheduled_date)}. A sessão
          antiga fica marcada como remarcada e uma nova sessão pendente é criada na data escolhida.
        </p>
        <Field label="Nova data" error={error ?? undefined}>
          <Input
            type="date"
            min={todayISO()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Justificativa (opcional)">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex.: paciente avisou que não pode vir nesse dia"
          />
        </Field>
      </div>
    </Sheet>
  );
}
