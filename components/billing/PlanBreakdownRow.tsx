import { formatCurrencyBRL } from "@/lib/plans";

interface PlanBreakdownRowProps {
  label: string;
  count: number;
  revenue: number;
  maxCount: number;
}

export function PlanBreakdownRow({ label, count, revenue, maxCount }: PlanBreakdownRowProps) {
  const width = maxCount > 0 && count > 0 ? Math.max(4, (count / maxCount) * 100) : 0;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="w-28 shrink-0 truncate text-sm text-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-background-alt">
        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-sm tabular-nums text-foreground">{count}</span>
      <span className="w-24 shrink-0 text-right text-sm tabular-nums text-muted">
        {formatCurrencyBRL(revenue)}
      </span>
    </div>
  );
}
