/**
 * Domain model for Compound Interest.
 *
 * Every record carries `updatedAt` and an optional `deletedAt` tombstone.
 * Nothing here talks to a network today (storage is local-only), but a future
 * sync layer can diff on `updatedAt` and honor tombstones without a schema
 * change — that's the only reason these two fields exist on every entity.
 */

export type ID = string;
export type ISODate = string; // 'YYYY-MM-DD'
export type ISODateTime = string; // full ISO 8601 timestamp

export type PeriodType = "weekly" | "monthly";

export type CategoryKind =
  | "essential" // needs: rent, utilities, groceries, insurance...
  | "discretionary" // wants: dining out, hobbies, subscriptions...
  | "savings" // emergency fund / cash goals
  | "investing"; // brokerage, retirement, etc.

export interface Category {
  id: ID;
  name: string;
  kind: CategoryKind;
  color: string; // one of the categorical palette slots
  icon?: string;
  archived: boolean;
  updatedAt: ISODateTime;
  deletedAt?: ISODateTime;
}

export type IncomeFrequency =
  | "weekly"
  | "biweekly"
  | "semimonthly"
  | "monthly"
  | "irregular";

/** A recurring or one-off place money comes from (job, freelance client, etc). */
export interface IncomeSource {
  id: ID;
  name: string;
  frequency: IncomeFrequency;
  expectedAmount?: number; // typical amount; income itself is variable so this is just a planning hint
  archived: boolean;
  updatedAt: ISODateTime;
  deletedAt?: ISODateTime;
}

/** An actual, manually-entered income event. */
export interface IncomeEntry {
  id: ID;
  sourceId: ID;
  date: ISODate;
  amount: number;
  note?: string;
  updatedAt: ISODateTime;
  deletedAt?: ISODateTime;
}

/** An actual, manually-entered expense/spend event. */
export interface Transaction {
  id: ID;
  categoryId: ID;
  date: ISODate;
  amount: number;
  note?: string;
  updatedAt: ISODateTime;
  deletedAt?: ISODateTime;
}

/** One planned line item inside a budget period. */
export interface BudgetLine {
  categoryId: ID;
  plannedAmount: number;
}

/**
 * A budget for a single period (one week or one calendar month). Budgets can
 * be created for periods that haven't started yet ("budget N months ahead"),
 * and a household can mix weekly and monthly periods over time.
 */
export interface BudgetPeriod {
  id: ID;
  type: PeriodType;
  startDate: ISODate; // Monday for weekly, 1st-of-month for monthly
  endDate: ISODate; // inclusive
  plannedIncome: number;
  lines: BudgetLine[];
  allocationStrategyId?: ID;
  notes?: string;
  updatedAt: ISODateTime;
  deletedAt?: ISODateTime;
}

export type AllocationMethod = "needs-wants-savings" | "pay-yourself-first" | "custom";

/**
 * Rules for turning income into a recommended split. `savingsPct` is the
 * combined savings+investing bucket; `investingShareOfSavingsPct` divides
 * that bucket between cash savings and investing once the emergency fund
 * target (in months of essential expenses) has been met.
 */
export interface AllocationStrategy {
  id: ID;
  name: string;
  method: AllocationMethod;
  needsPct: number;
  wantsPct: number;
  savingsPct: number; // needsPct + wantsPct + savingsPct should equal 100
  investingShareOfSavingsPct: number; // 0-100, applied once emergency fund target is met
  emergencyFundMonths: number; // months of essential expenses to hold as cash before investing more
  isDefault: boolean;
  updatedAt: ISODateTime;
  deletedAt?: ISODateTime;
}

export interface Settings {
  currency: string; // ISO 4217, e.g. 'USD'
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  defaultPeriodType: PeriodType;
  defaultAllocationStrategyId?: ID;
  /** Cash currently held as an emergency fund, if the user chooses to track it — powers the savings/investing split. */
  emergencyFundBalance?: number;
  updatedAt: ISODateTime;
}

export interface AppData {
  categories: Category[];
  incomeSources: IncomeSource[];
  incomeEntries: IncomeEntry[];
  transactions: Transaction[];
  budgetPeriods: BudgetPeriod[];
  allocationStrategies: AllocationStrategy[];
  settings: Settings;
}

export const SCHEMA_VERSION = 1;

export interface ExportBundle {
  schemaVersion: number;
  exportedAt: ISODateTime;
  data: AppData;
}
