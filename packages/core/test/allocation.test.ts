import { describe, expect, it } from "vitest";
import { defaultAllocationStrategies, distributeAllocationToCategories, recommendAllocation } from "../src/allocation";
import { defaultCategories } from "../src/seed";

describe("recommendAllocation", () => {
  const strategy = defaultAllocationStrategies()[0]; // Classic 50/30/20

  it("splits income by the strategy's percentages", () => {
    const rec = recommendAllocation({ income: 4000, strategy });
    expect(rec.needs).toBe(2000);
    expect(rec.wants).toBe(1200);
    expect(rec.savingsTotal).toBe(800);
  });

  it("routes savings toward investing by the configured share when no balance is tracked", () => {
    const rec = recommendAllocation({ income: 4000, strategy });
    expect(rec.savingsToInvesting).toBe(480); // 60% of 800
    expect(rec.savingsToEmergency).toBe(320);
  });

  it("prioritizes filling the emergency fund before investing when a balance is known", () => {
    const rec = recommendAllocation({
      income: 4000,
      strategy,
      essentialExpenses: 2000,
      currentEmergencyFundBalance: 500,
    });
    // target = 3 months * 2000 = 6000, remaining = 5500, savingsTotal = 800 -> all to emergency
    expect(rec.emergencyFundTarget).toBe(6000);
    expect(rec.savingsToEmergency).toBe(800);
    expect(rec.savingsToInvesting).toBe(0);
  });

  it("routes to investing once the emergency fund target is met", () => {
    const rec = recommendAllocation({
      income: 4000,
      strategy,
      essentialExpenses: 2000,
      currentEmergencyFundBalance: 6000,
    });
    expect(rec.savingsToEmergency).toBe(0);
    expect(rec.savingsToInvesting).toBe(800);
  });

  it("flags when essential spending exceeds the needs recommendation", () => {
    const rec = recommendAllocation({ income: 4000, strategy, essentialExpenses: 2500 });
    expect(rec.overBudgetWarning).toBe(true);
  });
});

describe("distributeAllocationToCategories", () => {
  const strategy = defaultAllocationStrategies()[0];
  const categories = defaultCategories(); // 5 essential, 3 discretionary, 1 savings, 1 investing

  it("spreads each bucket evenly across active categories of that kind", () => {
    const rec = recommendAllocation({ income: 4000, strategy });
    const lines = distributeAllocationToCategories(rec, categories);
    const essentialLines = lines.filter((l) => categories.find((c) => c.id === l.categoryId)?.kind === "essential");
    expect(essentialLines).toHaveLength(5);
    const essentialTotal = round2sum(essentialLines.map((l) => l.plannedAmount));
    expect(essentialTotal).toBe(rec.needs);
  });

  it("totals across all lines match the recommendation", () => {
    const rec = recommendAllocation({ income: 4000, strategy });
    const lines = distributeAllocationToCategories(rec, categories);
    const total = round2sum(lines.map((l) => l.plannedAmount));
    expect(total).toBe(round2sum([rec.needs, rec.wants, rec.savingsToEmergency, rec.savingsToInvesting]));
  });

  it("skips a kind with no matching category", () => {
    const rec = recommendAllocation({ income: 4000, strategy });
    const noSavingsCategories = categories.filter((c) => c.kind !== "savings");
    const lines = distributeAllocationToCategories(rec, noSavingsCategories);
    expect(lines.some((l) => categories.find((c) => c.id === l.categoryId)?.kind === "savings")).toBe(false);
  });
});

function round2sum(nums: number[]): number {
  return Math.round(nums.reduce((s, n) => s + n, 0) * 100) / 100;
}
