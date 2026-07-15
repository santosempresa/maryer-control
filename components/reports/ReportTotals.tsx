import type { ReportTotals as ReportTotalsType } from "@/lib/reports";

export function ReportTotals({ totals }: { totals: ReportTotalsType }) {
  const items: { label: string; value: number }[] = [
    { label: "Total de aulas realizadas", value: totals.totalRealizadas },
    { label: "Aulas experimentais", value: totals.experimentais },
    { label: "Atendimentos fisioterapêuticos", value: totals.fisioterapeuticos },
    { label: "Total 1x na semana", value: totals.total1x },
    { label: "Total 2x na semana", value: totals.total2x },
    { label: "Total 3x na semana", value: totals.total3x },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-border bg-white p-3.5">
          <p className="text-xs text-muted">{item.label}</p>
          <p className="mt-1 text-lg font-medium tabular-nums text-foreground">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
