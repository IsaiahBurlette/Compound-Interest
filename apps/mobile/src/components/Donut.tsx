import type { CategoryTotal } from "@compound-interest/core";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { useTheme } from "../ThemeContext";
import { formatMoney, formatPct } from "../utils/format";

const SIZE = 180;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function Donut({ rows, currency }: { rows: CategoryTotal[]; currency: string }) {
  const { colors, shared } = useTheme();
  if (rows.length === 0) {
    return (
      <View style={shared.emptyState}>
        <Text style={shared.emptyStateText}>No spending logged for this period yet.</Text>
      </View>
    );
  }

  const total = rows.reduce((s, r) => s + r.total, 0);
  let cumulative = 0;

  return (
    <View style={{ gap: 16 }}>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Svg width={SIZE} height={SIZE}>
          <G rotation={-90} originX={SIZE / 2} originY={SIZE / 2}>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.surfaceSunken} strokeWidth={STROKE} fill="none" />
            {rows.map((r) => {
              const fraction = total > 0 ? r.total / total : 0;
              const sliceLen = fraction * CIRCUMFERENCE;
              const dashoffset = -cumulative;
              cumulative += sliceLen;
              return (
                <Circle
                  key={r.category.id}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke={r.category.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${sliceLen} ${CIRCUMFERENCE - sliceLen}`}
                  strokeDashoffset={dashoffset}
                  fill="none"
                  strokeLinecap={rows.length > 1 ? "butt" : "round"}
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={[styles.centerLabel, { color: colors.textMuted }]}>TOTAL</Text>
          <Text style={[styles.centerValue, { color: colors.textPrimary }]}>{formatMoney(total, currency)}</Text>
        </View>
      </View>

      <View>
        {rows.map((r) => (
          <View key={r.category.id} style={shared.listRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}>
              <View style={[shared.dot, { backgroundColor: r.category.color }]} />
              <Text style={{ fontSize: 13.5, color: colors.textPrimary }} numberOfLines={1}>
                {r.category.name}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>{formatPct(r.pctOfSpend)}</Text>
              <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.textPrimary }}>{formatMoney(r.total, currency)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  centerValue: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
});
