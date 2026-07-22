import {
  addDays,
  addMonths,
  budgetActuals,
  createId,
  distributeAllocationToCategories,
  formatPeriodLabel,
  generateUpcomingPeriodStarts,
  nowISO,
  periodRange,
  recommendAllocation,
  todayISO,
  type BudgetLine,
  type BudgetPeriod,
  type PeriodType,
} from "@compound-interest/core";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { Button } from "../components/Button";
import { DateField } from "../components/DateField";
import { SelectField, TextField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { Segmented } from "../components/Segmented";
import { useData } from "../db/DataContext";
import { useTheme } from "../ThemeContext";
import type { ThemeColors } from "../theme";
import { formatDateLong, formatMoney, formatPct } from "../utils/format";

type Status = "current" | "upcoming" | "past";

function statusOf(budget: BudgetPeriod, today: string): Status {
  if (today < budget.startDate) return "upcoming";
  if (today > budget.endDate) return "past";
  return "current";
}

export function BudgetsScreen() {
  const { colors, shared } = useTheme();
  const { budgetPeriods, incomeEntries, transactions, categories, settings, saveBudgetPeriod, removeBudgetPeriod } = useData();
  const [typeFilter, setTypeFilter] = useState<PeriodType>(settings?.defaultPeriodType ?? "monthly");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editModal, setEditModal] = useState<BudgetPeriod | "new" | null>(null);
  const [planAheadOpen, setPlanAheadOpen] = useState(false);
  const currency = settings?.currency ?? "USD";
  const today = todayISO();

  const filtered = budgetPeriods.filter((b) => b.type === typeFilter).sort((a, b) => a.startDate.localeCompare(b.startDate));

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <Screen>
      <View style={shared.header}>
        <Text style={shared.title}>Budgets</Text>
        <Text style={shared.subtitle}>Plan by month or by week — set budgets months ahead of time.</Text>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button label="Plan ahead" onPress={() => setPlanAheadOpen(true)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="New budget" variant="primary" onPress={() => setEditModal("new")} />
        </View>
      </View>

      <Segmented
        value={typeFilter}
        onChange={setTypeFilter}
        options={[
          { value: "monthly", label: "Monthly" },
          { value: "weekly", label: "Weekly" },
        ]}
      />

      {filtered.length === 0 ? (
        <View style={shared.card}>
          <View style={shared.emptyState}>
            <Text style={shared.emptyStateText}>No {typeFilter} budgets yet. Create one, or plan several ahead at once.</Text>
          </View>
        </View>
      ) : (
        filtered.map((budget) => {
          const status = statusOf(budget, today);
          const actuals = budgetActuals(budget, incomeEntries, transactions);
          const isOpen = expanded.has(budget.id);
          const overallPct = actuals.plannedExpenses > 0 ? (actuals.actualExpenses / actuals.plannedExpenses) * 100 : 0;
          return (
            <View key={budget.id} style={shared.card}>
              <Pressable onPress={() => toggle(budget.id)} style={shared.row}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 }}>
                  <View style={[shared.pill, statusPillStyle(status)]}>
                    <Text style={[shared.pillText, statusTextStyle(status, colors)]}>{status === "current" ? "Current" : status === "upcoming" ? "Upcoming" : "Past"}</Text>
                  </View>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>
                      {formatPeriodLabel({ start: budget.startDate, end: budget.endDate }, budget.type)}
                    </Text>
                    <Text style={{ fontSize: 11.5, color: colors.textMuted }}>
                      {formatMoney(actuals.plannedIncome, currency)} income · {formatMoney(actuals.plannedExpenses, currency)} planned
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {status !== "upcoming" && (
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>{formatMoney(actuals.actualExpenses, currency)}</Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>{formatPct(overallPct)} of plan</Text>
                    </View>
                  )}
                  <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
                </View>
              </Pressable>

              {isOpen && (
                <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.gridline, gap: 12 }}>
                  {actuals.lines.length === 0 ? (
                    <Text style={shared.emptyStateText}>No line items yet — edit this budget to add categories.</Text>
                  ) : (
                    actuals.lines.map((line) => {
                      const cat = categories.find((c) => c.id === line.categoryId);
                      const over = line.actualAmount > line.plannedAmount;
                      return (
                        <View key={line.categoryId}>
                          <View style={[shared.row, { marginBottom: 5 }]}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                              <View style={[shared.dot, { backgroundColor: cat?.color ?? colors.textMuted }]} />
                              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>{cat?.name ?? "Unknown"}</Text>
                            </View>
                            <Text style={{ fontSize: 12 }}>
                              <Text style={{ fontWeight: "700", color: over ? colors.statusCritical : colors.textPrimary }}>{formatMoney(line.actualAmount, currency)}</Text>
                              <Text style={{ color: colors.textMuted }}> / {formatMoney(line.plannedAmount, currency)}</Text>
                            </Text>
                          </View>
                          <View style={shared.progressTrack}>
                            <View style={[shared.progressFill, { width: `${Math.min(100, line.pctUsed)}%`, backgroundColor: over ? colors.statusCritical : colors.series1 }]} />
                          </View>
                        </View>
                      );
                    })
                  )}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Button label="Edit" onPress={() => setEditModal(budget)} />
                    <Button label="Delete" variant="danger" onPress={() => removeBudgetPeriod(budget.id)} />
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}

      {editModal && (
        <BudgetFormModal
          budget={editModal === "new" ? null : editModal}
          defaultType={typeFilter}
          onClose={() => setEditModal(null)}
          onSave={async (input) => {
            await saveBudgetPeriod(input);
            setEditModal(null);
          }}
        />
      )}

      {planAheadOpen && <PlanAheadModal onClose={() => setPlanAheadOpen(false)} />}
    </Screen>
  );
}

function statusPillStyle(status: Status) {
  if (status === "current") return { backgroundColor: "#0ca30c26" };
  return {};
}
function statusTextStyle(status: Status, colors: ThemeColors) {
  if (status === "current") return { color: colors.successText };
  return {};
}

function BudgetFormModal({
  budget,
  defaultType,
  onClose,
  onSave,
}: {
  budget: BudgetPeriod | null;
  defaultType: PeriodType;
  onClose: () => void;
  onSave: (input: Partial<BudgetPeriod> & Pick<BudgetPeriod, "type" | "startDate" | "endDate" | "plannedIncome" | "lines">) => void;
}) {
  const { colors, shared } = useTheme();
  const { categories, allocationStrategies, settings } = useData();
  const [type, setType] = useState<PeriodType>(budget?.type ?? defaultType);
  const [anchorDate, setAnchorDate] = useState(budget?.startDate ?? todayISO());
  const [plannedIncome, setPlannedIncome] = useState(budget?.plannedIncome?.toString() ?? "");
  const [lines, setLines] = useState<BudgetLine[]>(budget?.lines ?? []);
  const [strategyId, setStrategyId] = useState(budget?.allocationStrategyId ?? settings?.defaultAllocationStrategyId ?? allocationStrategies[0]?.id ?? "");

  const weekStartsOn = settings?.weekStartsOn ?? 1;
  const range = periodRange(anchorDate, type, weekStartsOn);
  const activeCategories = categories.filter((c) => !c.archived);
  const plannedTotal = lines.reduce((s, l) => s + l.plannedAmount, 0);

  const autoFillFromStrategy = () => {
    const income = Number(plannedIncome);
    const strategy = allocationStrategies.find((s) => s.id === strategyId);
    if (!income || income <= 0 || !strategy) return;
    const rec = recommendAllocation({ income, strategy, currentEmergencyFundBalance: settings?.emergencyFundBalance });
    setLines(distributeAllocationToCategories(rec, categories));
  };

  const valid = plannedIncome !== "" && Number(plannedIncome) >= 0;

  return (
    <Modal
      visible
      title={budget ? "Edit budget" : "New budget"}
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" onPress={onClose} />
          <Button
            label="Save budget"
            variant="primary"
            disabled={!valid}
            onPress={() =>
              onSave({
                id: budget?.id,
                type,
                startDate: range.start,
                endDate: range.end,
                plannedIncome: Number(plannedIncome),
                lines,
                allocationStrategyId: strategyId || undefined,
              })
            }
          />
        </>
      }
    >
      <SelectField
        label="Period type"
        value={type}
        onChange={setType}
        options={[
          { value: "monthly", label: "Monthly" },
          { value: "weekly", label: "Weekly" },
        ]}
      />
      <DateField label="Any date in the period" value={anchorDate} onChange={setAnchorDate} />
      <Text style={{ fontSize: 12.5, color: colors.textMuted }}>
        Period: {formatDateLong(range.start)} – {formatDateLong(range.end)}
      </Text>
      <TextField label="Planned income" value={plannedIncome} onChangeText={setPlannedIncome} placeholder="0.00" keyboardType="decimal-pad" />
      <SelectField label="Allocation strategy" value={strategyId} onChange={setStrategyId} options={allocationStrategies.map((s) => ({ value: s.id, label: s.name }))} />
      <Button label="Auto-fill from strategy" onPress={autoFillFromStrategy} disabled={!plannedIncome || Number(plannedIncome) <= 0} />

      <View style={{ gap: 8 }}>
        <Text style={shared.sectionTitle}>Budget lines</Text>
        {lines.length === 0 ? (
          <Text style={shared.emptyStateText}>No lines yet. Auto-fill from your strategy above.</Text>
        ) : (
          lines.map((line, idx) => {
            const cat = activeCategories.find((c) => c.id === line.categoryId);
            return (
              <View key={idx} style={shared.listRow}>
                <Text style={{ fontSize: 13, color: colors.textPrimary, flexShrink: 1 }}>{cat?.name ?? "Unknown"}</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>{formatMoney(line.plannedAmount, settings?.currency ?? "USD")}</Text>
              </View>
            );
          })
        )}
        <Text style={{ fontSize: 12.5, color: colors.textMuted }}>Total planned: {formatMoney(plannedTotal, settings?.currency ?? "USD")}</Text>
      </View>
    </Modal>
  );
}

function PlanAheadModal({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const { budgetPeriods, categories, allocationStrategies, settings, saveBudgetPeriod } = useData();
  const [type, setType] = useState<PeriodType>(settings?.defaultPeriodType ?? "monthly");
  const [count, setCount] = useState("3");
  const [plannedIncome, setPlannedIncome] = useState("");
  const [strategyId, setStrategyId] = useState(settings?.defaultAllocationStrategyId ?? allocationStrategies[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const weekStartsOn = settings?.weekStartsOn ?? 1;

  const countNum = Math.max(1, Math.min(24, Number(count) || 1));
  const existingOfType = budgetPeriods.filter((b) => b.type === type);
  const latestStart = existingOfType.length > 0 ? existingOfType.map((b) => b.startDate).sort().at(-1)! : undefined;
  const fromDate = latestStart ? shiftFromLatest(latestStart, type) : todayISO();
  const upcoming = useMemo(() => generateUpcomingPeriodStarts(fromDate, type, countNum, weekStartsOn), [fromDate, type, countNum, weekStartsOn]);
  const existingStarts = new Set(existingOfType.map((b) => b.startDate));
  const toCreate = upcoming.filter((s) => !existingStarts.has(s));
  const strategy = allocationStrategies.find((s) => s.id === strategyId);
  const income = Number(plannedIncome) || 0;

  const handleCreate = async () => {
    setSaving(true);
    for (const start of toCreate) {
      const range = periodRange(start, type, weekStartsOn);
      let lines: BudgetLine[] = [];
      if (strategy && income > 0) {
        const rec = recommendAllocation({ income, strategy, currentEmergencyFundBalance: settings?.emergencyFundBalance });
        lines = distributeAllocationToCategories(rec, categories);
      }
      await saveBudgetPeriod({
        id: createId(),
        type,
        startDate: range.start,
        endDate: range.end,
        plannedIncome: income,
        lines,
        allocationStrategyId: strategyId || undefined,
        updatedAt: nowISO(),
      });
    }
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      visible
      title="Plan budgets ahead"
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" onPress={onClose} />
          <Button label={saving ? "Creating…" : `Create ${toCreate.length}`} variant="primary" disabled={toCreate.length === 0 || saving} onPress={handleCreate} />
        </>
      }
    >
      <SelectField
        label="Period type"
        value={type}
        onChange={setType}
        options={[
          { value: "monthly", label: "Monthly" },
          { value: "weekly", label: "Weekly" },
        ]}
      />
      <TextField label="How many periods" value={count} onChangeText={setCount} keyboardType="number-pad" />
      <TextField label="Planned income per period" value={plannedIncome} onChangeText={setPlannedIncome} placeholder="0.00" keyboardType="decimal-pad" />
      <SelectField label="Strategy to auto-fill with" value={strategyId} onChange={setStrategyId} options={allocationStrategies.map((s) => ({ value: s.id, label: s.name }))} />
      <Text style={{ fontSize: 12, color: colors.textMuted }}>
        {toCreate.length === 0 ? "All of those periods already exist." : `Will create: ${toCreate.map((s) => formatDateLong(s)).join(", ")}`}
      </Text>
    </Modal>
  );
}

function shiftFromLatest(latestStart: string, type: PeriodType): string {
  return type === "weekly" ? addDays(latestStart, 7) : addMonths(latestStart, 1);
}
