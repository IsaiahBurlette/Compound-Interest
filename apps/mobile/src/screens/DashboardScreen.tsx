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
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Donut } from "../components/Donut";
import { Segmented } from "../components/Segmented";
import { StatTile } from "../components/StatTile";
import { useData } from "../db/DataContext";
import { colors } from "../theme";
import { shared } from "../theme.styles";
import { categoryIconName } from "../utils/categoryIcons";
import { formatDateLong, formatMoney, formatPct } from "../utils/format";

type Scope = "week" | "month" | "year";

export function DashboardScreen() {
  const { incomeEntries, transactions, categories, settings } = useData();
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
  const savingsCats = categories.filter((c) => c.kind === "savings" || c.kind === "investing");
  const savingsSpend = sumExpenses(
    transactions.filter((t) => savingsCats.some((c) => c.id === t.categoryId)),
    range
  );
  const rate = savingsRate(income, savingsSpend);
  const categoryRows = byCategory(transactions, categories, range);
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const recentTx = [...transactions]
    .filter((t) => !t.deletedAt)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content}>
      <View style={shared.header}>
        <Text style={shared.title}>Dashboard</Text>
        <Text style={shared.subtitle}>
          {formatDateLong(range.start)} – {formatDateLong(range.end)}
        </Text>
      </View>

      <Segmented
        value={scope}
        onChange={setScope}
        options={[
          { value: "week", label: "Week" },
          { value: "month", label: "Month" },
          { value: "year", label: "Year" },
        ]}
      />

      <View style={shared.statGrid}>
        <StatTile label="Income" value={formatMoney(income, currency)} />
        <StatTile label="Expenses" value={formatMoney(expenses, currency)} />
        <StatTile label="Net" value={formatMoney(net, currency)} tone={net >= 0 ? "good" : "critical"} />
        <StatTile label="Savings rate" value={formatPct(rate)} />
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>Where it went</Text>
        <Text style={[shared.cardSubtitle, { marginBottom: 14 }]}>Spending by category</Text>
        <Donut rows={categoryRows} currency={currency} />
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>Recent activity</Text>
        {recentTx.length === 0 ? (
          <View style={shared.emptyState}>
            <Text style={shared.emptyStateText}>No spending logged yet.</Text>
          </View>
        ) : (
          recentTx.map((tx) => {
            const cat = categoryById.get(tx.categoryId);
            return (
              <View key={tx.id} style={shared.listRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: colors.surfaceSunken, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={categoryIconName(cat?.icon)} size={15} color={cat?.color ?? colors.textMuted} />
                  </View>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.textPrimary }} numberOfLines={1}>
                      {cat?.name ?? "Uncategorized"}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{formatDateLong(tx.date)}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.textPrimary }}>{formatMoney(tx.amount, currency)}</Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
