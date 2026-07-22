import { Text, View } from "react-native";
import { useTheme } from "../ThemeContext";

export function StatTile({
  label,
  value,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "good" | "critical";
}) {
  const { colors, shared } = useTheme();
  return (
    <View style={shared.statTile}>
      <Text style={shared.statLabel}>{label}</Text>
      <Text style={shared.statValue}>{value}</Text>
      {delta && (
        <Text style={[shared.statDelta, tone === "good" && { color: colors.successText }, tone === "critical" && { color: colors.statusCritical }]}>
          {delta}
        </Text>
      )}
    </View>
  );
}
