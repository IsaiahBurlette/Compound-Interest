import {
  addDays,
  addMonths,
  byCategory,
  getMonthRange,
  getWeekRange,
  getYearRange,
  periodSeries,
  savingsRate,
  sumExpenses,
  sumIncome,
  todayISO,
  type Granularity,
  type Range,
} from "@compound-interest/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { SpendPieChart } from "../components/SpendPieChart";
import { StatTile } from "../components/StatTile";
import { TrendChart } from "../components/TrendChart";
import { useData } from "../db/DataContext";
import { formatDateLong, formatMoney, formatPct } from "../utils/format";

const WINDOW: Record<Granularity, number> = { week: 12, month: 12, year: 5 };

function windowRange(anchor: string, granularity: Granularity, weekStartsOn: 0 | 1): Range {
  const count = WINDOW[granularity];
  if (granularity === "week") {
    const end = getWeekRange(anchor, weekStartsOn).end;
    const start = addDays(getWeekRange(anchor, weekStartsOn).start, -7 * (count - 1));
    return { start, end };
  }
  if (granularity === "year") {
    const end = getYearRange(anchor).end;
    const start = getYearRange(addMonths(anchor, -12 * (count - 1))).start;
    return { start, end };
  }
  const end = getMonthRange(anchor).end;
  const start = getMonthRange(addMonths(anchor, -(count - 1))).start;
  return { start, end };
}

function shiftWindow(anchor: string, granularity: Granularity, direction: 1 | -1): string {
  const count = WINDOW[granularity];
  if (granularity === "week") return addDays(anchor, direction * 7 * count);
  if (granularity === "year") return addMonths(anchor, direction * 12 * count);
  return addMonths(anchor, direction * count);
}

export function ReportsTab() {
  const { incomeEntries, transactions, categories, settings } = useData();
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [anchor, setAnchor] = useState(todayISO());
  const currency = settings?.currency ?? "USD";
  const weekStartsOn = settings?.weekStartsOn ?? 1;

  const range = useMemo(() => windowRange(anchor, granularity, weekStartsOn), [anchor, granularity, weekStartsOn]);
  const series = useMemo(
    () => periodSeries(incomeEntries, transactions, range, granularity, weekStartsOn),
    [incomeEntries, transactions, range, granularity, weekStartsOn]
  );
  const categoryRows = useMemo(() => byCategory(transactions, categories, range), [transactions, categories, range]);

  const totalIncome = sumIncome(incomeEntries, range);
  const totalExpenses = sumExpenses(transactions, range);
  const netTotal = totalIncome - totalExpenses;
  const rate = savingsRate(totalIncome, Math.max(0, netTotal));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">
            {formatDateLong(range.start)} – {formatDateLong(range.end)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="segmented">
            <button className={granularity === "week" ? "active" : ""} onClick={() => setGranularity("week")}>
              Weekly
            </button>
            <button className={granularity === "month" ? "active" : ""} onClick={() => setGranularity("month")}>
              Monthly
            </button>
            <button className={granularity === "year" ? "active" : ""} onClick={() => setGranularity("year")}>
              Yearly
            </button>
          </div>
          <button className="icon-btn" onClick={() => setAnchor((a) => shiftWindow(a, granularity, -1))} aria-label="Earlier">
            <ChevronLeft size={16} />
          </button>
          <button className="icon-btn" onClick={() => setAnchor((a) => shiftWindow(a, granularity, 1))} aria-label="Later">
            <ChevronRight size={16} />
          </button>
          {anchor !== todayISO() && (
            <button className="btn btn-sm" onClick={() => setAnchor(todayISO())}>
              Today
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-stats section">
        <StatTile label="Total income" value={formatMoney(totalIncome, currency)} />
        <StatTile label="Total expenses" value={formatMoney(totalExpenses, currency)} />
        <StatTile label="Net" value={formatMoney(netTotal, currency)} tone={netTotal >= 0 ? "good" : "critical"} />
        <StatTile label="Savings rate" value={formatPct(rate)} />
      </div>

      <div className="card section">
        <div className="card-title">Income vs. expenses</div>
        <div className="card-subtitle" style={{ marginBottom: 14 }}>
          {granularity === "week" ? "Last 12 weeks" : granularity === "month" ? "Last 12 months" : "Last 5 years"}
        </div>
        <TrendChart points={series} currency={currency} />
      </div>

      <div className="card">
        <div className="card-title">Spending by category</div>
        <div className="card-subtitle" style={{ marginBottom: 14 }}>
          Across the whole window shown above
        </div>
        <SpendPieChart rows={categoryRows} currency={currency} />
      </div>
    </div>
  );
}
