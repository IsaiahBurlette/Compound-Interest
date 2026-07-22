import { PALETTE, type Category, type CategoryKind } from "@compound-interest/core";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Modal } from "./Modal";

export const CATEGORY_KIND_LABEL: Record<CategoryKind, string> = {
  essential: "Essential (need)",
  discretionary: "Discretionary (want)",
  savings: "Savings",
  investing: "Investing",
};

const COLOR_OPTIONS = Object.values(PALETTE);

/** Create/edit form for a category. Shared by Settings and the Budgets line editor so category
 * management works the same wherever you run into it — no separate trip to Settings required. */
export function CategoryModal({
  category,
  onClose,
  onSave,
  onDelete,
}: {
  category: Category | null;
  onClose: () => void;
  onSave: (input: Partial<Category> & { name: string; kind: CategoryKind; color: string }) => void;
  onDelete?: (category: Category) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [kind, setKind] = useState<CategoryKind>(category?.kind ?? "essential");
  const [color, setColor] = useState(category?.color ?? COLOR_OPTIONS[0]);

  return (
    <Modal
      title={category ? "Edit category" : "New category"}
      onClose={onClose}
      footer={
        <>
          {category && onDelete && (
            <button className="btn btn-danger" style={{ marginRight: "auto" }} onClick={() => onDelete(category)}>
              <Trash2 size={14} /> Delete
            </button>
          )}
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!name.trim()}
            onClick={() => onSave({ id: category?.id, name: name.trim(), kind, color, icon: category?.icon, archived: category?.archived })}
          >
            Save
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Subscriptions" autoFocus />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Kind</label>
          <select value={kind} onChange={(e) => setKind(e.target.value as CategoryKind)}>
            {Object.entries(CATEGORY_KIND_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
            Used to recommend how much this category gets when you auto-fill a budget from a strategy.
          </span>
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Color</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={c}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: c,
                  border: color === c ? "2px solid var(--text-primary)" : "2px solid transparent",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
