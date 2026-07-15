import clsx from "clsx";
import type { PatientStatus, SessionStatus } from "@/lib/types";

const SESSION_STATUS_CONFIG: Record<SessionStatus, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-gray-100 text-gray-600" },
  done: { label: "Realizado", className: "bg-green-100 text-success" },
  rescheduled: { label: "Remarcado", className: "bg-blue-100 text-info" },
  missed: { label: "Falta", className: "bg-red-100 text-danger" },
};

export function StatusBadge({ status, className }: { status: SessionStatus; className?: string }) {
  const config = SESSION_STATUS_CONFIG[status];
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

const PATIENT_STATUS_CONFIG: Record<PatientStatus, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-green-100 text-success" },
  inactive: { label: "Inativo", className: "bg-gray-100 text-muted" },
};

export function PatientStatusBadge({ status }: { status: PatientStatus }) {
  const config = PATIENT_STATUS_CONFIG[status];
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

export function PlanBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-primary">
      {label}
    </span>
  );
}
