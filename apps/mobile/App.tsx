import { Ionicons } from "@expo/vector-icons";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DataProvider, useData } from "./src/db/DataContext";
import { BudgetsScreen } from "./src/screens/BudgetsScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { ExpensesScreen } from "./src/screens/ExpensesScreen";
import { IncomeScreen } from "./src/screens/IncomeScreen";
import { ReportsScreen } from "./src/screens/ReportsScreen";
import { SavingsScreen } from "./src/screens/SavingsScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { colors } from "./src/theme";

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.surfacePage,
    card: colors.surface1,
    border: colors.border,
    primary: colors.accent,
    text: colors.textPrimary,
  },
};

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: "grid-outline",
  Income: "wallet-outline",
  Expenses: "receipt-outline",
  Budgets: "calendar-outline",
  Savings: "leaf-outline",
  Reports: "bar-chart-outline",
  Settings: "settings-outline",
};

function Tabs() {
  const { loading } = useData();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfacePage }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface1, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: "700" },
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONS[route.name]} size={size - 4} color={color} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Income" component={IncomeScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Savings" component={SavingsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <NavigationContainer theme={navTheme}>
          <Tabs />
        </NavigationContainer>
        <StatusBar style="dark" />
      </DataProvider>
    </SafeAreaProvider>
  );
}
