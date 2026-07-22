import {
  byCategory,
  getMonthRange,
  getWeekRange,
  getYearRange,
  savingsRate,
  sumExpenses,
  sumIncome,
  todayISO,
  type Range,
} from "@compound-interest/core";
import { useMemo, useState } from "react";
import { SpendPieChart } from "../components/SpendPieChart";
import { StatTile } from "../components/StatTile";
import { useData } from "../db/DataContext";
import { formatDateLong, formatMoney, formatPct } from "../utils/format";
import { categoryIcon } from "../utils/categoryIcons";

type Scope = "week" | "month" | "year";

export function DashboardTab() {
  const { incomeEntries, transactions, categories, incomeSources, settings } = useData();
  const [scope, setScope] = useState<Scope>("month");
  const currency = settings?.currency ?? "USD";
  const weekStartsOn = settings?.weekStartsOn ?? 1;

  const range: Range = useMemo(() => {
    const today = todayISO();
    if (scope === "week") return getWeekRange(today, weekStartsOn);
    if (scope === "year") return getYearRange(today);
    return getMonthRange(today);
  }, [scope, weekStartsOn]);

  const income = sumIncome(incomeEntries, range);
  const expenses = sumExpenses(transactions, range);
  const net = income - expenses;
  const savings = categories.filter((c) => c.kind === "savings" || c.kind === "investing");
  const savingsSpend = sumExpenses(
    transactions.filter((t) => savings.some((c) => c.id === t.categoryId)),
    range
  );
  const rate = savingsRate(income, savingsSpend);
  const categoryRows = byCategory(transactions, categories, range);

  const recentTx = [...transactions]
    .filter((t) => !t.deletedAt)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const scopeLabel = scope === "week" ? "This week" : scope === "year" ? "This year" : "This month";

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {scopeLabel} · {formatDateLong(range.start)} – {formatDateLong(range.end)}
          </p>
        </div>
        <div className="segmented">
          <button className={scope === "week" ? "active" : ""} onClick={() => setScope("week")}>
            Week
          </button>
          <button className={scope === "month" ? "active" : ""} onClick={() => setScope("month")}>
            Month
          </button>
          <button className={scope === "year" ? "active" : ""} onClick={() => setScope("year")}>
            Year
          </button>
        </div>
      </div>

      <div className="grid grid-stats section">
        <StatTile label="Income" value={formatMoney(income, currency)} />
        <StatTile label="Expenses" value={formatMoney(expenses, currency)} />
        <StatTile
          label="Net"
          value={formatMoney(net, currency)}
          tone={net >= 0 ? "good" : "critical"}
          delta={net >= 0 ? "Positive cash flow" : "Spending more than you earned"}
        />
        <StatTile
          label="Savings rate"
          value={formatPct(rate)}
          delta="Of income saved or invested"
          tone={rate >= 20 ? "good" : "neutral"}
        />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Where it went</div>
          <div className="card-subtitle" style={{ marginBottom: 14 }}>
            Spending by category, {scopeLabel.toLowerCase()}
          </div>
          <SpendPieChart rows={categoryRows} currency={currency} />
        </div>

        <div className="card">
          <div className="card-title">Recent activity</div>
          <div className="card-subtitle" style={{ marginBottom: 6 }}>
            Latest logged transactions
          </div>
          {recentTx.length === 0 && incomeSources.length === 0 ? (
            <div className="empty-state">Nothing logged yet. Head to Income or Expenses to add your first entry.</div>
          ) : recentTx.length === 0 ? (
            <div className="empty-state">No spending logged yet.</div>
          ) : (
            <div>
              {recentTx.map((tx) => {
                const cat = categoryById.get(tx.categoryId);
                const Icon = categoryIcon(cat?.icon);
                return (
                  <div className="list-row" key={tx.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <span
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--surface-sunken)",
                          color: cat?.color ?? "var(--text-muted)",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={15} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {cat?.name ?? "Uncategorized"}
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {formatDateLong(tx.date)}
                        </div>
                      </div>
                    </div>
                    <div className="tabular" style={{ fontWeight: 600, fontSize: 13.5, flexShrink: 0 }}>
                      {formatMoney(tx.amount, currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
