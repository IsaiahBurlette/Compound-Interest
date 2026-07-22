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
import { ChevronDown, ChevronUp, Plus, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { useData } from "../db/DataContext";
import { formatDateLong, formatMoney, formatPct } from "../utils/format";

type Status = "current" | "upcoming" | "past";

function statusOf(budget: BudgetPeriod, today: string): Status {
  if (today < budget.startDate) return "upcoming";
  if (today > budget.endDate) return "past";
  return "current";
}

export function BudgetsTab() {
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

  const handleDelete = (budget: BudgetPeriod) => {
    if (confirm(`Delete this ${budget.type} budget? This can't be undone.`)) removeBudgetPeriod(budget.id);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">Plan by month or by week — and set budgets months ahead of time.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setPlanAheadOpen(true)}>
            <Sparkles size={15} /> Plan ahead
          </button>
          <button className="btn btn-primary" onClick={() => setEditModal("new")}>
            <Plus size={15} /> New budget
          </button>
        </div>
      </div>

      <div className="segmented section">
        <button className={typeFilter === "monthly" ? "active" : ""} onClick={() => setTypeFilter("monthly")}>
          Monthly
        </button>
        <button className={typeFilter === "weekly" ? "active" : ""} onClick={() => setTypeFilter("weekly")}>
          Weekly
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            No {typeFilter} budgets yet. Create one, or use "Plan ahead" to set up several at once.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((budget) => {
            const status = statusOf(budget, today);
            const actuals = budgetActuals(budget, incomeEntries, transactions);
            const isOpen = expanded.has(budget.id);
            const overallPct = actuals.plannedExpenses > 0 ? (actuals.actualExpenses / actuals.plannedExpenses) * 100 : 0;
            return (
              <div className="card" key={budget.id}>
                <div className="flex-between" style={{ cursor: "pointer" }} onClick={() => toggle(budget.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={`pill status-${status}`}>
                      {status === "current" ? "Current" : status === "upcoming" ? "Upcoming" : "Past"}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{formatPeriodLabel({ start: budget.startDate, end: budget.endDate }, budget.type)}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {formatMoney(actuals.plannedIncome, currency)} planned income · {formatMoney(actuals.plannedExpenses, currency)} planned spend
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {status !== "upcoming" && (
                      <div style={{ textAlign: "right" }}>
                        <div className="tabular" style={{ fontWeight: 700, fontSize: 14 }}>
                          {formatMoney(actuals.actualExpenses, currency)}{" "}
                          <span className="muted" style={{ fontWeight: 500 }}>spent</span>
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>{formatPct(overallPct)} of plan</div>
                      </div>
                    )}
                    {isOpen ? <ChevronUp size={16} className="muted" /> : <ChevronDown size={16} className="muted" />}
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 16, borderTop: "1px solid var(--gridline)", paddingTop: 14 }}>
                    {actuals.lines.length === 0 ? (
                      <div className="empty-state" style={{ padding: "12px 0" }}>
                        No line items yet — edit this budget to add categories.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {actuals.lines.map((line) => {
                          const cat = categories.find((c) => c.id === line.categoryId);
                          const over = line.actualAmount > line.plannedAmount;
                          return (
                            <div key={line.categoryId}>
                              <div className="flex-between" style={{ marginBottom: 5 }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 600 }}>
                                  <span className="dot" style={{ background: cat?.color ?? "var(--text-muted)" }} />
                                  {cat?.name ?? "Unknown category"}
                                </span>
                                <span className="tabular" style={{ fontSize: 12.5 }}>
                                  <span style={{ fontWeight: 600, color: over ? "var(--status-critical)" : "var(--text-primary)" }}>
                                    {formatMoney(line.actualAmount, currency)}
                                  </span>
                                  <span className="muted"> / {formatMoney(line.plannedAmount, currency)}</span>
                                </span>
                              </div>
                              <div className="progress-track">
                                <div
                                  className="progress-fill"
                                  style={{
                                    width: `${Math.min(100, line.pctUsed)}%`,
                                    background: over ? "var(--status-critical)" : "var(--series-1)",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="row-actions" style={{ marginTop: 16 }}>
                      <button className="btn btn-sm" onClick={() => setEditModal(budget)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(budget)}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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

      <style>{`
        .pill.status-current { background: color-mix(in srgb, var(--status-good) 18%, transparent); color: var(--success-text); }
        .pill.status-upcoming { background: var(--surface-sunken); color: var(--text-secondary); }
        .pill.status-past { background: var(--surface-sunken); color: var(--text-muted); }
      `}</style>
    </div>
  );
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
  const { categories, allocationStrategies, settings } = useData();
  const [type, setType] = useState<PeriodType>(budget?.type ?? defaultType);
  const [anchorDate, setAnchorDate] = useState(budget?.startDate ?? todayISO());
  const [plannedIncome, setPlannedIncome] = useState(budget?.plannedIncome?.toString() ?? "");
  const [lines, setLines] = useState<BudgetLine[]>(budget?.lines ?? []);
  const [strategyId, setStrategyId] = useState(budget?.allocationStrategyId ?? settings?.defaultAllocationStrategyId ?? allocationStrategies[0]?.id ?? "");
  const [notes, setNotes] = useState(budget?.notes ?? "");

  const weekStartsOn = settings?.weekStartsOn ?? 1;
  const range = periodRange(anchorDate, type, weekStartsOn);
  const activeCategories = categories.filter((c) => !c.archived);
  const usedCategoryIds = new Set(lines.map((l) => l.categoryId));
  const availableToAdd = activeCategories.filter((c) => !usedCategoryIds.has(c.id));
  const plannedTotal = lines.reduce((s, l) => s + l.plannedAmount, 0);

  const updateLine = (idx: number, patch: Partial<BudgetLine>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));
  const addLine = () => {
    if (availableToAdd.length === 0) return;
    setLines((prev) => [...prev, { categoryId: availableToAdd[0].id, plannedAmount: 0 }]);
  };

  const autoFillFromStrategy = () => {
    const income = Number(plannedIncome);
    const strategy = allocationStrategies.find((s) => s.id === strategyId);
    if (!income || income <= 0 || !strategy) return;
    const rec = recommendAllocation({ income, strategy, currentEmergencyFundBalance: settings?.emergencyFundBalance });
    setLines(distributeAllocationToCategories(rec, categories));
  };

  const valid = plannedIncome !== "" && Number(plannedIncome) >= 0 && lines.every((l) => l.plannedAmount >= 0);

  return (
    <Modal
      title={budget ? "Edit budget" : "New budget"}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!valid}
            onClick={() =>
              onSave({
                id: budget?.id,
                type,
                startDate: range.start,
                endDate: range.end,
                plannedIncome: Number(plannedIncome),
                lines,
                allocationStrategyId: strategyId || undefined,
                notes: notes.trim() || undefined,
              })
            }
          >
            Save budget
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field">
          <label>Period type</label>
          <select value={type} onChange={(e) => setType(e.target.value as PeriodType)}>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div className="field">
          <label>Any date in the period</label>
          <input type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <div className="muted" style={{ fontSize: 12.5 }}>
            Period: <strong style={{ color: "var(--text-primary)" }}>{formatDateLong(range.start)} – {formatDateLong(range.end)}</strong>
          </div>
        </div>
        <div className="field">
          <label>Planned income</label>
          <input type="number" min="0" step="0.01" value={plannedIncome} onChange={(e) => setPlannedIncome(e.target.value)} placeholder="0.00" />
        </div>
        <div className="field">
          <label>Allocation strategy</label>
          <select value={strategyId} onChange={(e) => setStrategyId(e.target.value)}>
            {allocationStrategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="section" style={{ marginTop: 16 }}>
        <div className="flex-between" style={{ marginBottom: 10 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            Budget lines
          </div>
          <button className="btn btn-sm" onClick={autoFillFromStrategy} disabled={!plannedIncome || Number(plannedIncome) <= 0}>
            <Sparkles size={13} /> Auto-fill from strategy
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="empty-state" style={{ padding: "16px 0" }}>
            No lines yet. Add categories manually or auto-fill from your allocation strategy above.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lines.map((line, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  value={line.categoryId}
                  onChange={(e) => updateLine(idx, { categoryId: e.target.value })}
                  style={{ flex: 1, border: "1px solid var(--border-strong)", borderRadius: 6, padding: "7px 8px", background: "var(--surface-2)" }}
                >
                  {activeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.plannedAmount}
                  onChange={(e) => updateLine(idx, { plannedAmount: Number(e.target.value) })}
                  style={{ width: 110, border: "1px solid var(--border-strong)", borderRadius: 6, padding: "7px 8px", background: "var(--surface-2)" }}
                />
                <button className="icon-btn btn-danger" onClick={() => removeLine(idx)} aria-label="Remove line">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex-between" style={{ marginTop: 10 }}>
          <button className="btn btn-sm" onClick={addLine} disabled={availableToAdd.length === 0}>
            <Plus size={13} /> Add line
          </button>
          <div className="muted tabular" style={{ fontSize: 12.5 }}>
            Total planned: {formatMoney(plannedTotal, settings?.currency ?? "USD")}
          </div>
        </div>
      </div>

      <div className="field">
        <label>Notes (optional)</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to remember about this period" />
      </div>
    </Modal>
  );
}

function PlanAheadModal({ onClose }: { onClose: () => void }) {
  const { budgetPeriods, categories, allocationStrategies, settings, saveBudgetPeriod } = useData();
  const [type, setType] = useState<PeriodType>(settings?.defaultPeriodType ?? "monthly");
  const [count, setCount] = useState(3);
  const [plannedIncome, setPlannedIncome] = useState("");
  const [strategyId, setStrategyId] = useState(settings?.defaultAllocationStrategyId ?? allocationStrategies[0]?.id ?? "");
  const [useStrategy, setUseStrategy] = useState(true);
  const [saving, setSaving] = useState(false);
  const weekStartsOn = settings?.weekStartsOn ?? 1;

  const existingOfType = budgetPeriods.filter((b) => b.type === type);
  const latestStart = existingOfType.length > 0 ? existingOfType.map((b) => b.startDate).sort().at(-1)! : undefined;
  const fromDate = latestStart ? shiftFromLatest(latestStart, type) : todayISO();
  const upcoming = useMemo(() => generateUpcomingPeriodStarts(fromDate, type, count, weekStartsOn), [fromDate, type, count, weekStartsOn]);
  const existingStarts = new Set(existingOfType.map((b) => b.startDate));
  const toCreate = upcoming.filter((s) => !existingStarts.has(s));

  const strategy = allocationStrategies.find((s) => s.id === strategyId);
  const income = Number(plannedIncome) || 0;

  const handleCreate = async () => {
    setSaving(true);
    for (const start of toCreate) {
      const range = periodRange(start, type, weekStartsOn);
      let lines: BudgetLine[] = [];
      if (useStrategy && strategy && income > 0) {
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
        allocationStrategyId: useStrategy ? strategyId : undefined,
        updatedAt: nowISO(),
      });
    }
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      title="Plan budgets ahead"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={toCreate.length === 0 || saving} onClick={handleCreate}>
            {saving ? "Creating…" : `Create ${toCreate.length} budget${toCreate.length === 1 ? "" : "s"}`}
          </button>
        </>
      }
    >
      <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
        Generate several {type} budgets in a row, starting right after your most recent one — handy for setting up a
        quarter or a semester at once.
      </p>
      <div className="form-grid">
        <div className="field">
          <label>Period type</label>
          <select value={type} onChange={(e) => setType(e.target.value as PeriodType)}>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div className="field">
          <label>How many periods</label>
          <input type="number" min={1} max={24} value={count} onChange={(e) => setCount(Math.max(1, Math.min(24, Number(e.target.value))))} />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Planned income per period</label>
          <input type="number" min="0" step="0.01" value={plannedIncome} onChange={(e) => setPlannedIncome(e.target.value)} placeholder="0.00" />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={useStrategy} onChange={(e) => setUseStrategy(e.target.checked)} style={{ width: "auto" }} />
            Auto-fill each budget from an allocation strategy
          </label>
        </div>
        {useStrategy && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Strategy</label>
            <select value={strategyId} onChange={(e) => setStrategyId(e.target.value)}>
              {allocationStrategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
        {toCreate.length === 0
          ? "All of those periods already exist."
          : `Will create: ${toCreate.map((s) => formatDateLong(s)).join(", ")}`}
      </div>
    </Modal>
  );
}

function shiftFromLatest(latestStart: string, type: PeriodType): string {
  return type === "weekly" ? addDays(latestStart, 7) : addMonths(latestStart, 1);
}
