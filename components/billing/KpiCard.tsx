import clsx from "clsx";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";

interface DeltaInfo {
  value: number;
  goodDirection: "up" | "down";
}

interface KpiCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  delta?: DeltaInfo | null;
}

export function KpiCard({ label, value, icon: Icon, delta }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        {Icon && <Icon size={14} />}
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-medium tabular-nums text-foreground">{value}</p>
      {delta !== undefined && delta !== null && <DeltaRow delta={delta} />}
    </div>
  );
}

function DeltaRow({ delta }: { delta: DeltaInfo }) {
  if (delta.value === 0) {
    return <p className="mt-1.5 text-xs font-medium text-muted">Sem variação vs. mês anterior</p>;
  }
  const isUp = delta.value > 0;
  const isGood = isUp === (delta.goodDirection === "up");
  const Icon = isUp ? ArrowUp : ArrowDown;
  return (
    <div
      className={clsx(
        "mt-1.5 inline-flex items-center gap-1 text-xs font-medium",
        isGood ? "text-success" : "text-danger"
      )}
    >
      <Icon size={12} />
      {Math.abs(delta.value).toFixed(1)}% vs. mês anterior
    </div>
  );
}
