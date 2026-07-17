"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/Page";
import { PatientForm } from "@/components/patients/PatientForm";
import { Button } from "@/components/ui/Button";
import { ConfirmSheet } from "@/components/ui/Sheet";
import { PageSpinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  deletePatient,
  getPatient,
  getSessionsForPatient,
  regenerateFutureSessionsForCurrentMonth,
  setPatientStatus,
  updatePatient,
} from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { scheduleAffectingFieldsChanged } from "@/lib/session-generator";
import type { NewPatientInput, Patient, PreviousSchedule, Session } from "@/lib/types";

export default function EditarPacientePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [patient, setPatient] = useState<Patient | null | undefined>(undefined);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingPlanChange, setPendingPlanChange] = useState<NewPatientInput | null>(null);

  const load = useCallback(async () => {
    try {
      const found = await getPatient(params.id);
      setPatient(found ?? null);
      if (found) setSessions(await getSessionsForPatient(found.id));
    } catch (error) {
      console.error(error);
      setPatient(null);
      showToast("error", "Não foi possível carregar o paciente.");
    }
  }, [params.id, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() awaits Supabase before setting state
    load();
  }, [load]);

  async function commitUpdate(data: NewPatientInput) {
    if (!patient) return;
    setSubmitting(true);
    try {
      const scheduleChanged = scheduleAffectingFieldsChanged(patient, data);
      // A agenda de antes da edição diz quais pendentes já passadas são sobra do padrão
      // antigo e devem sair junto, em vez de ficarem penduradas na agenda pra sempre.
      const previous: PreviousSchedule = {
        plan: patient.plan,
        weekdays: patient.weekdays,
        time: patient.time,
        start_date: patient.start_date,
      };
      const updated = await updatePatient(patient.id, data);
      if (updated && scheduleChanged) {
        await regenerateFutureSessionsForCurrentMonth(updated, previous);
      }
      showToast(
        "success",
        scheduleChanged ? "Paciente atualizado e agenda do mês recalculada." : "Paciente atualizado."
      );
      router.push("/pacientes");
    } catch (error) {
      console.error(error);
      setSubmitting(false);
      showToast("error", "Não foi possível salvar as alterações.");
    }
  }

  async function handleSubmit(data: NewPatientInput) {
    if (!patient) return;
    const planChanging = data.plan !== patient.plan;
    const hasDoneSessions = planChanging && sessions.some((s) => s.status === "done");
    if (hasDoneSessions) {
      setPendingPlanChange(data);
      return;
    }
    commitUpdate(data);
  }

  async function handleToggleStatus() {
    if (!patient) return;
    const nextStatus = patient.status === "active" ? "inactive" : "active";
    try {
      await setPatientStatus(patient.id, nextStatus);
      setConfirmOpen(false);
      showToast("success", nextStatus === "inactive" ? "Paciente inativado." : "Paciente reativado.");
      router.push("/pacientes");
    } catch (error) {
      console.error(error);
      setConfirmOpen(false);
      showToast("error", "Não foi possível atualizar o status do paciente.");
    }
  }

  async function handleDelete() {
    if (!patient) return;
    setDeleting(true);
    try {
      const { keptSessions } = await deletePatient(patient.id);
      setDeleteOpen(false);
      showToast(
        "success",
        keptSessions > 0
          ? `${patient.name} foi excluído. Os atendimentos já registrados continuam valendo.`
          : `${patient.name} foi excluído.`
      );
      router.push("/pacientes");
    } catch (error) {
      console.error(error);
      setDeleting(false);
      showToast("error", "Não foi possível excluir o paciente.");
    }
  }

  if (patient === undefined) return <PageSpinner />;

  if (patient === null) {
    return (
      <>
        <PageHeader title="Paciente não encontrado" />
        <PageContent>
          <p className="text-sm text-muted">
            Este paciente pode ter sido removido. Volte para a lista de pacientes.
          </p>
        </PageContent>
      </>
    );
  }

  const kept = sessions.filter((s) => s.status !== "pending");
  const doneCount = sessions.filter((s) => s.status === "done").length;
  const pendingCount = sessions.filter((s) => s.status === "pending").length;

  return (
    <>
      <PageHeader
        title={patient.name}
        description="Editar cadastro"
        action={
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={16} />
              Excluir
            </Button>
            <Button
              variant={patient.status === "active" ? "secondary" : "primary"}
              onClick={() => setConfirmOpen(true)}
            >
              {patient.status === "active" ? "Inativar" : "Reativar"}
            </Button>
          </div>
        }
      />
      <PageContent className="max-w-xl">
        <PatientForm
          initialValue={patient}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Salvar alterações"
        />
      </PageContent>
      <ConfirmSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={patient.status === "active" ? "Inativar paciente" : "Reativar paciente"}
        description={
          patient.status === "active"
            ? `Tem certeza que deseja inativar ${patient.name}? O paciente deixa de aparecer nas listas de ativos, mas o histórico de sessões é mantido.`
            : `Reativar ${patient.name} no cadastro de pacientes ativos?`
        }
        confirmLabel={patient.status === "active" ? "Inativar" : "Reativar"}
        danger={patient.status === "active"}
        onConfirm={handleToggleStatus}
      />
      <ConfirmSheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Excluir paciente"
        description={
          kept.length > 0
            ? `${patient.name} sai da lista de pacientes e some da agenda. Os ${doneCount === 1 ? "1 atendimento já realizado continua" : `${doneCount} atendimentos já realizados continuam`} contando no faturamento e no relatório do mês.${pendingCount > 0 ? ` As ${pendingCount} sessões ainda pendentes são apagadas.` : ""}`
            : `${patient.name} não tem nenhum atendimento registrado, então será apagado por completo. Não dá pra desfazer.`
        }
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleDelete}
      />
      <ConfirmSheet
        open={pendingPlanChange !== null}
        onClose={() => setPendingPlanChange(null)}
        title="Trocar plano"
        description={
          pendingPlanChange
            ? `${patient.name} já tem sessões confirmadas em ${PLANS[patient.plan].label}. Elas continuam valendo pelo preço e plano de quando aconteceram: só as sessões a partir de hoje passam a usar ${PLANS[pendingPlanChange.plan].label}. Confirma a troca?`
            : ""
        }
        confirmLabel="Trocar plano"
        loading={submitting}
        onConfirm={() => {
          if (pendingPlanChange) commitUpdate(pendingPlanChange);
        }}
      />
    </>
  );
}
