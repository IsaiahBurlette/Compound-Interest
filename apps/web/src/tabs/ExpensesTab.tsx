import {
  getMonthRange,
  getWeekRange,
  getYearRange,
  isWithin,
  todayISO,
  type Category,
  type Transaction,
} from "@compound-interest/core";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { useData } from "../db/DataContext";
import { categoryIcon } from "../utils/categoryIcons";
import { formatDateLong, formatMoney } from "../utils/format";

type Scope = "all" | "week" | "month" | "year";

export function ExpensesTab() {
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Track every dollar spent, categorized as you go.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setTxModal("new")} disabled={activeCategories.length === 0}>
          <Plus size={15} /> Log expense
        </button>
      </div>

      <div className="flex-between section">
        <div className="segmented">
          <button className={scope === "all" ? "active" : ""} onClick={() => setScope("all")}>
            All
          </button>
          <button className={scope === "week" ? "active" : ""} onClick={() => setScope("week")}>
            Week
          </button>
          <button className={scope === "month" ? "active" : ""} onClick={() => setScope("month")}>
            Month
          </button>
          <button className={scope === "year" ? "active" : ""} onClick={() => setScope("year")}>
            Year
          </button>
        </div>
        <div className="muted tabular" style={{ fontSize: 13 }}>
          {sorted.length} transaction{sorted.length === 1 ? "" : "s"} · {formatMoney(total, currency)}
        </div>
      </div>

      <div className="card" style={{ padding: sorted.length ? 0 : undefined }}>
        {sorted.length === 0 ? (
          <div className="empty-state">
            {activeCategories.length === 0
              ? "Add a category in Settings before logging expenses."
              : "No expenses logged for this period."}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Note</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => {
                const cat = categoryById.get(t.categoryId);
                const Icon = categoryIcon(cat?.icon);
                return (
                  <tr key={t.id}>
                    <td>{formatDateLong(t.date)}</td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                        <Icon size={14} style={{ color: cat?.color }} />
                        {cat?.name ?? "Uncategorized"}
                      </span>
                    </td>
                    <td className="muted">{t.note || "—"}</td>
                    <td className="tabular" style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatMoney(t.amount, currency)}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => setTxModal(t)}>
                          Edit
                        </button>
                        <button className="icon-btn btn-danger" onClick={() => removeTransaction(t.id)} aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

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
    </div>
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
  const valid = categoryId && date && amount !== "" && amountNum > 0;

  return (
    <Modal
      title={tx ? "Edit expense" : "Log expense"}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!valid}
            onClick={() => onSave({ id: tx?.id, categoryId, date, amount: amountNum, note: note.trim() || undefined })}
          >
            Save
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Amount</label>
          <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" autoFocus />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Weekly grocery run" />
        </div>
      </div>
    </Modal>
  );
}
