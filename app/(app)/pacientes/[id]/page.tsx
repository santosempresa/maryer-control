"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContent, PageHeader } from "@/components/layout/Page";
import { PatientForm } from "@/components/patients/PatientForm";
import { Button } from "@/components/ui/Button";
import { ConfirmSheet } from "@/components/ui/Sheet";
import { PageSpinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  getPatient,
  getSessionsForPatient,
  regenerateFutureSessionsForCurrentMonth,
  setPatientStatus,
  updatePatient,
} from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { scheduleAffectingFieldsChanged } from "@/lib/session-generator";
import type { NewPatientInput, Patient } from "@/lib/types";

export default function EditarPacientePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [patient, setPatient] = useState<Patient | null | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPlanChange, setPendingPlanChange] = useState<NewPatientInput | null>(null);

  useEffect(() => {
    getPatient(params.id)
      .then((p) => setPatient(p ?? null))
      .catch((error) => {
        console.error(error);
        setPatient(null);
        showToast("error", "Não foi possível carregar o paciente.");
      });
  }, [params.id, showToast]);

  async function commitUpdate(data: NewPatientInput) {
    if (!patient) return;
    setSubmitting(true);
    try {
      const scheduleChanged = scheduleAffectingFieldsChanged(patient, data);
      const updated = await updatePatient(patient.id, data);
      if (updated && scheduleChanged) {
        await regenerateFutureSessionsForCurrentMonth(updated);
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
    try {
      const hasDoneSessions = planChanging
        ? (await getSessionsForPatient(patient.id)).some((s) => s.status === "done")
        : false;
      if (hasDoneSessions) {
        setPendingPlanChange(data);
        return;
      }
      commitUpdate(data);
    } catch (error) {
      console.error(error);
      showToast("error", "Não foi possível verificar o histórico do paciente.");
    }
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

  return (
    <>
      <PageHeader
        title={patient.name}
        description="Editar cadastro"
        action={
          <Button
            variant={patient.status === "active" ? "secondary" : "primary"}
            onClick={() => setConfirmOpen(true)}
          >
            {patient.status === "active" ? "Inativar" : "Reativar"}
          </Button>
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
