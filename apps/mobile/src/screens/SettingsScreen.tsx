import type { Category, PeriodType } from "@compound-interest/core";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Button } from "../components/Button";
import { CATEGORY_KIND_LABEL, CategoryModal } from "../components/CategoryModal";
import { Screen } from "../components/Screen";
import { SelectField } from "../components/FormField";
import { useData } from "../db/DataContext";
import { useTheme } from "../ThemeContext";
import { categoryIconName } from "../utils/categoryIcons";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];

export function SettingsScreen() {
  const { colors, shared } = useTheme();
  const {
    settings,
    allocationStrategies,
    categories,
    transactions,
    budgetPeriods,
    saveSettings,
    saveCategory,
    archiveCategory,
    removeCategory,
    exportData,
    importData,
    resetAllData,
  } = useData();
  const [categoryModal, setCategoryModal] = useState<Category | null | "new">(null);

  if (!settings) return null;

  const handleDeleteCategory = (category: Category) => {
    const txCount = transactions.filter((t) => t.categoryId === category.id && !t.deletedAt).length;
    const lineCount = budgetPeriods.reduce((n, b) => n + b.lines.filter((l) => l.categoryId === category.id).length, 0);
    const parts: string[] = [];
    if (txCount > 0) parts.push(`${txCount} transaction${txCount === 1 ? "" : "s"}`);
    if (lineCount > 0) parts.push(`${lineCount} budget line${lineCount === 1 ? "" : "s"}`);
    Alert.alert(
      `Delete "${category.name}"?`,
      parts.length > 0 ? `It's used by ${parts.join(" and ")} — those will show as "Uncategorized" instead of being deleted.` : "This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            removeCategory(category.id);
            setCategoryModal(null);
          },
        },
      ]
    );
  };

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
                  <Text style={{ fontSize: 11.5, color: colors.textMuted }}>{CATEGORY_KIND_LABEL[c.kind]}</Text>
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
          onDelete={handleDeleteCategory}
        />
      )}
    </Screen>
  );
}
