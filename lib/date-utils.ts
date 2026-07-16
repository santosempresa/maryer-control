import type { Weekday } from "./types";
import { WEEKDAYS } from "./plans";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// A clínica opera em Manaus. O servidor (Vercel) roda em UTC, então "hoje"
// calculado com new Date() local vira o dia seguinte a partir das 20h em
// Manaus, fazendo sessões de hoje serem reconciliadas como falta por engano.
// Fixamos o fuso aqui pra "hoje" ser sempre o dia civil de Manaus.
const APP_TIMEZONE = "America/Manaus";

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
}

export function addDaysISO(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function addMonthsISO(iso: string, months: number): string {
  const d = fromISODate(iso);
  d.setMonth(d.getMonth() + months);
  return toISODate(d);
}

export function getJsDay(iso: string): number {
  return fromISODate(iso).getDay();
}

export function getWeekdayCodeFromISO(iso: string): Weekday | "dom" {
  const jsDay = fromISODate(iso).getDay();
  if (jsDay === 0) return "dom";
  const found = WEEKDAYS.find((w) => w.jsDay === jsDay);
  return found ? found.code : "dom";
}

const DAY_LABELS_FULL = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const DAY_LABELS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTH_LABELS = [
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

export function formatDisplayDate(iso: string): string {
  const d = fromISODate(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

export function formatDisplayDateFull(iso: string): string {
  const d = fromISODate(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatWeekdayFull(iso: string): string {
  return DAY_LABELS_FULL[fromISODate(iso).getDay()];
}

export function formatWeekdayShort(iso: string): string {
  return DAY_LABELS_SHORT[fromISODate(iso).getDay()];
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getMonthLabel(year: number, month: number): string {
  return `${MONTH_LABELS[month - 1]}/${year}`;
}

export function monthStartISO(year: number, month: number): string {
  return `${year}-${pad2(month)}-01`;
}

export function monthEndISO(year: number, month: number): string {
  return `${year}-${pad2(month)}-${pad2(getDaysInMonth(year, month))}`;
}

export function generateMonthWeekdayDates(
  year: number,
  month: number,
  weekdays: Weekday[]
): string[] {
  if (weekdays.length === 0) return [];
  const jsDays = new Set(
    weekdays.map((code) => WEEKDAYS.find((w) => w.code === code)?.jsDay)
  );
  const daysInMonth = getDaysInMonth(year, month);
  const dates: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    if (jsDays.has(d.getDay())) {
      dates.push(toISODate(d));
    }
  }
  return dates;
}

export function getWeekDatesISO(iso: string): string[] {
  const d = fromISODate(iso);
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - d.getDay());
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    dates.push(toISODate(day));
  }
  return dates;
}

export function isPastISO(iso: string): boolean {
  return iso < todayISO();
}

export function isTodayISO(iso: string): boolean {
  return iso === todayISO();
}

export function getLastNMonths(n: number): { year: number; month: number }[] {
  const { year: curYear, month: curMonth } = parseYearMonth(todayISO());
  const result: { year: number; month: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(curYear, curMonth - 1 - i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return result;
}

export function getMonthShortLabel(year: number, month: number): string {
  return `${MONTH_LABELS[month - 1].slice(0, 3)}/${String(year).slice(2)}`;
}

export function parseYearMonth(iso: string): { year: number; month: number } {
  const [y, m] = iso.split("-").map(Number);
  return { year: y, month: m };
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
