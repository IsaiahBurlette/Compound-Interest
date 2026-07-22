import { createId, nowISO } from "./id";
import type { AllocationStrategy, BudgetLine, Category, CategoryKind } from "./types";

export interface AllocationInput {
  income: number;
  strategy: AllocationStrategy;
  /** Actual/known essential spending for the period, if available — used to flag over-budget needs. */
  essentialExpenses?: number;
  /** Cash currently held in the emergency fund, if tracked — used to prioritize filling it before investing. */
  currentEmergencyFundBalance?: number;
}

export interface AllocationRecommendation {
  needs: number;
  wants: number;
  savingsTotal: number;
  savingsToEmergency: number;
  savingsToInvesting: number;
  emergencyFundTarget: number;
  emergencyFundRemaining: number;
  overBudgetWarning: boolean;
}

/**
 * Turns one period's income into a recommended needs/wants/savings/investing
 * split. The emergency fund (cash) is topped up first, up to
 * `emergencyFundMonths` worth of essential expenses; once that target is
 * met, the savings bucket routes to investing according to
 * `investingShareOfSavingsPct`.
 */
export function recommendAllocation(input: AllocationInput): AllocationRecommendation {
  const { income, strategy, essentialExpenses, currentEmergencyFundBalance } = input;
  const needs = round2(income * (strategy.needsPct / 100));
  const wants = round2(income * (strategy.wantsPct / 100));
  const savingsTotal = round2(income * (strategy.savingsPct / 100));

  const emergencyBasis = essentialExpenses ?? needs;
  const emergencyFundTarget = round2(emergencyBasis * strategy.emergencyFundMonths);

  let savingsToEmergency: number;
  let savingsToInvesting: number;

  if (currentEmergencyFundBalance != null) {
    const remainingNeeded = Math.max(0, emergencyFundTarget - currentEmergencyFundBalance);
    savingsToEmergency = round2(Math.min(savingsTotal, remainingNeeded));
    savingsToInvesting = round2(savingsTotal - savingsToEmergency);
  } else {
    savingsToInvesting = round2(savingsTotal * (strategy.investingShareOfSavingsPct / 100));
    savingsToEmergency = round2(savingsTotal - savingsToInvesting);
  }

  const emergencyFundRemaining = currentEmergencyFundBalance != null
    ? Math.max(0, round2(emergencyFundTarget - currentEmergencyFundBalance))
    : emergencyFundTarget;

  return {
    needs,
    wants,
    savingsTotal,
    savingsToEmergency,
    savingsToInvesting,
    emergencyFundTarget,
    emergencyFundRemaining,
    overBudgetWarning: essentialExpenses != null && essentialExpenses > needs,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Spreads a recommended needs/wants/savings/investing split evenly across the
 * active categories of each matching kind, producing ready-to-use budget
 * lines. A kind with money recommended but no matching category is skipped —
 * the caller can surface that as a prompt to add one.
 */
export function distributeAllocationToCategories(
  rec: AllocationRecommendation,
  categories: Category[]
): BudgetLine[] {
  const amountByKind: Record<CategoryKind, number> = {
    essential: rec.needs,
    discretionary: rec.wants,
    savings: rec.savingsToEmergency,
    investing: rec.savingsToInvesting,
  };

  const lines: BudgetLine[] = [];
  (Object.keys(amountByKind) as CategoryKind[]).forEach((kind) => {
    const amount = amountByKind[kind];
    const kindCategories = categories.filter((c) => c.kind === kind && !c.archived);
    if (amount <= 0 || kindCategories.length === 0) return;
    const share = round2(amount / kindCategories.length);
    let allocated = 0;
    kindCategories.forEach((c, i) => {
      const isLast = i === kindCategories.length - 1;
      const plannedAmount = isLast ? round2(amount - allocated) : share;
      allocated += plannedAmount;
      lines.push({ categoryId: c.id, plannedAmount });
    });
  });
  return lines;
}

export function defaultAllocationStrategies(): AllocationStrategy[] {
  const ts = nowISO();
  return [
    {
      id: createId(),
      name: "Classic 50/30/20",
      method: "needs-wants-savings",
      needsPct: 50,
      wantsPct: 30,
      savingsPct: 20,
      investingShareOfSavingsPct: 60,
      emergencyFundMonths: 3,
      isDefault: true,
      updatedAt: ts,
    },
    {
      id: createId(),
      name: "Pay Yourself First",
      method: "pay-yourself-first",
      needsPct: 50,
      wantsPct: 25,
      savingsPct: 25,
      investingShareOfSavingsPct: 70,
      emergencyFundMonths: 3,
      isDefault: false,
      updatedAt: ts,
    },
    {
      id: createId(),
      name: "Aggressive Investor",
      method: "custom",
      needsPct: 50,
      wantsPct: 15,
      savingsPct: 35,
      investingShareOfSavingsPct: 85,
      emergencyFundMonths: 6,
      isDefault: false,
      updatedAt: ts,
    },
    {
      id: createId(),
      name: "Lean Essentials",
      method: "custom",
      needsPct: 65,
      wantsPct: 15,
      savingsPct: 20,
      investingShareOfSavingsPct: 40,
      emergencyFundMonths: 6,
      isDefault: false,
      updatedAt: ts,
    },
  ];
}
