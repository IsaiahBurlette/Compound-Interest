import type { ReactNode } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../ThemeContext";

/**
 * Standard screen scaffold: a scrollable content column padded for the
 * device's status bar / notch. Tab screens render with headerShown:false, so
 * nothing else pads the top — without this, content renders flush against
 * the status bar on Android's edge-to-edge default and on notched iPhones.
 * Screens pushed under a native-stack header (e.g. the More stack) already
 * get that clearance from the header itself, so pass hasHeader to skip it.
 */
export function Screen({ children, hasHeader = false }: { children: ReactNode; hasHeader?: boolean }) {
  const insets = useSafeAreaInsets();
  const { shared } = useTheme();
  return (
    <ScrollView style={shared.screen} contentContainerStyle={[shared.content, { paddingTop: hasHeader ? 16 : 16 + insets.top }]}>
      {children}
    </ScrollView>
  );
}
