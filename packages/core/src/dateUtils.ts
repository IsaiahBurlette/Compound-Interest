import type { ISODate, PeriodType } from "./types";

/** All arithmetic happens on UTC-midnight Date objects so DST never shifts a calendar day. */
function toUTCDate(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTCDate(date: Date): ISODate {
  return date.toISOString().slice(0, 10);
}

export function todayISO(): ISODate {
  const now = new Date();
  return fromUTCDate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = toUTCDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUTCDate(d);
}

export function addMonths(iso: ISODate, months: number): ISODate {
  const d = toUTCDate(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const daysInTarget = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, daysInTarget));
  return fromUTCDate(d);
}

export function compareISODate(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isWithin(date: ISODate, start: ISODate, end: ISODate): boolean {
  return compareISODate(date, start) >= 0 && compareISODate(date, end) <= 0;
}

export interface Range {
  start: ISODate;
  end: ISODate;
}

/** Monday..Sunday by default; pass weekStartsOn=0 for Sunday..Saturday. */
export function getWeekRange(iso: ISODate, weekStartsOn: 0 | 1 = 1): Range {
  const d = toUTCDate(iso);
  const dow = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = weekStartsOn === 1 ? (dow === 0 ? 6 : dow - 1) : dow;
  const start = addDays(iso, -diff);
  const end = addDays(start, 6);
  return { start, end };
}

export function getMonthRange(iso: ISODate): Range {
  const d = toUTCDate(iso);
  const start = fromUTCDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
  const end = fromUTCDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
  return { start, end };
}

export function getYearRange(iso: ISODate): Range {
  const d = toUTCDate(iso);
  const start = `${d.getUTCFullYear()}-01-01`;
  const end = `${d.getUTCFullYear()}-12-31`;
  return { start, end };
}

export function periodRange(iso: ISODate, type: PeriodType, weekStartsOn: 0 | 1 = 1): Range {
  return type === "weekly" ? getWeekRange(iso, weekStartsOn) : getMonthRange(iso);
}

/** Step a period start forward/back by whole periods (weeks or months). */
export function shiftPeriod(startDate: ISODate, type: PeriodType, delta: number): ISODate {
  return type === "weekly" ? addDays(startDate, delta * 7) : addMonths(startDate, delta);
}

export function formatPeriodLabel(range: Range, type: PeriodType): string {
  const start = toUTCDate(range.start);
  const end = toUTCDate(range.end);
  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
  if (type === "monthly") {
    return `${monthFmt.format(start)} ${start.getUTCFullYear()}`;
  }
  const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${dayFmt.format(start)} – ${dayFmt.format(end)}, ${end.getUTCFullYear()}`;
}

/** Generate the N period start dates from `fromDate`, inclusive, for planning budgets ahead of time. */
export function generateUpcomingPeriodStarts(
  fromDate: ISODate,
  type: PeriodType,
  count: number,
  weekStartsOn: 0 | 1 = 1
): ISODate[] {
  const first = periodRange(fromDate, type, weekStartsOn).start;
  const starts: ISODate[] = [];
  for (let i = 0; i < count; i++) {
    starts.push(shiftPeriod(first, type, i));
  }
  return starts;
}

export function monthKey(iso: ISODate): string {
  return iso.slice(0, 7); // YYYY-MM
}

export function weekKey(iso: ISODate, weekStartsOn: 0 | 1 = 1): string {
  return getWeekRange(iso, weekStartsOn).start;
}

export function yearKey(iso: ISODate): string {
  return iso.slice(0, 4);
}
