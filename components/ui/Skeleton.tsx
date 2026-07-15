import clsx from "clsx";
import { Loader2 } from "lucide-react";

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-lg bg-gray-200", className)} />;
}

export function Spinner({ size = 22, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={clsx("animate-spin text-primary", className)} />;
}

export function PageSpinner({ label = "Carregando" }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-muted">
      <Spinner size={26} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
