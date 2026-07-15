import type { PlanType, Session } from "./types";
import { PLANS } from "./plans";
import { getLastNMonths, monthEndISO, monthStartISO } from "./date-utils";

export interface PlanBreakdownItem {
  plan: PlanType;
  label: string;
  count: number;
  revenue: number;
}

export interface MonthSummary {
  year: number;
  month: number;
  totalSessions: number;
  totalRevenue: number;
  totalMissed: number;
  totalResolved: number;
  breakdown: PlanBreakdownItem[];
}

export function computeMonthSummary(sessions: Session[], year: number, month: number): MonthSummary {
  const start = monthStartISO(year, month);
  const end = monthEndISO(year, month);
  const inMonth = sessions.filter(
    (s) => s.scheduled_date >= start && s.scheduled_date <= end
  );
  const done = inMonth.filter((s) => s.status === "done");
  // "rescheduled" is a superseded slot (its replacement session carries the real outcome) and
  // "pending" hasn't happened yet, so neither belongs in a resolved-outcome count.
  const missed = inMonth.filter((s) => s.status === "missed");

  const breakdown: PlanBreakdownItem[] = (Object.keys(PLANS) as PlanType[]).map(
    (planType) => {
      const plan = PLANS[planType];
      const count = done.filter((s) => s.plan === planType).length;
      return { plan: planType, label: plan.label, count, revenue: count * plan.price };
    }
  );

  const totalRevenue = breakdown.reduce((sum, b) => sum + b.revenue, 0);

  return {
    year,
    month,
    totalSessions: done.length,
    totalRevenue,
    totalMissed: missed.length,
    totalResolved: done.length + missed.length,
    breakdown,
  };
}

export function computeLastNMonthsSummaries(sessions: Session[], n: number): MonthSummary[] {
  return getLastNMonths(n).map(({ year, month }) => computeMonthSummary(sessions, year, month));
}

export function mostAttendedPlan(summary: MonthSummary): PlanBreakdownItem | null {
  const withSessions = summary.breakdown.filter((b) => b.count > 0);
  if (withSessions.length === 0) return null;
  return withSessions.reduce((max, b) => (b.count > max.count ? b : max), withSessions[0]);
}

export function attendanceRate(summary: MonthSummary): number {
  if (summary.totalResolved === 0) return 0;
  return summary.totalSessions / summary.totalResolved;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
