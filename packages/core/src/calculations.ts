import type { Range } from "./dateUtils";
import {
  addDays,
  addMonths,
  compareISODate,
  getMonthRange,
  getWeekRange,
  getYearRange,
  isWithin,
  monthKey,
  weekKey,
  yearKey,
} from "./dateUtils";
import type { BudgetPeriod, Category, IncomeEntry, ISODate, Transaction } from "./types";

const live = <T extends { deletedAt?: string }>(items: T[]) => items.filter((i) => !i.deletedAt);

export function sumIncome(entries: IncomeEntry[], range: Range): number {
  return round2(
    live(entries)
      .filter((e) => isWithin(e.date, range.start, range.end))
      .reduce((sum, e) => sum + e.amount, 0)
  );
}

export function sumExpenses(transactions: Transaction[], range: Range, categoryId?: string): number {
  return round2(
    live(transactions)
      .filter((t) => isWithin(t.date, range.start, range.end))
      .filter((t) => !categoryId || t.categoryId === categoryId)
      .reduce((sum, t) => sum + t.amount, 0)
  );
}

export interface CategoryTotal {
  category: Category;
  total: number;
  pctOfSpend: number;
}

/** Spend broken out by category for a range, sorted largest-first — feeds the pie chart. */
/** Placeholder shown for spend whose category was deleted — keeps totals honest instead of silently dropping it. */
export const UNCATEGORIZED_CATEGORY: Category = {
  id: "__uncategorized__",
  name: "Uncategorized",
  kind: "discretionary",
  color: "#898781",
  archived: false,
  updatedAt: "",
};

export function byCategory(transactions: Transaction[], categories: Category[], range: Range): CategoryTotal[] {
  const liveTx = live(transactions).filter((t) => isWithin(t.date, range.start, range.end));
  const totalSpend = liveTx.reduce((sum, t) => sum + t.amount, 0);
  const byId = new Map<string, number>();
  for (const t of liveTx) {
    byId.set(t.categoryId, (byId.get(t.categoryId) ?? 0) + t.amount);
  }
  const catById = new Map(categories.map((c) => [c.id, c]));
  const rows: CategoryTotal[] = [];
  let uncategorizedTotal = 0;
  for (const [categoryId, total] of byId.entries()) {
    const category = catById.get(categoryId);
    if (!category) {
      uncategorizedTotal += total;
      continue;
    }
    rows.push({ category, total: round2(total), pctOfSpend: totalSpend > 0 ? round2((total / totalSpend) * 100) : 0 });
  }
  if (uncategorizedTotal > 0) {
    rows.push({
      category: UNCATEGORIZED_CATEGORY,
      total: round2(uncategorizedTotal),
      pctOfSpend: totalSpend > 0 ? round2((uncategorizedTotal / totalSpend) * 100) : 0,
    });
  }
  return rows.sort((a, b) => b.total - a.total);
}

export type Granularity = "week" | "month" | "year";

export interface PeriodPoint {
  key: string;
  label: string;
  rangeStart: ISODate;
  income: number;
  expenses: number;
  net: number;
}

/** Buckets income + expenses into weekly/monthly/yearly points across a range — feeds trend charts. */
export function periodSeries(
  incomeEntries: IncomeEntry[],
  transactions: Transaction[],
  range: Range,
  granularity: Granularity,
  weekStartsOn: 0 | 1 = 1
): PeriodPoint[] {
  const keyFor = (d: ISODate) =>
    granularity === "week" ? weekKey(d, weekStartsOn) : granularity === "month" ? monthKey(d) : yearKey(d);

  const points = new Map<string, PeriodPoint>();
  const ensure = (key: string, rangeStart: ISODate) => {
    let p = points.get(key);
    if (!p) {
      p = { key, label: labelFor(key, granularity), rangeStart, income: 0, expenses: 0, net: 0 };
      points.set(key, p);
    }
    return p;
  };

  // Pre-seed every bucket across the range so months/weeks/years with no
  // activity still render as a zero bar instead of vanishing from the chart.
  let cursor =
    granularity === "week"
      ? getWeekRange(range.start, weekStartsOn).start
      : granularity === "year"
        ? getYearRange(range.start).start
        : getMonthRange(range.start).start;
  while (compareISODate(cursor, range.end) <= 0) {
    ensure(keyFor(cursor), cursor);
    cursor = granularity === "week" ? addDays(cursor, 7) : granularity === "month" ? addMonths(cursor, 1) : addMonths(cursor, 12);
  }

  for (const e of live(incomeEntries)) {
    if (!isWithin(e.date, range.start, range.end)) continue;
    const key = keyFor(e.date);
    ensure(key, key.length === 10 ? key : e.date).income += e.amount;
  }
  for (const t of live(transactions)) {
    if (!isWithin(t.date, range.start, range.end)) continue;
    const key = keyFor(t.date);
    ensure(key, key.length === 10 ? key : t.date).expenses += t.amount;
  }

  return [...points.values()]
    .map((p) => ({ ...p, income: round2(p.income), expenses: round2(p.expenses), net: round2(p.income - p.expenses) }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function labelFor(key: string, granularity: Granularity): string {
  if (granularity === "year") return key;
  if (granularity === "month") {
    const [y, m] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }).format(
      new Date(Date.UTC(y, m - 1, 1))
    );
  }
  const d = new Date(`${key}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(d);
}

export interface BudgetLineActual {
  categoryId: string;
  plannedAmount: number;
  actualAmount: number;
  remaining: number;
  pctUsed: number;
}

export interface BudgetActuals {
  budget: BudgetPeriod;
  plannedIncome: number;
  actualIncome: number;
  plannedExpenses: number;
  actualExpenses: number;
  lines: BudgetLineActual[];
}

export function budgetActuals(
  budget: BudgetPeriod,
  incomeEntries: IncomeEntry[],
  transactions: Transaction[]
): BudgetActuals {
  const range: Range = { start: budget.startDate, end: budget.endDate };
  const actualIncome = sumIncome(incomeEntries, range);
  const lines: BudgetLineActual[] = budget.lines.map((line) => {
    const actualAmount = sumExpenses(transactions, range, line.categoryId);
    return {
      categoryId: line.categoryId,
      plannedAmount: line.plannedAmount,
      actualAmount,
      remaining: round2(line.plannedAmount - actualAmount),
      pctUsed: line.plannedAmount > 0 ? round2((actualAmount / line.plannedAmount) * 100) : actualAmount > 0 ? 100 : 0,
    };
  });
  const plannedExpenses = round2(budget.lines.reduce((s, l) => s + l.plannedAmount, 0));
  const actualExpenses = round2(lines.reduce((s, l) => s + l.actualAmount, 0));

  return { budget, plannedIncome: budget.plannedIncome, actualIncome, plannedExpenses, actualExpenses, lines };
}

export function savingsRate(income: number, savingsAndInvesting: number): number {
  if (income <= 0) return 0;
  return round2((savingsAndInvesting / income) * 100);
}

export { getMonthRange, getWeekRange, getYearRange };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
