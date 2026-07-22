import type { ReactNode } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { shared } from "../theme.styles";

/**
 * Standard screen scaffold: a scrollable content column padded for the
 * device's status bar / notch. React Navigation's tab bar already accounts
 * for the bottom inset, but with headerShown:false nothing pads the top —
 * without this, content renders flush against the status bar on Android's
 * edge-to-edge default and on notched iPhones.
 */
export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={shared.screen} contentContainerStyle={[shared.content, { paddingTop: 16 + insets.top }]}>
      {children}
    </ScrollView>
  );
}
