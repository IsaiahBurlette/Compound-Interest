import type {
  AllocationStrategy,
  BudgetPeriod,
  Category,
  ExportBundle,
  IncomeEntry,
  IncomeSource,
  Settings,
  Transaction,
} from "./types";

/**
 * Storage contract implemented once per platform (Dexie/IndexedDB on web,
 * AsyncStorage or SQLite on mobile). Keeping every entity behind the same
 * interface is what lets a future cloud-sync adapter (or a test double) drop
 * in without touching UI code — it would wrap one of these and push/pull
 * diffs keyed on each record's `updatedAt`.
 */
export interface DataStore {
  init(): Promise<void>;

  listCategories(): Promise<Category[]>;
  upsertCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  listIncomeSources(): Promise<IncomeSource[]>;
  upsertIncomeSource(source: IncomeSource): Promise<void>;
  deleteIncomeSource(id: string): Promise<void>;

  listIncomeEntries(): Promise<IncomeEntry[]>;
  upsertIncomeEntry(entry: IncomeEntry): Promise<void>;
  deleteIncomeEntry(id: string): Promise<void>;

  listTransactions(): Promise<Transaction[]>;
  upsertTransaction(tx: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;

  listBudgetPeriods(): Promise<BudgetPeriod[]>;
  upsertBudgetPeriod(period: BudgetPeriod): Promise<void>;
  deleteBudgetPeriod(id: string): Promise<void>;

  listAllocationStrategies(): Promise<AllocationStrategy[]>;
  upsertAllocationStrategy(strategy: AllocationStrategy): Promise<void>;

  getSettings(): Promise<Settings>;
  updateSettings(settings: Settings): Promise<void>;

  exportAll(): Promise<ExportBundle>;
  importAll(bundle: ExportBundle): Promise<void>;
  clearAll(): Promise<void>;
}
