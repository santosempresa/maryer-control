"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmSheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/ToastProvider";
import { RescheduleSheet } from "./RescheduleSheet";
import { cancelReschedule, confirmSession, markSessionMissed, updateSession } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import type { Patient, Session } from "@/lib/types";

interface SessionRowProps {
  session: Session;
  patient: Patient;
  onChange: () => void;
  showDate?: boolean;
}

export function SessionRow({ session, patient, onChange, showDate }: SessionRowProps) {
  const { showToast } = useToast();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [markingMissed, setMarkingMissed] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopening, setReopening] = useState(false);

  const editable = session.status === "done" || session.status === "missed";

  async function handleConfirm() {
    setConfirming(true);
    try {
      await confirmSession(session.id);
      showToast("success", `Presença de ${patient.name} confirmada.`);
      onChange();
    } catch (error) {
      console.error(error);
      showToast("error", "Não foi possível confirmar a presença.");
    } finally {
      setConfirming(false);
    }
  }

  async function handleMarkMissed() {
    setMarkingMissed(true);
    try {
      await markSessionMissed(session.id);
      showToast("info", `Falta de ${patient.name} registrada.`);
      onChange();
    } catch (error) {
      console.error(error);
      showToast("error", "Não foi possível registrar a falta.");
    } finally {
      setMarkingMissed(false);
    }
  }

  async function handleCancelReschedule() {
    try {
      await cancelReschedule(session.id);
      showToast("info", "Remarcação cancelada.");
      onChange();
    } catch (error) {
      console.error(error);
      showToast("error", "Não foi possível cancelar a remarcação.");
    }
  }

  async function handleReopen() {
    setReopening(true);
    try {
      await updateSession(session.id, { status: "pending" });
      showToast("info", `Sessão de ${patient.name} reaberta para correção.`);
      setReopenOpen(false);
      onChange();
    } catch (error) {
      console.error(error);
      showToast("error", "Não foi possível reabrir a sessão.");
    } finally {
      setReopening(false);
    }
  }

  return (
    <div
      className={clsx(
        "rounded-xl border border-border bg-white px-4 py-3.5",
        editable && "cursor-pointer transition-colors hover:border-primary/40"
      )}
      role={editable ? "button" : undefined}
      tabIndex={editable ? 0 : undefined}
      onClick={editable ? () => setReopenOpen(true) : undefined}
      onKeyDown={
        editable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") setReopenOpen(true);
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-medium text-foreground">{session.scheduled_time}</span>
            <span className="text-sm font-medium text-foreground">{patient.name}</span>
            {showDate && <span className="text-xs text-muted">{session.scheduled_date}</span>}
          </div>
          <p className="mt-0.5 text-xs text-muted">{PLANS[patient.plan].label}</p>
          {session.status === "rescheduled" && session.reschedule_reason && (
            <p className="mt-1 text-xs text-muted">Motivo: {session.reschedule_reason}</p>
          )}
        </div>
        <StatusBadge status={session.status} />
      </div>

      {session.status === "pending" && (
        <div className="mt-3 flex gap-2">
          <Button variant="success" className="flex-1" onClick={handleConfirm} loading={confirming}>
            <Check size={16} />
            Confirmar
          </Button>
          <Button variant="info" className="flex-1" onClick={() => setRescheduleOpen(true)}>
            <RotateCcw size={16} />
            Remarcar
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleMarkMissed} loading={markingMissed}>
            <X size={16} />
            Faltou
          </Button>
        </div>
      )}

      {session.status === "rescheduled" && (
        <button
          type="button"
          onClick={handleCancelReschedule}
          className="mt-2 text-xs font-medium text-danger hover:underline"
        >
          Cancelar remarcação
        </button>
      )}

      <RescheduleSheet
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        session={session}
        patientName={patient.name}
        onDone={() => {
          setRescheduleOpen(false);
          onChange();
        }}
      />

      <ConfirmSheet
        open={reopenOpen}
        onClose={() => setReopenOpen(false)}
        title="Reabrir sessão?"
        description={`A sessão de ${patient.name} volta para pendente, aí é só corrigir com Confirmar, Remarcar ou Faltou.`}
        confirmLabel="Reabrir"
        loading={reopening}
        onConfirm={handleReopen}
      />
    </div>
  );
}
