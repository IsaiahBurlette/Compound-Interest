import { Text, View } from "react-native";
import { colors } from "../theme";
import { shared } from "../theme.styles";

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
