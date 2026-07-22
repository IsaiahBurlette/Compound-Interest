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
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Donut } from "../components/Donut";
import { Segmented } from "../components/Segmented";
import { StatTile } from "../components/StatTile";
import { TrendBars } from "../components/TrendBars";
import { useData } from "../db/DataContext";
import { colors } from "../theme";
import { shared } from "../theme.styles";
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

export function ReportsScreen() {
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
    <ScrollView style={shared.screen} contentContainerStyle={shared.content}>
      <View style={shared.header}>
        <Text style={shared.title}>Reports</Text>
        <Text style={shared.subtitle}>
          {formatDateLong(range.start)} – {formatDateLong(range.end)}
        </Text>
      </View>

      <Segmented
        value={granularity}
        onChange={setGranularity}
        options={[
          { value: "week", label: "Weekly" },
          { value: "month", label: "Monthly" },
          { value: "year", label: "Yearly" },
        ]}
      />

      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <Pressable style={shared.btn} onPress={() => setAnchor((a) => shiftWindow(a, granularity, -1))}>
          <Ionicons name="chevron-back" size={16} color={colors.textPrimary} />
        </Pressable>
        <Pressable style={shared.btn} onPress={() => setAnchor((a) => shiftWindow(a, granularity, 1))}>
          <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
        </Pressable>
        {anchor !== todayISO() && (
          <Pressable style={shared.btn} onPress={() => setAnchor(todayISO())}>
            <Text style={shared.btnText}>Today</Text>
          </Pressable>
        )}
      </View>

      <View style={shared.statGrid}>
        <StatTile label="Total income" value={formatMoney(totalIncome, currency)} />
        <StatTile label="Total expenses" value={formatMoney(totalExpenses, currency)} />
        <StatTile label="Net" value={formatMoney(netTotal, currency)} tone={netTotal >= 0 ? "good" : "critical"} />
        <StatTile label="Savings rate" value={formatPct(rate)} />
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>Income vs. expenses</Text>
        <Text style={[shared.cardSubtitle, { marginBottom: 14 }]}>
          {granularity === "week" ? "Last 12 weeks" : granularity === "month" ? "Last 12 months" : "Last 5 years"}
        </Text>
        <TrendBars points={series} currency={currency} />
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>Spending by category</Text>
        <Text style={[shared.cardSubtitle, { marginBottom: 14 }]}>Across the window above</Text>
        <Donut rows={categoryRows} currency={currency} />
      </View>
    </ScrollView>
  );
}
