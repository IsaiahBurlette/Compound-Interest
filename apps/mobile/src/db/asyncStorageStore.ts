import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SCHEMA_VERSION,
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

const KEYS = {
  categories: "ci:categories",
  incomeSources: "ci:incomeSources",
  incomeEntries: "ci:incomeEntries",
  transactions: "ci:transactions",
  budgetPeriods: "ci:budgetPeriods",
  allocationStrategies: "ci:allocationStrategies",
  settings: "ci:settings",
} as const;

async function readList<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T[]) : [];
}

async function writeList<T>(key: string, list: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(list));
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((i) => i.id === item.id);
  if (idx === -1) return [...list, item];
  const copy = list.slice();
  copy[idx] = item;
  return copy;
}

/** AsyncStorage-backed implementation of the shared DataStore contract — mirrors the web app's Dexie store one-for-one. */
export class AsyncStorageDataStore implements DataStore {
  private initPromise: Promise<void> | null = null;

  init(): Promise<void> {
    if (!this.initPromise) this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    const categories = await readList<Category>(KEYS.categories);
    if (categories.length === 0) {
      await writeList(KEYS.categories, defaultCategories());
    }
    const strategies = await readList<AllocationStrategy>(KEYS.allocationStrategies);
    if (strategies.length === 0) {
      await writeList(KEYS.allocationStrategies, defaultAllocationStrategies());
    }
    const settingsRaw = await AsyncStorage.getItem(KEYS.settings);
    if (!settingsRaw) {
      const seededStrategies = strategies.length > 0 ? strategies : await readList<AllocationStrategy>(KEYS.allocationStrategies);
      const fallback = seededStrategies.find((s) => s.isDefault) ?? seededStrategies[0];
      const settings: Settings = { ...defaultSettings(), defaultAllocationStrategyId: fallback?.id };
      await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
    }
  }

  listCategories(): Promise<Category[]> {
    return readList(KEYS.categories);
  }
  async upsertCategory(category: Category): Promise<void> {
    await writeList(KEYS.categories, upsert(await this.listCategories(), category));
  }

  listIncomeSources(): Promise<IncomeSource[]> {
    return readList(KEYS.incomeSources);
  }
  async upsertIncomeSource(source: IncomeSource): Promise<void> {
    await writeList(KEYS.incomeSources, upsert(await this.listIncomeSources(), source));
  }

  listIncomeEntries(): Promise<IncomeEntry[]> {
    return readList(KEYS.incomeEntries);
  }
  async upsertIncomeEntry(entry: IncomeEntry): Promise<void> {
    await writeList(KEYS.incomeEntries, upsert(await this.listIncomeEntries(), entry));
  }
  async deleteIncomeEntry(id: string): Promise<void> {
    await writeList(KEYS.incomeEntries, (await this.listIncomeEntries()).filter((e) => e.id !== id));
  }

  listTransactions(): Promise<Transaction[]> {
    return readList(KEYS.transactions);
  }
  async upsertTransaction(tx: Transaction): Promise<void> {
    await writeList(KEYS.transactions, upsert(await this.listTransactions(), tx));
  }
  async deleteTransaction(id: string): Promise<void> {
    await writeList(KEYS.transactions, (await this.listTransactions()).filter((t) => t.id !== id));
  }

  listBudgetPeriods(): Promise<BudgetPeriod[]> {
    return readList(KEYS.budgetPeriods);
  }
  async upsertBudgetPeriod(period: BudgetPeriod): Promise<void> {
    await writeList(KEYS.budgetPeriods, upsert(await this.listBudgetPeriods(), period));
  }
  async deleteBudgetPeriod(id: string): Promise<void> {
    await writeList(KEYS.budgetPeriods, (await this.listBudgetPeriods()).filter((b) => b.id !== id));
  }

  listAllocationStrategies(): Promise<AllocationStrategy[]> {
    return readList(KEYS.allocationStrategies);
  }
  async upsertAllocationStrategy(strategy: AllocationStrategy): Promise<void> {
    await writeList(KEYS.allocationStrategies, upsert(await this.listAllocationStrategies(), strategy));
  }

  async getSettings(): Promise<Settings> {
    const raw = await AsyncStorage.getItem(KEYS.settings);
    if (!raw) throw new Error("Settings not initialized — call init() first");
    return JSON.parse(raw) as Settings;
  }
  async updateSettings(settings: Settings): Promise<void> {
    await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
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
    await Promise.all([
      writeList(KEYS.categories, data.categories),
      writeList(KEYS.incomeSources, data.incomeSources),
      writeList(KEYS.incomeEntries, data.incomeEntries),
      writeList(KEYS.transactions, data.transactions),
      writeList(KEYS.budgetPeriods, data.budgetPeriods),
      writeList(KEYS.allocationStrategies, data.allocationStrategies),
      AsyncStorage.setItem(KEYS.settings, JSON.stringify(data.settings)),
    ]);
  }

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
    this.initPromise = null;
    await this.init();
  }
}
