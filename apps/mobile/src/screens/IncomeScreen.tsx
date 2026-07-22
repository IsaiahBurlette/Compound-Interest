import { todayISO, type IncomeEntry, type IncomeFrequency, type IncomeSource } from "@compound-interest/core";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { Button } from "../components/Button";
import { DateField } from "../components/DateField";
import { SelectField, TextField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { useData } from "../db/DataContext";
import { useTheme } from "../ThemeContext";
import { formatDateLong, formatMoney } from "../utils/format";

const FREQUENCIES: { value: IncomeFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "semimonthly", label: "Semimonthly" },
  { value: "monthly", label: "Monthly" },
  { value: "irregular", label: "Irregular / variable" },
];

export function IncomeScreen() {
  const { colors, shared } = useTheme();
  const { incomeSources, incomeEntries, settings, saveIncomeSource, saveIncomeEntry, removeIncomeEntry } = useData();
  const currency = settings?.currency ?? "USD";
  const [sourceModal, setSourceModal] = useState<IncomeSource | null | "new">(null);
  const [entryModal, setEntryModal] = useState<IncomeEntry | null | "new">(null);

  const activeSources = incomeSources.filter((s) => !s.archived);
  const sourceById = useMemo(() => new Map(incomeSources.map((s) => [s.id, s])), [incomeSources]);
  const sortedEntries = [...incomeEntries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen>
      <View style={shared.header}>
        <Text style={shared.title}>Income</Text>
        <Text style={shared.subtitle}>Log actual income as it comes in — amounts can vary every time.</Text>
      </View>

      <Button label="Log income" variant="primary" disabled={activeSources.length === 0} onPress={() => setEntryModal("new")} />

      <View>
        <View style={[shared.row, { marginBottom: 8 }]}>
          <Text style={shared.sectionTitle}>Income sources</Text>
          <Button label="Add source" onPress={() => setSourceModal("new")} />
        </View>
        <View style={shared.card}>
          {incomeSources.length === 0 ? (
            <View style={shared.emptyState}>
              <Text style={shared.emptyStateText}>Add a source first — a job, a client, a side hustle.</Text>
            </View>
          ) : (
            incomeSources.map((s) => (
              <View key={s.id} style={shared.listRow}>
                <View style={{ opacity: s.archived ? 0.5 : 1 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.textPrimary }}>{s.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>
                    {FREQUENCIES.find((f) => f.value === s.frequency)?.label}
                    {s.expectedAmount ? ` · ~${formatMoney(s.expectedAmount, currency)}` : ""}
                  </Text>
                </View>
                <Pressable onPress={() => setSourceModal(s)}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>Edit</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </View>

      <View>
        <Text style={shared.sectionTitle}>Income log</Text>
        <View style={shared.card}>
          {sortedEntries.length === 0 ? (
            <View style={shared.emptyState}>
              <Text style={shared.emptyStateText}>No income logged yet.</Text>
            </View>
          ) : (
            sortedEntries.map((e) => (
              <View key={e.id} style={shared.listRow}>
                <View style={{ flexShrink: 1 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.textPrimary }}>
                    {sourceById.get(e.sourceId)?.name ?? "—"}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{formatDateLong(e.date)}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.textPrimary }}>{formatMoney(e.amount, currency)}</Text>
                  <Pressable onPress={() => setEntryModal(e)} hitSlop={8}>
                    <Ionicons name="create-outline" size={17} color={colors.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => removeIncomeEntry(e.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={17} color={colors.statusCritical} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {sourceModal && (
        <SourceModal
          source={sourceModal === "new" ? null : sourceModal}
          onClose={() => setSourceModal(null)}
          onSave={async (input) => {
            await saveIncomeSource(input);
            setSourceModal(null);
          }}
        />
      )}

      {entryModal && (
        <EntryModal
          entry={entryModal === "new" ? null : entryModal}
          sources={activeSources}
          onClose={() => setEntryModal(null)}
          onSave={async (input) => {
            await saveIncomeEntry(input);
            setEntryModal(null);
          }}
        />
      )}
    </Screen>
  );
}

function SourceModal({
  source,
  onClose,
  onSave,
}: {
  source: IncomeSource | null;
  onClose: () => void;
  onSave: (input: Partial<IncomeSource> & { name: string; frequency: IncomeFrequency }) => void;
}) {
  const [name, setName] = useState(source?.name ?? "");
  const [frequency, setFrequency] = useState<IncomeFrequency>(source?.frequency ?? "irregular");
  const [expectedAmount, setExpectedAmount] = useState(source?.expectedAmount?.toString() ?? "");

  return (
    <Modal
      visible
      title={source ? "Edit income source" : "Add income source"}
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" onPress={onClose} />
          <Button
            label="Save"
            variant="primary"
            disabled={!name.trim()}
            onPress={() =>
              onSave({ id: source?.id, name: name.trim(), frequency, expectedAmount: expectedAmount ? Number(expectedAmount) : undefined, archived: source?.archived })
            }
          />
        </>
      }
    >
      <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Freelance design" />
      <SelectField label="Frequency" value={frequency} onChange={setFrequency} options={FREQUENCIES} />
      <TextField label="Typical amount (optional)" value={expectedAmount} onChangeText={setExpectedAmount} placeholder="0.00" keyboardType="decimal-pad" />
    </Modal>
  );
}

function EntryModal({
  entry,
  sources,
  onClose,
  onSave,
}: {
  entry: IncomeEntry | null;
  sources: IncomeSource[];
  onClose: () => void;
  onSave: (input: Partial<IncomeEntry> & { sourceId: string; date: string; amount: number }) => void;
}) {
  const [sourceId, setSourceId] = useState(entry?.sourceId ?? sources[0]?.id ?? "");
  const [date, setDate] = useState(entry?.date ?? todayISO());
  const [amount, setAmount] = useState(entry?.amount.toString() ?? "");
  const [note, setNote] = useState(entry?.note ?? "");

  const amountNum = Number(amount);
  const valid = sourceId && amount !== "" && amountNum > 0;

  return (
    <Modal
      visible
      title={entry ? "Edit income" : "Log income"}
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" onPress={onClose} />
          <Button
            label="Save"
            variant="primary"
            disabled={!valid}
            onPress={() => onSave({ id: entry?.id, sourceId, date, amount: amountNum, note: note.trim() || undefined })}
          />
        </>
      }
    >
      <SelectField label="Source" value={sourceId} onChange={setSourceId} options={sources.map((s) => ({ value: s.id, label: s.name }))} />
      <DateField label="Date" value={date} onChange={setDate} />
      <TextField label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
      <TextField label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. Invoice #114" />
    </Modal>
  );
}
