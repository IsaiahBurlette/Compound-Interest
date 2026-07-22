import { Ionicons } from "@expo/vector-icons";
import { DefaultTheme, DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DataProvider, useData } from "./src/db/DataContext";
import { MoreStack } from "./src/navigation/MoreStack";
import { AppThemeProvider, useTheme } from "./src/ThemeContext";
import { BudgetsScreen } from "./src/screens/BudgetsScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { ExpensesScreen } from "./src/screens/ExpensesScreen";
import { IncomeScreen } from "./src/screens/IncomeScreen";

const Tab = createBottomTabNavigator();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: "grid-outline",
  Income: "wallet-outline",
  Expenses: "receipt-outline",
  Budgets: "calendar-outline",
  More: "ellipsis-horizontal-circle-outline",
};

function Tabs() {
  const { colors, scheme } = useTheme();
  const { loading } = useData();

  const navTheme = {
    ...(scheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.surfacePage,
      card: colors.surface1,
      border: colors.border,
      primary: colors.accent,
      text: colors.textPrimary,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfacePage }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
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
        <Tab.Screen name="More" component={MoreStack} />
      </Tab.Navigator>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <DataProvider>
          <Tabs />
        </DataProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
