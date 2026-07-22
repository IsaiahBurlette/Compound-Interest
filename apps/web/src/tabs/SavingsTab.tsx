import { recommendAllocation, type AllocationMethod, type AllocationStrategy } from "@compound-interest/core";
import { Plus, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { useData } from "../db/DataContext";
import { formatMoney } from "../utils/format";

const METHOD_LABEL: Record<AllocationMethod, string> = {
  "needs-wants-savings": "Needs / Wants / Savings",
  "pay-yourself-first": "Pay Yourself First",
  custom: "Custom",
};

export function SavingsTab() {
  const { allocationStrategies, settings, saveAllocationStrategy, saveSettings } = useData();
  const [strategyModal, setStrategyModal] = useState<AllocationStrategy | null | "new">(null);
  const [calcStrategyId, setCalcStrategyId] = useState(settings?.defaultAllocationStrategyId ?? allocationStrategies[0]?.id ?? "");
  const [income, setIncome] = useState("");
  const [essentialExpenses, setEssentialExpenses] = useState("");
  const currency = settings?.currency ?? "USD";

  const strategy = allocationStrategies.find((s) => s.id === calcStrategyId) ?? allocationStrategies[0];
  const rec = useMemo(() => {
    const incomeNum = Number(income);
    if (!strategy || !incomeNum || incomeNum <= 0) return null;
    return recommendAllocation({
      income: incomeNum,
      strategy,
      essentialExpenses: essentialExpenses ? Number(essentialExpenses) : undefined,
      currentEmergencyFundBalance: settings?.emergencyFundBalance,
    });
  }, [income, essentialExpenses, strategy, settings?.emergencyFundBalance]);

  const emergencyProgress =
    rec && rec.emergencyFundTarget > 0
      ? Math.min(100, (((settings?.emergencyFundBalance ?? 0)) / rec.emergencyFundTarget) * 100)
      : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Savings &amp; Investing</h1>
          <p className="page-subtitle">Recommended splits based on your strategy — fill your emergency fund first, then invest.</p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Recommendation calculator</div>
          <div className="card-subtitle" style={{ marginBottom: 14 }}>
            See how a paycheck should split across needs, wants, and savings/investing.
          </div>

          <div className="form-grid" style={{ marginBottom: 14 }}>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Strategy</label>
              <select value={calcStrategyId} onChange={(e) => setCalcStrategyId(e.target.value)}>
                {allocationStrategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.needsPct}/{s.wantsPct}/{s.savingsPct})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Income this period</label>
              <input type="number" min="0" step="0.01" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="0.00" />
            </div>
            <div className="field">
              <label>Essential expenses (optional)</label>
              <input type="number" min="0" step="0.01" value={essentialExpenses} onChange={(e) => setEssentialExpenses(e.target.value)} placeholder="0.00" />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Current emergency fund balance</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings?.emergencyFundBalance ?? ""}
                onChange={(e) => settings && saveSettings({ ...settings, emergencyFundBalance: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0.00"
              />
            </div>
          </div>

          {!rec ? (
            <div className="empty-state">Enter an income amount to see your recommended split.</div>
          ) : (
            <div>
              <AllocationBar rec={rec} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                <SplitRow color="var(--series-1)" label="Needs" amount={rec.needs} currency={currency} />
                <SplitRow color="var(--series-2)" label="Wants" amount={rec.wants} currency={currency} />
                <SplitRow color="var(--series-3)" label="Emergency savings" amount={rec.savingsToEmergency} currency={currency} />
                <SplitRow color="var(--series-7)" label="Investing" amount={rec.savingsToInvesting} currency={currency} />
              </div>

              {rec.overBudgetWarning && (
                <div className="pill" style={{ marginTop: 12, background: "color-mix(in srgb, var(--status-critical) 16%, transparent)", color: "var(--status-critical)" }}>
                  Essential expenses exceed the recommended needs amount
                </div>
              )}

              <div style={{ marginTop: 18 }}>
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>Emergency fund progress</span>
                  <span className="muted tabular" style={{ fontSize: 12 }}>
                    {formatMoney(settings?.emergencyFundBalance ?? 0, currency)} / {formatMoney(rec.emergencyFundTarget, currency)}
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${emergencyProgress}%`, background: "var(--series-3)" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex-between" style={{ marginBottom: 4 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              Allocation strategies
            </div>
            <button className="btn btn-sm" onClick={() => setStrategyModal("new")}>
              <Plus size={13} /> New
            </button>
          </div>
          <div className="card-subtitle" style={{ marginBottom: 14 }}>
            Reusable rules for splitting income — pick one when auto-filling a budget.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {allocationStrategies.map((s) => (
              <div key={s.id} className="stat-tile" style={{ padding: "12px 14px" }}>
                <div className="flex-between">
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5 }}>{s.name}</span>
                    {settings?.defaultAllocationStrategyId === s.id && (
                      <span className="pill" style={{ fontSize: 10.5 }}>
                        Default
                      </span>
                    )}
                  </div>
                  <div className="row-actions">
                    <button
                      className="icon-btn"
                      title="Set as default"
                      onClick={() => settings && saveSettings({ ...settings, defaultAllocationStrategyId: s.id })}
                    >
                      <Star size={14} fill={settings?.defaultAllocationStrategyId === s.id ? "currentColor" : "none"} />
                    </button>
                    <button className="btn btn-sm" onClick={() => setStrategyModal(s)}>
                      Edit
                    </button>
                  </div>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {METHOD_LABEL[s.method]} · {s.needsPct}/{s.wantsPct}/{s.savingsPct} · {s.emergencyFundMonths}mo emergency fund
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
    </div>
  );
}

function AllocationBar({ rec }: { rec: ReturnType<typeof recommendAllocation> }) {
  const total = rec.needs + rec.wants + rec.savingsToEmergency + rec.savingsToInvesting || 1;
  const seg = (n: number) => `${(n / total) * 100}%`;
  return (
    <div style={{ display: "flex", height: 14, borderRadius: 999, overflow: "hidden" }}>
      <div style={{ width: seg(rec.needs), background: "var(--series-1)" }} />
      <div style={{ width: seg(rec.wants), background: "var(--series-2)" }} />
      <div style={{ width: seg(rec.savingsToEmergency), background: "var(--series-3)" }} />
      <div style={{ width: seg(rec.savingsToInvesting), background: "var(--series-7)" }} />
    </div>
  );
}

function SplitRow({ color, label, amount, currency }: { color: string; label: string; amount: number; currency: string }) {
  return (
    <div className="flex-between">
      <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
        <span className="dot" style={{ background: color }} />
        {label}
      </span>
      <span className="tabular" style={{ fontWeight: 600, fontSize: 13.5 }}>
        {formatMoney(amount, currency)}
      </span>
    </div>
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
  const [needsPct, setNeedsPct] = useState(strategy?.needsPct ?? 50);
  const [wantsPct, setWantsPct] = useState(strategy?.wantsPct ?? 30);
  const [savingsPct, setSavingsPct] = useState(strategy?.savingsPct ?? 20);
  const [investingShare, setInvestingShare] = useState(strategy?.investingShareOfSavingsPct ?? 60);
  const [emergencyMonths, setEmergencyMonths] = useState(strategy?.emergencyFundMonths ?? 3);

  const sum = needsPct + wantsPct + savingsPct;
  const valid = name.trim() && sum === 100;

  return (
    <Modal
      title={strategy ? "Edit strategy" : "New allocation strategy"}
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
                id: strategy?.id,
                name: name.trim(),
                method,
                needsPct,
                wantsPct,
                savingsPct,
                investingShareOfSavingsPct: investingShare,
                emergencyFundMonths: emergencyMonths,
                isDefault: strategy?.isDefault,
              })
            }
          >
            Save
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aggressive Investor" autoFocus />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value as AllocationMethod)}>
            {Object.entries(METHOD_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Needs %</label>
          <input type="number" min="0" max="100" value={needsPct} onChange={(e) => setNeedsPct(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>Wants %</label>
          <input type="number" min="0" max="100" value={wantsPct} onChange={(e) => setWantsPct(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>Savings + Investing %</label>
          <input type="number" min="0" max="100" value={savingsPct} onChange={(e) => setSavingsPct(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>Share of that routed to investing</label>
          <input type="number" min="0" max="100" value={investingShare} onChange={(e) => setInvestingShare(Number(e.target.value))} />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Emergency fund target (months of essential expenses)</label>
          <input type="number" min="0" max="24" value={emergencyMonths} onChange={(e) => setEmergencyMonths(Number(e.target.value))} />
        </div>
      </div>
      {sum !== 100 && (
        <div className="muted" style={{ fontSize: 12.5, marginTop: 10, color: "var(--status-critical)" }}>
          Needs + Wants + Savings must add up to 100% (currently {sum}%).
        </div>
      )}
    </Modal>
  );
}
