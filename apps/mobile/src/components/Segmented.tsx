import { Pressable, Text, View } from "react-native";
import { shared } from "../theme.styles";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <View style={shared.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} style={[shared.segmentedBtn, active && shared.segmentedBtnActive]} onPress={() => onChange(o.value)}>
            <Text style={[shared.segmentedText, active && shared.segmentedTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
