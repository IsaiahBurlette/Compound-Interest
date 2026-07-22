import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { darkColors, lightColors, type ThemeColors } from "./theme";
import { createSharedStyles, type SharedStyles } from "./theme.styles";

interface ThemeValue {
  colors: ThemeColors;
  shared: SharedStyles;
  scheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeValue | null>(null);

/** Follows the device's system appearance setting live — no in-app toggle (yet). */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const scheme: "light" | "dark" = systemScheme === "dark" ? "dark" : "light";

  const value = useMemo<ThemeValue>(() => {
    const colors = scheme === "dark" ? darkColors : lightColors;
    return { colors, shared: createSharedStyles(colors), scheme };
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within AppThemeProvider");
  return ctx;
}
