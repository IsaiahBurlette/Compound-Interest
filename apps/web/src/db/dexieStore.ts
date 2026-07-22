import Dexie, { type Table } from "dexie";
import {
  defaultAllocationStrategies,
  defaultCategories,
  defaultSettings,
  type AllocationStrategy,
  type BudgetPeriod,
  type Category,
  type DataStore,
  type ExportBundle,
  type IncomeEntry,
  type IncomeSource,
  type Settings,
  type Transaction,
} from "@compound-interest/core";
import { SCHEMA_VERSION } from "@compound-interest/core";

const SETTINGS_KEY = "singleton";

interface SettingsRow extends Settings {
  key: string;
}

class CompoundInterestDB extends Dexie {
  categories!: Table<Category, string>;
  incomeSources!: Table<IncomeSource, string>;
  incomeEntries!: Table<IncomeEntry, string>;
  transactions!: Table<Transaction, string>;
  budgetPeriods!: Table<BudgetPeriod, string>;
  allocationStrategies!: Table<AllocationStrategy, string>;
  settings!: Table<SettingsRow, string>;

  constructor() {
    super("compound-interest");
    this.version(1).stores({
      categories: "id, kind, archived",
      incomeSources: "id, archived",
      incomeEntries: "id, sourceId, date",
      transactions: "id, categoryId, date",
      budgetPeriods: "id, type, startDate",
      allocationStrategies: "id",
      settings: "key",
    });
  }
}

/** Dexie/IndexedDB-backed implementation of the shared DataStore contract. */
export class DexieDataStore implements DataStore {
  private db = new CompoundInterestDB();
  private initPromise: Promise<void> | null = null;

  /** Idempotent and safe to call concurrently (e.g. React StrictMode's double effect invocation) — seeding only ever runs once. */
  init(): Promise<void> {
    if (!this.initPromise) this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    await this.db.open();
    const categoryCount = await this.db.categories.count();
    if (categoryCount === 0) {
      await this.db.categories.bulkAdd(defaultCategories());
    }
    const strategyCount = await this.db.allocationStrategies.count();
    if (strategyCount === 0) {
      await this.db.allocationStrategies.bulkAdd(defaultAllocationStrategies());
    }
    const settings = await this.db.settings.get(SETTINGS_KEY);
    if (!settings) {
      const strategies = await this.db.allocationStrategies.toArray();
      const fallback = strategies.find((s) => s.isDefault) ?? strategies[0];
      await this.db.settings.put({
        ...defaultSettings(),
        defaultAllocationStrategyId: fallback?.id,
        key: SETTINGS_KEY,
      });
    }
  }

  listCategories(): Promise<Category[]> {
    return this.db.categories.toArray();
  }
  async upsertCategory(category: Category): Promise<void> {
    await this.db.categories.put(category);
  }
  async deleteCategory(id: string): Promise<void> {
    await this.db.categories.delete(id);
  }

  listIncomeSources(): Promise<IncomeSource[]> {
    return this.db.incomeSources.toArray();
  }
  async upsertIncomeSource(source: IncomeSource): Promise<void> {
    await this.db.incomeSources.put(source);
  }
  async deleteIncomeSource(id: string): Promise<void> {
    await this.db.incomeSources.delete(id);
  }

  listIncomeEntries(): Promise<IncomeEntry[]> {
    return this.db.incomeEntries.toArray();
  }
  async upsertIncomeEntry(entry: IncomeEntry): Promise<void> {
    await this.db.incomeEntries.put(entry);
  }
  async deleteIncomeEntry(id: string): Promise<void> {
    await this.db.incomeEntries.delete(id);
  }

  listTransactions(): Promise<Transaction[]> {
    return this.db.transactions.toArray();
  }
  async upsertTransaction(tx: Transaction): Promise<void> {
    await this.db.transactions.put(tx);
  }
  async deleteTransaction(id: string): Promise<void> {
    await this.db.transactions.delete(id);
  }

  listBudgetPeriods(): Promise<BudgetPeriod[]> {
    return this.db.budgetPeriods.toArray();
  }
  async upsertBudgetPeriod(period: BudgetPeriod): Promise<void> {
    await this.db.budgetPeriods.put(period);
  }
  async deleteBudgetPeriod(id: string): Promise<void> {
    await this.db.budgetPeriods.delete(id);
  }

  listAllocationStrategies(): Promise<AllocationStrategy[]> {
    return this.db.allocationStrategies.toArray();
  }
  async upsertAllocationStrategy(strategy: AllocationStrategy): Promise<void> {
    await this.db.allocationStrategies.put(strategy);
  }

  async getSettings(): Promise<Settings> {
    const row = await this.db.settings.get(SETTINGS_KEY);
    if (!row) throw new Error("Settings not initialized — call init() first");
    const { key: _key, ...settings } = row;
    return settings;
  }
  async updateSettings(settings: Settings): Promise<void> {
    await this.db.settings.put({ ...settings, key: SETTINGS_KEY });
  }

  async exportAll(): Promise<ExportBundle> {
    const [categories, incomeSources, incomeEntries, transactions, budgetPeriods, allocationStrategies, settings] =
      await Promise.all([
        this.listCategories(),
        this.listIncomeSources(),
        this.listIncomeEntries(),
        this.listTransactions(),
        this.listBudgetPeriods(),
        this.listAllocationStrategies(),
        this.getSettings(),
      ]);
    return {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: { categories, incomeSources, incomeEntries, transactions, budgetPeriods, allocationStrategies, settings },
    };
  }

  async importAll(bundle: ExportBundle): Promise<void> {
    const { data } = bundle;
    await this.db.transaction(
      "rw",
      [
        this.db.categories,
        this.db.incomeSources,
        this.db.incomeEntries,
        this.db.transactions,
        this.db.budgetPeriods,
        this.db.allocationStrategies,
        this.db.settings,
      ],
      async () => {
        await Promise.all([
          this.db.categories.clear(),
          this.db.incomeSources.clear(),
          this.db.incomeEntries.clear(),
          this.db.transactions.clear(),
          this.db.budgetPeriods.clear(),
          this.db.allocationStrategies.clear(),
        ]);
        await Promise.all([
          this.db.categories.bulkAdd(data.categories),
          this.db.incomeSources.bulkAdd(data.incomeSources),
          this.db.incomeEntries.bulkAdd(data.incomeEntries),
          this.db.transactions.bulkAdd(data.transactions),
          this.db.budgetPeriods.bulkAdd(data.budgetPeriods),
          this.db.allocationStrategies.bulkAdd(data.allocationStrategies),
        ]);
        await this.db.settings.put({ ...data.settings, key: SETTINGS_KEY });
      }
    );
  }

  async clearAll(): Promise<void> {
    await Promise.all([
      this.db.categories.clear(),
      this.db.incomeSources.clear(),
      this.db.incomeEntries.clear(),
      this.db.transactions.clear(),
      this.db.budgetPeriods.clear(),
      this.db.allocationStrategies.clear(),
      this.db.settings.clear(),
    ]);
    this.initPromise = null; // force re-seeding after a full wipe
    await this.init();
  }
}
