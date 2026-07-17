"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastProvider";
import { moveSession } from "@/lib/db";
import { formatDisplayDateFull, formatWeekdayShort } from "@/lib/date-utils";
import type { Session } from "@/lib/types";

export interface PendingMove {
  session: Session;
  patientName: string;
  toDate: string;
  toTime: string;
}

interface MoveSessionSheetProps {
  // O pai monta este componente só quando há um movimento pendente, com key no destino,
  // pra o horário abaixo nascer já preenchido sem precisar sincronizar por efeito.
  move: PendingMove;
  onClose: () => void;
  onDone: () => void;
}

function describe(date: string, time: string): string {
  return `${formatWeekdayShort(date)}, ${formatDisplayDateFull(date)} às ${time}`;
}

export function MoveSessionSheet({ move, onClose, onDone }: MoveSessionSheetProps) {
  const { showToast } = useToast();
  // O horário parte da linha em que ela soltou o card, mas fica editável: a grade da
  // semana só tem linha pros horários que já existem, então sem isso ela não
  // conseguiria mover pra um horário novo.
  const [time, setTime] = useState(move.toTime);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (!time) return;
    setSubmitting(true);
    try {
      await moveSession(move.session.id, move.toDate, time);
      showToast("success", `${move.patientName} movido para ${describe(move.toDate, time)}.`);
      onDone();
    } catch (error) {
      console.error(error);
      showToast("error", "Não foi possível mover o atendimento.");
    } finally {
      setSubmitting(false);
    }
  }

  const { session, patientName } = move;
  const statusKept = session.status !== "pending";

  return (
    <Sheet
      open
      onClose={onClose}
      title="Mover atendimento"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleConfirm} loading={submitting}>
            Mover
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{patientName}</p>
          <StatusBadge status={session.status} />
        </div>

        <div className="rounded-xl border border-border bg-background-alt px-3 py-3 text-sm">
          <p className="text-muted line-through decoration-muted/60">
            {describe(session.scheduled_date, session.scheduled_time)}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 font-medium text-foreground">
            <ArrowRight size={14} className="shrink-0 text-primary" />
            {describe(move.toDate, time || move.toTime)}
          </p>
        </div>

        <Field label="Horário">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>

        {statusKept && (
          <p className="text-xs text-muted">
            O atendimento continua marcado como{" "}
            {session.status === "done" ? "realizado" : "falta"} e passa a contar nesta nova data no
            faturamento e no relatório.
          </p>
        )}
      </div>
    </Sheet>
  );
}
