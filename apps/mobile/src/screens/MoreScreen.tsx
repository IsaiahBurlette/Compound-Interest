import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { useTheme } from "../ThemeContext";
import type { MoreStackParamList } from "../navigation/MoreStack";

const ITEMS: { route: keyof MoreStackParamList; label: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { route: "Savings", label: "Savings & Investing", subtitle: "Allocation strategies and recommendations", icon: "leaf-outline" },
  { route: "Reports", label: "Reports", subtitle: "Weekly, monthly, and yearly trends", icon: "bar-chart-outline" },
  { route: "Settings", label: "Settings", subtitle: "Preferences, categories, and your data", icon: "settings-outline" },
];

export function MoreScreen({ navigation }: NativeStackScreenProps<MoreStackParamList, "MoreMenu">) {
  const { colors, shared } = useTheme();
  return (
    <Screen>
      <View style={shared.header}>
        <Text style={shared.title}>More</Text>
        <Text style={shared.subtitle}>Savings, reports, and settings.</Text>
      </View>

      <View style={shared.card}>
        {ITEMS.map((item, i) => (
          <Pressable
            key={item.route}
            onPress={() => navigation.navigate(item.route)}
            style={[shared.listRow, i === ITEMS.length - 1 && { borderBottomWidth: 0 }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surfaceSunken, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={item.icon} size={17} color={colors.accent} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>{item.label}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
