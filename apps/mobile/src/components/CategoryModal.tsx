import type { Category, CategoryKind } from "@compound-interest/core";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { paletteSlots } from "../theme";
import { useTheme } from "../ThemeContext";
import { Button } from "./Button";
import { SelectField, TextField } from "./FormField";
import { Modal } from "./Modal";

export const CATEGORY_KIND_LABEL: Record<CategoryKind, string> = {
  essential: "Essential (need)",
  discretionary: "Discretionary (want)",
  savings: "Savings",
  investing: "Investing",
};

/** Create/edit form for a category. Shared by Settings and the Budgets line editor so category
 * management works the same wherever you run into it — no separate trip to Settings required. */
export function CategoryModal({
  category,
  onClose,
  onSave,
  onDelete,
}: {
  category: Category | null;
  onClose: () => void;
  onSave: (input: Partial<Category> & { name: string; kind: CategoryKind; color: string }) => void;
  onDelete?: (category: Category) => void;
}) {
  const { colors, shared } = useTheme();
  const [name, setName] = useState(category?.name ?? "");
  const [kind, setKind] = useState<CategoryKind>(category?.kind ?? "essential");
  const [color, setColor] = useState(category?.color ?? paletteSlots[0]);

  return (
    <Modal
      visible
      title={category ? "Edit category" : "New category"}
      onClose={onClose}
      footer={
        <>
          {category && onDelete && (
            <View style={{ marginRight: "auto" }}>
              <Button label="Delete" variant="danger" onPress={() => onDelete(category)} />
            </View>
          )}
          <Button label="Cancel" onPress={onClose} />
          <Button
            label="Save"
            variant="primary"
            disabled={!name.trim()}
            onPress={() => onSave({ id: category?.id, name: name.trim(), kind, color, icon: category?.icon, archived: category?.archived })}
          />
        </>
      }
    >
      <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Subscriptions" />
      <SelectField label="Kind" value={kind} onChange={setKind} options={Object.entries(CATEGORY_KIND_LABEL).map(([value, label]) => ({ value: value as CategoryKind, label }))} />
      <Text style={{ fontSize: 11.5, color: colors.textMuted, marginTop: -6 }}>
        Used to recommend how much this category gets when you auto-fill a budget from a strategy.
      </Text>
      <View style={shared.field}>
        <Text style={shared.fieldLabel}>Color</Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {paletteSlots.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: color === c ? 2 : 0, borderColor: colors.textPrimary }}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}
