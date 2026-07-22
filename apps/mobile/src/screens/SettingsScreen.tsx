import type { Category, CategoryKind, PeriodType } from "@compound-interest/core";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { Button } from "../components/Button";
import { SelectField, TextField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { useData } from "../db/DataContext";
import { useTheme } from "../ThemeContext";
import { paletteSlots } from "../theme";
import { categoryIconName } from "../utils/categoryIcons";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];
const KIND_LABEL: Record<CategoryKind, string> = {
  essential: "Essential (need)",
  discretionary: "Discretionary (want)",
  savings: "Savings",
  investing: "Investing",
};

export function SettingsScreen() {
  const { colors, shared } = useTheme();
  const { settings, allocationStrategies, categories, saveSettings, saveCategory, archiveCategory, exportData, importData, resetAllData } = useData();
  const [categoryModal, setCategoryModal] = useState<Category | null | "new">(null);

  if (!settings) return null;

  const handleExport = async () => {
    const bundle = await exportData();
    const file = new File(Paths.cache, `compound-interest-export-${new Date().toISOString().slice(0, 10)}.json`);
    if (file.exists) file.delete();
    file.create();
    file.write(JSON.stringify(bundle, null, 2));
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType: "application/json" });
    } else {
      Alert.alert("Export ready", `Saved to ${file.uri}`);
    }
  };

  const handleImport = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
    if (result.canceled) return;
    const file = new File(result.assets[0].uri);
    const bundle = JSON.parse(await file.text());
    await importData(bundle);
    Alert.alert("Import complete", "Your data has been restored from the backup.");
  };

  const confirmReset = () => {
    Alert.alert("Reset all data?", "This permanently deletes all local data on this device.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => resetAllData() },
    ]);
  };

  return (
    <Screen hasHeader>
      <Text style={[shared.subtitle, { marginTop: 0 }]}>Preferences, categories, and your data.</Text>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>Preferences</Text>
        <View style={{ gap: 12, marginTop: 12 }}>
          <SelectField label="Currency" value={settings.currency} onChange={(v) => saveSettings({ ...settings, currency: v })} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
          <SelectField
            label="Week starts on"
            value={String(settings.weekStartsOn)}
            onChange={(v) => saveSettings({ ...settings, weekStartsOn: Number(v) as 0 | 1 })}
            options={[
              { value: "1", label: "Monday" },
              { value: "0", label: "Sunday" },
            ]}
          />
          <SelectField
            label="Default budget period"
            value={settings.defaultPeriodType}
            onChange={(v) => saveSettings({ ...settings, defaultPeriodType: v as PeriodType })}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "weekly", label: "Weekly" },
            ]}
          />
          <SelectField
            label="Default allocation strategy"
            value={settings.defaultAllocationStrategyId ?? ""}
            onChange={(v) => saveSettings({ ...settings, defaultAllocationStrategyId: v || undefined })}
            options={allocationStrategies.map((s) => ({ value: s.id, label: s.name }))}
          />
        </View>
      </View>

      <View>
        <View style={[shared.row, { marginBottom: 8 }]}>
          <Text style={shared.sectionTitle}>Categories</Text>
          <Button label="Add category" onPress={() => setCategoryModal("new")} />
        </View>
        <View style={shared.card}>
          {categories.map((c) => (
            <View key={c.id} style={shared.listRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, opacity: c.archived ? 0.5 : 1, flexShrink: 1 }}>
                <View style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: colors.surfaceSunken, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={categoryIconName(c.icon)} size={14} color={c.color} />
                </View>
                <View>
                  <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.textPrimary }}>{c.name}</Text>
                  <Text style={{ fontSize: 11.5, color: colors.textMuted }}>{KIND_LABEL[c.kind]}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Pressable onPress={() => setCategoryModal(c)}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => archiveCategory(c.id, !c.archived)} hitSlop={8}>
                  <Ionicons name={c.archived ? "arrow-undo-outline" : "archive-outline"} size={17} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>Your data</Text>
        <Text style={[shared.cardSubtitle, { marginBottom: 14 }]}>Stored locally on this device. Export a backup anytime.</Text>
        <View style={{ gap: 8 }}>
          <Button label="Export backup (JSON)" onPress={handleExport} />
          <Button label="Import backup" onPress={handleImport} />
          <Button label="Reset all data" variant="danger" onPress={confirmReset} />
        </View>
      </View>

      {categoryModal && (
        <CategoryModal
          category={categoryModal === "new" ? null : categoryModal}
          onClose={() => setCategoryModal(null)}
          onSave={async (input) => {
            await saveCategory(input);
            setCategoryModal(null);
          }}
        />
      )}
    </Screen>
  );
}

function CategoryModal({
  category,
  onClose,
  onSave,
}: {
  category: Category | null;
  onClose: () => void;
  onSave: (input: Partial<Category> & { name: string; kind: CategoryKind; color: string }) => void;
}) {
  const { colors, shared } = useTheme();
  const [name, setName] = useState(category?.name ?? "");
  const [kind, setKind] = useState<CategoryKind>(category?.kind ?? "essential");
  const [color, setColor] = useState(category?.color ?? paletteSlots[0]);

  return (
    <Modal
      visible
      title={category ? "Edit category" : "Add category"}
      onClose={onClose}
      footer={
        <>
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
      <SelectField label="Kind" value={kind} onChange={setKind} options={Object.entries(KIND_LABEL).map(([value, label]) => ({ value: value as CategoryKind, label }))} />
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
