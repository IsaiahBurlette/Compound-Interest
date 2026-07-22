import { recommendAllocation, type AllocationMethod, type AllocationStrategy } from "@compound-interest/core";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "../components/Button";
import { SelectField, TextField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { useData } from "../db/DataContext";
import { colors } from "../theme";
import { shared } from "../theme.styles";
import { formatMoney } from "../utils/format";

const METHOD_LABEL: Record<AllocationMethod, string> = {
  "needs-wants-savings": "Needs / Wants / Savings",
  "pay-yourself-first": "Pay Yourself First",
  custom: "Custom",
};

export function SavingsScreen() {
  const { allocationStrategies, settings, saveAllocationStrategy, saveSettings } = useData();
  const [strategyModal, setStrategyModal] = useState<AllocationStrategy | null | "new">(null);
  const [calcStrategyId, setCalcStrategyId] = useState(settings?.defaultAllocationStrategyId ?? allocationStrategies[0]?.id ?? "");
  const [income, setIncome] = useState("");
  const [emergencyBalance, setEmergencyBalance] = useState(settings?.emergencyFundBalance?.toString() ?? "");
  const currency = settings?.currency ?? "USD";

  const strategy = allocationStrategies.find((s) => s.id === calcStrategyId) ?? allocationStrategies[0];
  const rec = useMemo(() => {
    const incomeNum = Number(income);
    if (!strategy || !incomeNum || incomeNum <= 0) return null;
    return recommendAllocation({ income: incomeNum, strategy, currentEmergencyFundBalance: settings?.emergencyFundBalance });
  }, [income, strategy, settings?.emergencyFundBalance]);

  const emergencyProgress = rec && rec.emergencyFundTarget > 0 ? Math.min(100, ((settings?.emergencyFundBalance ?? 0) / rec.emergencyFundTarget) * 100) : 0;

  const commitEmergencyBalance = () => {
    if (!settings) return;
    const value = emergencyBalance ? Number(emergencyBalance) : undefined;
    saveSettings({ ...settings, emergencyFundBalance: value });
  };

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content}>
      <View style={shared.header}>
        <Text style={shared.title}>Savings & Investing</Text>
        <Text style={shared.subtitle}>Fill your emergency fund first, then invest.</Text>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>Recommendation calculator</Text>
        <View style={{ gap: 12, marginTop: 12 }}>
          <SelectField
            label="Strategy"
            value={calcStrategyId}
            onChange={setCalcStrategyId}
            options={allocationStrategies.map((s) => ({ value: s.id, label: `${s.name} (${s.needsPct}/${s.wantsPct}/${s.savingsPct})` }))}
          />
          <TextField label="Income this period" value={income} onChangeText={setIncome} placeholder="0.00" keyboardType="decimal-pad" />
          <TextField
            label="Current emergency fund balance"
            value={emergencyBalance}
            onChangeText={setEmergencyBalance}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          <Button label="Update balance" onPress={commitEmergencyBalance} />
        </View>

        {!rec ? (
          <View style={shared.emptyState}>
            <Text style={shared.emptyStateText}>Enter an income amount to see your recommended split.</Text>
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: "row", height: 14, borderRadius: 999, overflow: "hidden" }}>
              <Bar value={rec.needs} total={total(rec)} color={colors.series1} />
              <Bar value={rec.wants} total={total(rec)} color={colors.series2} />
              <Bar value={rec.savingsToEmergency} total={total(rec)} color={colors.series3} />
              <Bar value={rec.savingsToInvesting} total={total(rec)} color={colors.series7} />
            </View>
            <View style={{ gap: 10, marginTop: 14 }}>
              <SplitRow color={colors.series1} label="Needs" amount={rec.needs} currency={currency} />
              <SplitRow color={colors.series2} label="Wants" amount={rec.wants} currency={currency} />
              <SplitRow color={colors.series3} label="Emergency savings" amount={rec.savingsToEmergency} currency={currency} />
              <SplitRow color={colors.series7} label="Investing" amount={rec.savingsToInvesting} currency={currency} />
            </View>

            {rec.overBudgetWarning && (
              <View style={[shared.pill, { marginTop: 12, backgroundColor: "#d03b3b26" }]}>
                <Text style={[shared.pillText, { color: colors.statusCritical }]}>Essential expenses exceed recommended needs</Text>
              </View>
            )}

            <View style={{ marginTop: 18 }}>
              <View style={[shared.row, { marginBottom: 6 }]}>
                <Text style={{ fontSize: 12.5, fontWeight: "700", color: colors.textPrimary }}>Emergency fund progress</Text>
                <Text style={{ fontSize: 11.5, color: colors.textMuted }}>
                  {formatMoney(settings?.emergencyFundBalance ?? 0, currency)} / {formatMoney(rec.emergencyFundTarget, currency)}
                </Text>
              </View>
              <View style={shared.progressTrack}>
                <View style={[shared.progressFill, { width: `${emergencyProgress}%`, backgroundColor: colors.series3 }]} />
              </View>
            </View>
          </View>
        )}
      </View>

      <View>
        <View style={[shared.row, { marginBottom: 8 }]}>
          <Text style={shared.sectionTitle}>Allocation strategies</Text>
          <Button label="New" onPress={() => setStrategyModal("new")} />
        </View>
        {allocationStrategies.map((s) => (
          <View key={s.id} style={[shared.statTile, { marginBottom: 8, minWidth: "100%" }]}>
            <View style={shared.row}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                <Text style={{ fontWeight: "700", fontSize: 13.5, color: colors.textPrimary }}>{s.name}</Text>
                {settings?.defaultAllocationStrategyId === s.id && (
                  <View style={shared.pill}>
                    <Text style={shared.pillText}>Default</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Pressable onPress={() => settings && saveSettings({ ...settings, defaultAllocationStrategyId: s.id })} hitSlop={8}>
                  <Ionicons name={settings?.defaultAllocationStrategyId === s.id ? "star" : "star-outline"} size={17} color={colors.accent} />
                </Pressable>
                <Pressable onPress={() => setStrategyModal(s)}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>Edit</Text>
                </Pressable>
              </View>
            </View>
            <Text style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 4 }}>
              {METHOD_LABEL[s.method]} · {s.needsPct}/{s.wantsPct}/{s.savingsPct} · {s.emergencyFundMonths}mo fund
            </Text>
          </View>
        ))}
      </View>

      {strategyModal && (
        <StrategyModal
          strategy={strategyModal === "new" ? null : strategyModal}
          onClose={() => setStrategyModal(null)}
          onSave={async (input) => {
            await saveAllocationStrategy(input);
            setStrategyModal(null);
          }}
        />
      )}
    </ScrollView>
  );
}

function total(rec: ReturnType<typeof recommendAllocation>): number {
  return rec.needs + rec.wants + rec.savingsToEmergency + rec.savingsToInvesting || 1;
}
function Bar({ value, total, color }: { value: number; total: number; color: string }) {
  return <View style={{ width: `${(value / total) * 100}%`, backgroundColor: color }} />;
}
function SplitRow({ color, label, amount, currency }: { color: string; label: string; amount: number; currency: string }) {
  return (
    <View style={shared.row}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={[shared.dot, { backgroundColor: color }]} />
        <Text style={{ fontSize: 13.5, color: colors.textPrimary }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.textPrimary }}>{formatMoney(amount, currency)}</Text>
    </View>
  );
}

function StrategyModal({
  strategy,
  onClose,
  onSave,
}: {
  strategy: AllocationStrategy | null;
  onClose: () => void;
  onSave: (
    input: Partial<AllocationStrategy> &
      Pick<AllocationStrategy, "name" | "method" | "needsPct" | "wantsPct" | "savingsPct" | "investingShareOfSavingsPct" | "emergencyFundMonths">
  ) => void;
}) {
  const [name, setName] = useState(strategy?.name ?? "");
  const [method, setMethod] = useState<AllocationMethod>(strategy?.method ?? "custom");
  const [needsPct, setNeedsPct] = useState((strategy?.needsPct ?? 50).toString());
  const [wantsPct, setWantsPct] = useState((strategy?.wantsPct ?? 30).toString());
  const [savingsPct, setSavingsPct] = useState((strategy?.savingsPct ?? 20).toString());
  const [investingShare, setInvestingShare] = useState((strategy?.investingShareOfSavingsPct ?? 60).toString());
  const [emergencyMonths, setEmergencyMonths] = useState((strategy?.emergencyFundMonths ?? 3).toString());

  const sum = Number(needsPct) + Number(wantsPct) + Number(savingsPct);
  const valid = name.trim() && sum === 100;

  return (
    <Modal
      visible
      title={strategy ? "Edit strategy" : "New strategy"}
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" onPress={onClose} />
          <Button
            label="Save"
            variant="primary"
            disabled={!valid}
            onPress={() =>
              onSave({
                id: strategy?.id,
                name: name.trim(),
                method,
                needsPct: Number(needsPct),
                wantsPct: Number(wantsPct),
                savingsPct: Number(savingsPct),
                investingShareOfSavingsPct: Number(investingShare),
                emergencyFundMonths: Number(emergencyMonths),
                isDefault: strategy?.isDefault,
              })
            }
          />
        </>
      }
    >
      <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Aggressive Investor" />
      <SelectField label="Method" value={method} onChange={setMethod} options={Object.entries(METHOD_LABEL).map(([value, label]) => ({ value: value as AllocationMethod, label }))} />
      <TextField label="Needs %" value={needsPct} onChangeText={setNeedsPct} keyboardType="number-pad" />
      <TextField label="Wants %" value={wantsPct} onChangeText={setWantsPct} keyboardType="number-pad" />
      <TextField label="Savings + Investing %" value={savingsPct} onChangeText={setSavingsPct} keyboardType="number-pad" />
      <TextField label="Share routed to investing" value={investingShare} onChangeText={setInvestingShare} keyboardType="number-pad" />
      <TextField label="Emergency fund target (months)" value={emergencyMonths} onChangeText={setEmergencyMonths} keyboardType="number-pad" />
      {sum !== 100 && <Text style={{ fontSize: 12, color: colors.statusCritical }}>Needs + Wants + Savings must total 100% (currently {sum}%).</Text>}
    </Modal>
  );
}
