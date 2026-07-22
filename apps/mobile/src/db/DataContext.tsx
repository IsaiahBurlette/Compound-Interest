import { createId, nowISO } from "@compound-interest/core";
import type {
  AllocationStrategy,
  BudgetPeriod,
  Category,
  ExportBundle,
  IncomeEntry,
  IncomeSource,
  Settings,
  Transaction,
} from "@compound-interest/core";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AsyncStorageDataStore } from "./asyncStorageStore";

const store = new AsyncStorageDataStore();

interface DataContextValue {
  loading: boolean;
  categories: Category[];
  incomeSources: IncomeSource[];
  incomeEntries: IncomeEntry[];
  transactions: Transaction[];
  budgetPeriods: BudgetPeriod[];
  allocationStrategies: AllocationStrategy[];
  settings: Settings | null;

  saveCategory: (input: Partial<Category> & { name: string; kind: Category["kind"]; color: string }) => Promise<void>;
  archiveCategory: (id: string, archived: boolean) => Promise<void>;

  saveIncomeSource: (input: Partial<IncomeSource> & { name: string; frequency: IncomeSource["frequency"] }) => Promise<void>;
  saveIncomeEntry: (input: Partial<IncomeEntry> & { sourceId: string; date: string; amount: number }) => Promise<void>;
  removeIncomeEntry: (id: string) => Promise<void>;

  saveTransaction: (input: Partial<Transaction> & { categoryId: string; date: string; amount: number }) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;

  saveBudgetPeriod: (input: Partial<BudgetPeriod> & Pick<BudgetPeriod, "type" | "startDate" | "endDate" | "plannedIncome" | "lines">) => Promise<BudgetPeriod>;
  removeBudgetPeriod: (id: string) => Promise<void>;

  saveAllocationStrategy: (input: Partial<AllocationStrategy> & Pick<AllocationStrategy, "name" | "method" | "needsPct" | "wantsPct" | "savingsPct" | "investingShareOfSavingsPct" | "emergencyFundMonths">) => Promise<void>;

  saveSettings: (settings: Settings) => Promise<void>;
  exportData: () => Promise<ExportBundle>;
  importData: (bundle: ExportBundle) => Promise<void>;
  resetAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetPeriods, setBudgetPeriods] = useState<BudgetPeriod[]>([]);
  const [allocationStrategies, setAllocationStrategies] = useState<AllocationStrategy[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  const reloadAll = useCallback(async () => {
    const [cats, sources, incomes, txs, budgets, strategies, s] = await Promise.all([
      store.listCategories(),
      store.listIncomeSources(),
      store.listIncomeEntries(),
      store.listTransactions(),
      store.listBudgetPeriods(),
      store.listAllocationStrategies(),
      store.getSettings(),
    ]);
    setCategories(cats);
    setIncomeSources(sources);
    setIncomeEntries(incomes);
    setTransactions(txs);
    setBudgetPeriods(budgets);
    setAllocationStrategies(strategies);
    setSettings(s);
  }, []);

  useEffect(() => {
    (async () => {
      await store.init();
      await reloadAll();
      setLoading(false);
    })();
  }, [reloadAll]);

  const saveCategory: DataContextValue["saveCategory"] = useCallback(async (input) => {
    const category: Category = {
      id: input.id ?? createId(),
      name: input.name,
      kind: input.kind,
      color: input.color,
      icon: input.icon,
      archived: input.archived ?? false,
      updatedAt: nowISO(),
    };
    await store.upsertCategory(category);
    setCategories((prev) => upsertById(prev, category));
  }, []);

  const archiveCategory: DataContextValue["archiveCategory"] = useCallback(
    async (id, archived) => {
      const existing = categories.find((c) => c.id === id);
      if (!existing) return;
      const updated = { ...existing, archived, updatedAt: nowISO() };
      await store.upsertCategory(updated);
      setCategories((prev) => upsertById(prev, updated));
    },
    [categories]
  );

  const saveIncomeSource: DataContextValue["saveIncomeSource"] = useCallback(async (input) => {
    const source: IncomeSource = {
      id: input.id ?? createId(),
      name: input.name,
      frequency: input.frequency,
      expectedAmount: input.expectedAmount,
      archived: input.archived ?? false,
      updatedAt: nowISO(),
    };
    await store.upsertIncomeSource(source);
    setIncomeSources((prev) => upsertById(prev, source));
  }, []);

  const saveIncomeEntry: DataContextValue["saveIncomeEntry"] = useCallback(async (input) => {
    const entry: IncomeEntry = {
      id: input.id ?? createId(),
      sourceId: input.sourceId,
      date: input.date,
      amount: input.amount,
      note: input.note,
      updatedAt: nowISO(),
    };
    await store.upsertIncomeEntry(entry);
    setIncomeEntries((prev) => upsertById(prev, entry));
  }, []);

  const removeIncomeEntry: DataContextValue["removeIncomeEntry"] = useCallback(async (id) => {
    await store.deleteIncomeEntry(id);
    setIncomeEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const saveTransaction: DataContextValue["saveTransaction"] = useCallback(async (input) => {
    const tx: Transaction = {
      id: input.id ?? createId(),
      categoryId: input.categoryId,
      date: input.date,
      amount: input.amount,
      note: input.note,
      updatedAt: nowISO(),
    };
    await store.upsertTransaction(tx);
    setTransactions((prev) => upsertById(prev, tx));
  }, []);

  const removeTransaction: DataContextValue["removeTransaction"] = useCallback(async (id) => {
    await store.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const saveBudgetPeriod: DataContextValue["saveBudgetPeriod"] = useCallback(async (input) => {
    const period: BudgetPeriod = {
      id: input.id ?? createId(),
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      plannedIncome: input.plannedIncome,
      lines: input.lines,
      allocationStrategyId: input.allocationStrategyId,
      notes: input.notes,
      updatedAt: nowISO(),
    };
    await store.upsertBudgetPeriod(period);
    setBudgetPeriods((prev) => upsertById(prev, period));
    return period;
  }, []);

  const removeBudgetPeriod: DataContextValue["removeBudgetPeriod"] = useCallback(async (id) => {
    await store.deleteBudgetPeriod(id);
    setBudgetPeriods((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const saveAllocationStrategy: DataContextValue["saveAllocationStrategy"] = useCallback(async (input) => {
    const strategy: AllocationStrategy = {
      id: input.id ?? createId(),
      name: input.name,
      method: input.method,
      needsPct: input.needsPct,
      wantsPct: input.wantsPct,
      savingsPct: input.savingsPct,
      investingShareOfSavingsPct: input.investingShareOfSavingsPct,
      emergencyFundMonths: input.emergencyFundMonths,
      isDefault: input.isDefault ?? false,
      updatedAt: nowISO(),
    };
    await store.upsertAllocationStrategy(strategy);
    setAllocationStrategies((prev) => upsertById(prev, strategy));
  }, []);

  const saveSettings: DataContextValue["saveSettings"] = useCallback(async (next) => {
    await store.updateSettings(next);
    setSettings(next);
  }, []);

  const exportData = useCallback(() => store.exportAll(), []);
  const importData = useCallback(
    async (bundle: ExportBundle) => {
      await store.importAll(bundle);
      await reloadAll();
    },
    [reloadAll]
  );
  const resetAllData = useCallback(async () => {
    await store.clearAll();
    await reloadAll();
  }, [reloadAll]);

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      categories,
      incomeSources,
      incomeEntries,
      transactions,
      budgetPeriods,
      allocationStrategies,
      settings,
      saveCategory,
      archiveCategory,
      saveIncomeSource,
      saveIncomeEntry,
      removeIncomeEntry,
      saveTransaction,
      removeTransaction,
      saveBudgetPeriod,
      removeBudgetPeriod,
      saveAllocationStrategy,
      saveSettings,
      exportData,
      importData,
      resetAllData,
    }),
    [
      loading,
      categories,
      incomeSources,
      incomeEntries,
      transactions,
      budgetPeriods,
      allocationStrategies,
      settings,
      saveCategory,
      archiveCategory,
      saveIncomeSource,
      saveIncomeEntry,
      removeIncomeEntry,
      saveTransaction,
      removeTransaction,
      saveBudgetPeriod,
      removeBudgetPeriod,
      saveAllocationStrategy,
      saveSettings,
      exportData,
      importData,
      resetAllData,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((i) => i.id === item.id);
  if (idx === -1) return [...list, item];
  const copy = list.slice();
  copy[idx] = item;
  return copy;
}
