import type { PeriodPoint } from "@compound-interest/core";
import { ScrollView, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";
import { formatMoney } from "../utils/format";

const CHART_HEIGHT = 160;
const BAR_WIDTH = 10;

export function TrendBars({ points, currency }: { points: PeriodPoint[]; currency: string }) {
  const { colors, shared } = useTheme();
  if (points.length === 0) {
    return (
      <View style={shared.emptyState}>
        <Text style={shared.emptyStateText}>Nothing to show yet — add income and expenses to see trends.</Text>
      </View>
    );
  }

  const max = Math.max(1, ...points.map((p) => Math.max(p.income, p.expenses)));

  return (
    <View>
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={[shared.dot, { backgroundColor: colors.series1 }]} />
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>Income</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={[shared.dot, { backgroundColor: colors.series2 }]} />
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>Expenses</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", height: CHART_HEIGHT, gap: 14, paddingHorizontal: 4 }}>
          {points.map((p) => (
            <View key={p.key} style={{ alignItems: "center", gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-end", height: CHART_HEIGHT - 20, gap: 3 }}>
                <View
                  style={{
                    width: BAR_WIDTH,
                    height: Math.max(2, (p.income / max) * (CHART_HEIGHT - 20)),
                    backgroundColor: colors.series1,
                    borderRadius: 3,
                  }}
                />
                <View
                  style={{
                    width: BAR_WIDTH,
                    height: Math.max(2, (p.expenses / max) * (CHART_HEIGHT - 20)),
                    backgroundColor: colors.series2,
                    borderRadius: 3,
                  }}
                />
              </View>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>{p.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 6 }}>Scale: 0 – {formatMoney(max, currency)}</Text>
    </View>
  );
}
