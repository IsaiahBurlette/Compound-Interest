import { Picker } from "@react-native-picker/picker";
import type { ReactNode } from "react";
import { Text, TextInput, View, type KeyboardTypeOptions } from "react-native";
import { useTheme } from "../ThemeContext";

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
}) {
  const { colors, shared } = useTheme();
  return (
    <View style={shared.field}>
      <Text style={shared.fieldLabel}>{label}</Text>
      <TextInput
        style={[shared.input, multiline && { minHeight: 70, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  const { colors, shared } = useTheme();
  return (
    <View style={shared.field}>
      <Text style={shared.fieldLabel}>{label}</Text>
      <View style={[shared.input, { padding: 0, justifyContent: "center" }]}>
        <Picker selectedValue={value} onValueChange={(v) => onChange(v as T)} style={{ color: colors.textPrimary }}>
          {options.map((o) => (
            <Picker.Item key={o.value} label={o.label} value={o.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

export function FieldGroup({ children }: { children: ReactNode }) {
  return <View style={{ gap: 12 }}>{children}</View>;
}
