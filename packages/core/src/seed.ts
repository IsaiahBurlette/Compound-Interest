import { createId, nowISO } from "./id";
import type { Category, Settings } from "./types";

/** Categorical palette slots, in fixed order — see the project's dataviz palette. */
export const PALETTE = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  yellow: "#eda100",
  magenta: "#e87ba4",
  green: "#008300",
  violet: "#4a3aa7",
  red: "#e34948",
} as const;

export function defaultCategories(): Category[] {
  const ts = nowISO();
  const mk = (name: string, kind: Category["kind"], color: string, icon: string): Category => ({
    id: createId(),
    name,
    kind,
    color,
    icon,
    archived: false,
    updatedAt: ts,
  });
  return [
    mk("Housing", "essential", PALETTE.blue, "home"),
    mk("Utilities", "essential", PALETTE.violet, "bolt"),
    mk("Groceries", "essential", PALETTE.aqua, "cart"),
    mk("Transportation", "essential", PALETTE.yellow, "car"),
    mk("Insurance", "essential", PALETTE.red, "shield"),
    mk("Dining Out", "discretionary", PALETTE.orange, "utensils"),
    mk("Entertainment", "discretionary", PALETTE.magenta, "film"),
    mk("Shopping", "discretionary", PALETTE.green, "bag"),
    mk("Emergency Savings", "savings", PALETTE.blue, "piggy-bank"),
    mk("Investing", "investing", PALETTE.aqua, "trending-up"),
  ];
}

export function defaultSettings(): Settings {
  return {
    currency: "USD",
    weekStartsOn: 1,
    defaultPeriodType: "monthly",
    updatedAt: nowISO(),
  };
}
