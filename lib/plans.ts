import type { PlanType, Weekday } from "./types";

export interface PlanConfig {
  type: PlanType;
  label: string;
  shortLabel: string;
  sessionsPerWeek: number;
  sessionsPerMonthReference: number;
  price: number;
  recurring: boolean;
}

export const PLANS: Record<PlanType, PlanConfig> = {
  "1x_semana": {
    type: "1x_semana",
    label: "1x na semana",
    shortLabel: "1x/semana",
    sessionsPerWeek: 1,
    sessionsPerMonthReference: 4,
    price: 26.4,
    recurring: true,
  },
  "2x_semana": {
    type: "2x_semana",
    label: "2x na semana",
    shortLabel: "2x/semana",
    sessionsPerWeek: 2,
    sessionsPerMonthReference: 8,
    price: 20.2,
    recurring: true,
  },
  "3x_semana": {
    type: "3x_semana",
    label: "3x na semana",
    shortLabel: "3x/semana",
    sessionsPerWeek: 3,
    sessionsPerMonthReference: 12,
    price: 18.47,
    recurring: true,
  },
  experimental: {
    type: "experimental",
    label: "Aula experimental",
    shortLabel: "Experimental",
    sessionsPerWeek: 0,
    sessionsPerMonthReference: 1,
    price: 24.0,
    recurring: false,
  },
  fisioterapia: {
    type: "fisioterapia",
    label: "Fisioterapia",
    shortLabel: "Fisioterapia",
    sessionsPerWeek: 0,
    sessionsPerMonthReference: 1,
    price: 100.0,
    recurring: false,
  },
};

export const PLAN_ORDER: PlanType[] = [
  "1x_semana",
  "2x_semana",
  "3x_semana",
  "experimental",
  "fisioterapia",
];

export const RECURRING_PLANS: PlanType[] = ["1x_semana", "2x_semana", "3x_semana"];

export interface WeekdayConfig {
  code: Weekday;
  label: string;
  short: string;
  jsDay: number;
}

export const WEEKDAYS: WeekdayConfig[] = [
  { code: "seg", label: "Segunda", short: "Seg", jsDay: 1 },
  { code: "ter", label: "Terça", short: "Ter", jsDay: 2 },
  { code: "qua", label: "Quarta", short: "Qua", jsDay: 3 },
  { code: "qui", label: "Quinta", short: "Qui", jsDay: 4 },
  { code: "sex", label: "Sexta", short: "Sex", jsDay: 5 },
  { code: "sab", label: "Sábado", short: "Sáb", jsDay: 6 },
];

export function weekdayLabel(code: Weekday): string {
  return WEEKDAYS.find((w) => w.code === code)?.short ?? code;
}

export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatCompactCurrencyBRL(value: number): string {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1).replace(".", ",")}k`;
  }
  return `R$ ${Math.round(value)}`;
}
