import { describe, expect, it } from "vitest";
import { budgetActuals, byCategory, periodSeries, sumExpenses, sumIncome } from "../src/calculations";
import { defaultCategories } from "../src/seed";
import type { BudgetPeriod, IncomeEntry, Transaction } from "../src/types";

const ts = "2026-07-22T00:00:00.000Z";
const categories = defaultCategories();
const groceries = categories.find((c) => c.name === "Groceries")!;
const dining = categories.find((c) => c.name === "Dining Out")!;

const incomeEntries: IncomeEntry[] = [
  { id: "i1", sourceId: "s1", date: "2026-07-05", amount: 2000, updatedAt: ts },
  { id: "i2", sourceId: "s1", date: "2026-08-05", amount: 2200, updatedAt: ts },
];

const transactions: Transaction[] = [
  { id: "t1", categoryId: groceries.id, date: "2026-07-10", amount: 150, updatedAt: ts },
  { id: "t2", categoryId: dining.id, date: "2026-07-12", amount: 50, updatedAt: ts },
  { id: "t3", categoryId: groceries.id, date: "2026-08-01", amount: 100, updatedAt: ts },
  { id: "t4", categoryId: groceries.id, date: "2026-07-15", amount: 0, updatedAt: ts, deletedAt: ts },
];

describe("calculations", () => {
  it("sums income within a range", () => {
    expect(sumIncome(incomeEntries, { start: "2026-07-01", end: "2026-07-31" })).toBe(2000);
  });

  it("sums expenses within a range, excluding deleted rows", () => {
    expect(sumExpenses(transactions, { start: "2026-07-01", end: "2026-07-31" })).toBe(200);
  });

  it("sums expenses for one category", () => {
    expect(sumExpenses(transactions, { start: "2026-07-01", end: "2026-07-31" }, groceries.id)).toBe(150);
  });

  it("breaks spend down by category with percentages", () => {
    const rows = byCategory(transactions, categories, { start: "2026-07-01", end: "2026-07-31" });
    expect(rows).toHaveLength(2);
    expect(rows[0].category.id).toBe(groceries.id);
    expect(rows[0].total).toBe(150);
    expect(rows[0].pctOfSpend).toBe(75);
    expect(rows[1].pctOfSpend).toBe(25);
  });

  it("zero-fills months with no activity instead of dropping them", () => {
    const series = periodSeries(incomeEntries, transactions, { start: "2026-07-01", end: "2026-10-31" }, "month");
    expect(series.map((p) => p.key)).toEqual(["2026-07", "2026-08", "2026-09", "2026-10"]);
    expect(series[2]).toMatchObject({ key: "2026-09", income: 0, expenses: 0, net: 0 });
  });

  it("buckets income/expenses into a monthly series", () => {
    const series = periodSeries(incomeEntries, transactions, { start: "2026-07-01", end: "2026-08-31" }, "month");
    expect(series).toHaveLength(2);
    expect(series[0]).toMatchObject({ key: "2026-07", income: 2000, expenses: 200, net: 1800 });
    expect(series[1]).toMatchObject({ key: "2026-08", income: 2200, expenses: 100, net: 2100 });
  });

  it("computes planned vs actual for a budget period", () => {
    const budget: BudgetPeriod = {
      id: "b1",
      type: "monthly",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      plannedIncome: 2000,
      lines: [
        { categoryId: groceries.id, plannedAmount: 200 },
        { categoryId: dining.id, plannedAmount: 100 },
      ],
      updatedAt: ts,
    };
    const result = budgetActuals(budget, incomeEntries, transactions);
    expect(result.actualIncome).toBe(2000);
    expect(result.plannedExpenses).toBe(300);
    expect(result.actualExpenses).toBe(200);
    const groceriesLine = result.lines.find((l) => l.categoryId === groceries.id)!;
    expect(groceriesLine.actualAmount).toBe(150);
    expect(groceriesLine.remaining).toBe(50);
    expect(groceriesLine.pctUsed).toBe(75);
  });
});
