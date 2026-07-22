import type { ReactNode } from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "../ThemeContext";

type Variant = "default" | "primary" | "danger";

export function Button({
  label,
  onPress,
  variant = "default",
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  const { shared } = useTheme();
  const variantStyle = variant === "primary" ? shared.btnPrimary : variant === "danger" ? shared.btnDanger : null;
  const textStyle = variant === "primary" ? shared.btnPrimaryText : variant === "danger" ? shared.btnDangerText : null;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[shared.btn, variantStyle, disabled && { opacity: 0.5 }]}
    >
      {icon}
      <Text style={[shared.btnText, textStyle]}>{label}</Text>
    </Pressable>
  );
}
