import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useTheme } from "../ThemeContext";
import { formatDateLong } from "../utils/format";

export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (iso: string) => void }) {
  const { colors, shared } = useTheme();
  const [open, setOpen] = useState(false);
  const dateObj = new Date(`${value}T00:00:00Z`);

  return (
    <View style={shared.field}>
      <Text style={shared.fieldLabel}>{label}</Text>
      <Pressable style={shared.input} onPress={() => setOpen(true)}>
        <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{formatDateLong(value)}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, selected) => {
            setOpen(Platform.OS === "ios");
            if (event.type === "dismissed" || !selected) return;
            onChange(selected.toISOString().slice(0, 10));
          }}
        />
      )}
    </View>
  );
}
