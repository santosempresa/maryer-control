"use client";

import { useEffect, useState } from "react";
import { Award, Calendar, Percent, TrendingUp } from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/Page";
import { PageSpinner } from "@/components/ui/Skeleton";
import { BarChart } from "@/components/ui/BarChart";
import { Select } from "@/components/ui/Input";
import { KpiCard } from "@/components/billing/KpiCard";
import { PlanBreakdownRow } from "@/components/billing/PlanBreakdownRow";
import { useToast } from "@/components/ui/ToastProvider";
import { getSessions } from "@/lib/db";
import {
  attendanceRate,
  computeLastNMonthsSummariesEndingAt,
  mostAttendedPlan,
  percentChange,
} from "@/lib/billing";
import { formatCompactCurrencyBRL, formatCurrencyBRL } from "@/lib/plans";
import { getMonthShortLabel, parseYearMonth, todayISO } from "@/lib/date-utils";
import type { Session } from "@/lib/types";

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function FaturamentoPage() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const todayParts = parseYearMonth(todayISO());
  const [year, setYear] = useState(todayParts.year);
  const [month, setMonth] = useState(todayParts.month);

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch((error) => {
        console.error(error);
        setSessions([]);
        showToast("error", "Não foi possível carregar o faturamento.");
      });
  }, [showToast]);

  if (!sessions) return <PageSpinner />;

  const yearOptions = [todayParts.year - 1, todayParts.year, todayParts.year + 1];

  const summaries = computeLastNMonthsSummariesEndingAt(sessions, year, month, 6);
  const current = summaries[summaries.length - 1];
  const previous = summaries.length > 1 ? summaries[summaries.length - 2] : null;

  const revenueChange = previous ? percentChange(current.totalRevenue, previous.totalRevenue) : null;
  const sessionsChange = previous
    ? percentChange(current.totalSessions, previous.totalSessions)
    : null;

  const topPlan = mostAttendedPlan(current);
  const rate = attendanceRate(current);
  const maxPlanCount = Math.max(1, ...current.breakdown.map((b) => b.count));

  const revenueData = summaries.map((s, i) => ({
    key: `${s.year}-${s.month}`,
    label: getMonthShortLabel(s.year, s.month),
    value: s.totalRevenue,
    emphasis: i === summaries.length - 1,
  }));

  const sessionsData = summaries.map((s, i) => ({
    key: `${s.year}-${s.month}`,
    label: getMonthShortLabel(s.year, s.month),
    value: s.totalSessions,
    emphasis: i === summaries.length - 1,
  }));

  return (
    <>
      <PageHeader title="Faturamento" description="Resumo financeiro e indicadores por período" />
      <PageContent className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-auto">
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </Select>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-auto">
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard
            label="Sessões realizadas"
            value={String(current.totalSessions)}
            icon={Calendar}
            delta={sessionsChange === null ? undefined : { value: sessionsChange, goodDirection: "up" }}
          />
          <KpiCard
            label={`Faturamento de ${getMonthShortLabel(current.year, current.month)}`}
            value={formatCurrencyBRL(current.totalRevenue)}
            icon={TrendingUp}
            delta={revenueChange === null ? undefined : { value: revenueChange, goodDirection: "up" }}
          />
          <KpiCard label="Plano mais atendido" value={topPlan ? topPlan.label : "-"} icon={Award} />
          <KpiCard
            label="Taxa de comparecimento"
            value={`${(rate * 100).toFixed(0)}%`}
            icon={Percent}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-white p-4">
            <h2 className="mb-4 text-sm font-medium text-foreground">Faturamento por mês</h2>
            <BarChart data={revenueData} formatValue={formatCompactCurrencyBRL} />
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <h2 className="mb-4 text-sm font-medium text-foreground">Sessões por mês</h2>
            <BarChart data={sessionsData} formatValue={(v) => String(v)} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-4">
          <h2 className="text-sm font-medium text-foreground">
            Por plano ({getMonthShortLabel(current.year, current.month)})
          </h2>
          <p className="mb-1 text-xs text-muted">Sessões realizadas e faturamento por tipo de plano</p>
          <div className="divide-y divide-border">
            {current.breakdown.map((b) => (
              <PlanBreakdownRow
                key={b.plan}
                label={b.label}
                count={b.count}
                revenue={b.revenue}
                maxCount={maxPlanCount}
              />
            ))}
          </div>
        </div>
      </PageContent>
    </>
  );
}
