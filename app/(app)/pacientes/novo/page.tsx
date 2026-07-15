"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContent, PageHeader } from "@/components/layout/Page";
import { PatientForm } from "@/components/patients/PatientForm";
import { useToast } from "@/components/ui/ToastProvider";
import { createPatient, generateAndSaveSessionsForCurrentMonth } from "@/lib/db";
import type { NewPatientInput } from "@/lib/types";

export default function NovoPacientePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(data: NewPatientInput) {
    setSubmitting(true);
    try {
      const patient = await createPatient(data);
      await generateAndSaveSessionsForCurrentMonth(patient);
      showToast("success", "Paciente cadastrado e sessões do mês geradas.");
      router.push("/pacientes");
    } catch (error) {
      console.error(error);
      setSubmitting(false);
      showToast("error", "Não foi possível cadastrar o paciente.");
    }
  }

  return (
    <>
      <PageHeader title="Novo paciente" description="As sessões do mês corrente são geradas automaticamente" />
      <PageContent className="max-w-xl">
        <PatientForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Cadastrar paciente" />
      </PageContent>
    </>
  );
}
