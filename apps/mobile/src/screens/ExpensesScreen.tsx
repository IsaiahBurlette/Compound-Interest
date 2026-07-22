import {
  getMonthRange,
  getWeekRange,
  getYearRange,
  isWithin,
  todayISO,
  type Category,
  type Transaction,
} from "@compound-interest/core";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { Button } from "../components/Button";
import { DateField } from "../components/DateField";
import { SelectField, TextField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { Segmented } from "../components/Segmented";
import { useData } from "../db/DataContext";
import { useTheme } from "../ThemeContext";
import { categoryIconName } from "../utils/categoryIcons";
import { formatDateLong, formatMoney } from "../utils/format";

type Scope = "all" | "week" | "month" | "year";

export function ExpensesScreen() {
  const { colors, shared } = useTheme();
  const { categories, transactions, settings, saveTransaction, removeTransaction } = useData();
  const currency = settings?.currency ?? "USD";
  const weekStartsOn = settings?.weekStartsOn ?? 1;
  const [scope, setScope] = useState<Scope>("month");
  const [txModal, setTxModal] = useState<Transaction | null | "new">(null);

  const activeCategories = categories.filter((c) => !c.archived);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    const today = todayISO();
    const list = transactions.filter((t) => !t.deletedAt);
    if (scope === "all") return list;
    const range = scope === "week" ? getWeekRange(today, weekStartsOn) : scope === "year" ? getYearRange(today) : getMonthRange(today);
    return list.filter((t) => isWithin(t.date, range.start, range.end));
  }, [transactions, scope, weekStartsOn]);

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const total = sorted.reduce((s, t) => s + t.amount, 0);

  const handleDelete = (tx: Transaction) => {
    Alert.alert("Delete this expense?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeTransaction(tx.id) },
    ]);
  };

  return (
    <Screen>
      <View style={shared.header}>
        <Text style={shared.title}>Expenses</Text>
        <Text style={shared.subtitle}>Track every dollar spent, categorized as you go.</Text>
      </View>

      <Button label="Log expense" variant="primary" disabled={activeCategories.length === 0} onPress={() => setTxModal("new")} />

      <Segmented
        value={scope}
        onChange={setScope}
        options={[
          { value: "all", label: "All" },
          { value: "week", label: "Week" },
          { value: "month", label: "Month" },
          { value: "year", label: "Year" },
        ]}
      />
      <Text style={{ fontSize: 12.5, color: colors.textMuted }}>
        {sorted.length} transaction{sorted.length === 1 ? "" : "s"} · {formatMoney(total, currency)}
      </Text>

      <View style={shared.card}>
        {sorted.length === 0 ? (
          <View style={shared.emptyState}>
            <Text style={shared.emptyStateText}>
              {activeCategories.length === 0 ? "Add a category in Settings first." : "No expenses logged for this period."}
            </Text>
          </View>
        ) : (
          sorted.map((t) => {
            const cat = categoryById.get(t.categoryId);
            return (
              <View key={t.id} style={shared.listRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 }}>
                  <Ionicons name={categoryIconName(cat?.icon)} size={16} color={cat?.color ?? colors.textMuted} />
                  <View style={{ flexShrink: 1 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.textPrimary }} numberOfLines={1}>
                      {cat?.name ?? "Uncategorized"}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{formatDateLong(t.date)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.textPrimary }}>{formatMoney(t.amount, currency)}</Text>
                  <Pressable onPress={() => setTxModal(t)} hitSlop={8}>
                    <Ionicons name="create-outline" size={17} color={colors.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(t)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={17} color={colors.statusCritical} />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </View>

      {txModal && (
        <TransactionModal
          tx={txModal === "new" ? null : txModal}
          categories={activeCategories}
          onClose={() => setTxModal(null)}
          onSave={async (input) => {
            await saveTransaction(input);
            setTxModal(null);
          }}
        />
      )}
    </Screen>
  );
}

function TransactionModal({
  tx,
  categories,
  onClose,
  onSave,
}: {
  tx: Transaction | null;
  categories: Category[];
  onClose: () => void;
  onSave: (input: Partial<Transaction> & { categoryId: string; date: string; amount: number }) => void;
}) {
  const [categoryId, setCategoryId] = useState(tx?.categoryId ?? categories[0]?.id ?? "");
  const [date, setDate] = useState(tx?.date ?? todayISO());
  const [amount, setAmount] = useState(tx?.amount.toString() ?? "");
  const [note, setNote] = useState(tx?.note ?? "");

  const amountNum = Number(amount);
  const valid = categoryId && amount !== "" && amountNum > 0;

  return (
    <Modal
      visible
      title={tx ? "Edit expense" : "Log expense"}
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" onPress={onClose} />
          <Button
            label="Save"
            variant="primary"
            disabled={!valid}
            onPress={() => onSave({ id: tx?.id, categoryId, date, amount: amountNum, note: note.trim() || undefined })}
          />
        </>
      }
    >
      <SelectField label="Category" value={categoryId} onChange={setCategoryId} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
      <DateField label="Date" value={date} onChange={setDate} />
      <TextField label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
      <TextField label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. Weekly grocery run" />
    </Modal>
  );
}
