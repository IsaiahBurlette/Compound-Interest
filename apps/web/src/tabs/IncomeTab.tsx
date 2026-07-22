import { todayISO, type IncomeEntry, type IncomeFrequency, type IncomeSource } from "@compound-interest/core";
import { Archive, ArchiveRestore, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { useData } from "../db/DataContext";
import { formatDateLong, formatMoney } from "../utils/format";

const FREQUENCIES: { value: IncomeFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "semimonthly", label: "Semimonthly" },
  { value: "monthly", label: "Monthly" },
  { value: "irregular", label: "Irregular / variable" },
];

export function IncomeTab() {
  const { incomeSources, incomeEntries, settings, saveIncomeSource, saveIncomeEntry, removeIncomeEntry } = useData();
  const currency = settings?.currency ?? "USD";
  const [sourceModal, setSourceModal] = useState<IncomeSource | null | "new">(null);
  const [entryModal, setEntryModal] = useState<IncomeEntry | null | "new">(null);

  const activeSources = incomeSources.filter((s) => !s.archived);
  const sourceById = useMemo(() => new Map(incomeSources.map((s) => [s.id, s])), [incomeSources]);

  const sortedEntries = [...incomeEntries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Income</h1>
          <p className="page-subtitle">Log actual income as it comes in — amounts can vary every time.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEntryModal("new")} disabled={activeSources.length === 0}>
          <Plus size={15} /> Log income
        </button>
      </div>

      <div className="section">
        <div className="flex-between" style={{ marginBottom: 10 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            Income sources
          </div>
          <button className="btn btn-sm" onClick={() => setSourceModal("new")}>
            <Plus size={14} /> Add source
          </button>
        </div>
        <div className="card">
          {incomeSources.length === 0 ? (
            <div className="empty-state">
              Add a source first — a job, a client, a side hustle — then you can log income against it.
            </div>
          ) : (
            incomeSources.map((s) => (
              <div className="list-row" key={s.id}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, opacity: s.archived ? 0.5 : 1 }}>{s.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {FREQUENCIES.find((f) => f.value === s.frequency)?.label}
                    {s.expectedAmount ? ` · typically ~${formatMoney(s.expectedAmount, currency)}` : ""}
                  </div>
                </div>
                <div className="row-actions">
                  <button className="btn btn-sm" onClick={() => setSourceModal(s)}>
                    Edit
                  </button>
                  <button
                    className="icon-btn"
                    title={s.archived ? "Unarchive" : "Archive"}
                    onClick={() => saveIncomeSource({ ...s, archived: !s.archived })}
                  >
                    {s.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-title">Income log</div>
        <div className="card" style={{ padding: sortedEntries.length ? 0 : undefined }}>
          {sortedEntries.length === 0 ? (
            <div className="empty-state">No income logged yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Note</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((e) => (
                  <tr key={e.id}>
                    <td>{formatDateLong(e.date)}</td>
                    <td>{sourceById.get(e.sourceId)?.name ?? "—"}</td>
                    <td className="muted">{e.note || "—"}</td>
                    <td className="tabular" style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatMoney(e.amount, currency)}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => setEntryModal(e)}>
                          Edit
                        </button>
                        <button className="icon-btn btn-danger" onClick={() => removeIncomeEntry(e.id)} aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
    </div>
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
      title={source ? "Edit income source" : "Add income source"}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!name.trim()}
            onClick={() =>
              onSave({
                id: source?.id,
                name: name.trim(),
                frequency,
                expectedAmount: expectedAmount ? Number(expectedAmount) : undefined,
                archived: source?.archived,
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
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Freelance design" autoFocus />
        </div>
        <div className="field">
          <label>Frequency</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as IncomeFrequency)}>
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Typical amount (optional)</label>
          <input type="number" min="0" step="0.01" value={expectedAmount} onChange={(e) => setExpectedAmount(e.target.value)} placeholder="0.00" />
        </div>
      </div>
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
  const valid = sourceId && date && amount !== "" && amountNum > 0;

  return (
    <Modal
      title={entry ? "Edit income" : "Log income"}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!valid}
            onClick={() => onSave({ id: entry?.id, sourceId, date, amount: amountNum, note: note.trim() || undefined })}
          >
            Save
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Source</label>
          <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
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
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Invoice #114" />
        </div>
      </div>
    </Modal>
  );
}
