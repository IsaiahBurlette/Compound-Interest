import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MoreScreen } from "../screens/MoreScreen";
import { ReportsScreen } from "../screens/ReportsScreen";
import { SavingsScreen } from "../screens/SavingsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { useTheme } from "../ThemeContext";

export type MoreStackParamList = {
  MoreMenu: undefined;
  Savings: undefined;
  Reports: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

/** Houses the less-frequently-used screens behind a single "More" tab, keeping the bottom tab bar to 5 items instead of 7. */
export function MoreStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface1 },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.surfacePage },
      }}
    >
      <Stack.Screen name="MoreMenu" component={MoreScreen} options={{ title: "More" }} />
      <Stack.Screen name="Savings" component={SavingsScreen} options={{ title: "Savings & Investing" }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: "Reports" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
    </Stack.Navigator>
  );
}
