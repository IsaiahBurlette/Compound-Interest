import type { Category, PeriodType } from "@compound-interest/core";
import { Archive, ArchiveRestore, Download, Plus, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { CATEGORY_KIND_LABEL, CategoryModal } from "../components/CategoryModal";
import { useData } from "../db/DataContext";
import { categoryIcon } from "../utils/categoryIcons";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];

export function SettingsTab() {
  const { settings, allocationStrategies, categories, transactions, budgetPeriods, saveSettings, saveCategory, archiveCategory, removeCategory, exportData, importData, resetAllData } =
    useData();
  const [categoryModal, setCategoryModal] = useState<Category | null | "new">(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!settings) return null;

  const handleDeleteCategory = (category: Category) => {
    const txCount = transactions.filter((t) => t.categoryId === category.id && !t.deletedAt).length;
    const lineCount = budgetPeriods.reduce((n, b) => n + b.lines.filter((l) => l.categoryId === category.id).length, 0);
    const parts = [];
    if (txCount > 0) parts.push(`${txCount} transaction${txCount === 1 ? "" : "s"}`);
    if (lineCount > 0) parts.push(`${lineCount} budget line${lineCount === 1 ? "" : "s"}`);
    const warning =
      parts.length > 0
        ? `Delete "${category.name}"? It's used by ${parts.join(" and ")} — those will show as "Uncategorized" instead of being deleted.`
        : `Delete "${category.name}"? This can't be undone.`;
    if (confirm(warning)) {
      removeCategory(category.id);
      setCategoryModal(null);
    }
  };

  const handleExport = async () => {
    const bundle = await exportData();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compound-interest-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const bundle = JSON.parse(text);
    await importData(bundle);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Preferences, categories, and your data.</p>
        </div>
      </div>

      <div className="section card">
        <div className="card-title">Preferences</div>
        <div className="form-grid" style={{ marginTop: 12 }}>
          <div className="field">
            <label>Currency</label>
            <select value={settings.currency} onChange={(e) => saveSettings({ ...settings, currency: e.target.value })}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Week starts on</label>
            <select
              value={settings.weekStartsOn}
              onChange={(e) => saveSettings({ ...settings, weekStartsOn: Number(e.target.value) as 0 | 1 })}
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
          </div>
          <div className="field">
            <label>Default budget period</label>
            <select
              value={settings.defaultPeriodType}
              onChange={(e) => saveSettings({ ...settings, defaultPeriodType: e.target.value as PeriodType })}
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="field">
            <label>Default allocation strategy</label>
            <select
              value={settings.defaultAllocationStrategyId ?? ""}
              onChange={(e) => saveSettings({ ...settings, defaultAllocationStrategyId: e.target.value || undefined })}
            >
              {allocationStrategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="flex-between" style={{ marginBottom: 10 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            Categories
          </div>
          <button className="btn btn-sm" onClick={() => setCategoryModal("new")}>
            <Plus size={13} /> Add category
          </button>
        </div>
        <div className="card">
          {categories.length === 0 ? (
            <div className="empty-state">No categories yet.</div>
          ) : (
            categories.map((c) => {
              const Icon = categoryIcon(c.icon);
              return (
                <div className="list-row" key={c.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: c.archived ? 0.5 : 1 }}>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--surface-sunken)",
                        color: c.color,
                      }}
                    >
                      <Icon size={14} />
                    </span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {CATEGORY_KIND_LABEL[c.kind]}
                      </div>
                    </div>
                  </div>
                  <div className="row-actions">
                    <button className="btn btn-sm" onClick={() => setCategoryModal(c)}>
                      Edit
                    </button>
                    <button className="icon-btn" title={c.archived ? "Unarchive" : "Archive"} onClick={() => archiveCategory(c.id, !c.archived)}>
                      {c.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="section card">
        <div className="card-title">Your data</div>
        <div className="card-subtitle" style={{ marginBottom: 14 }}>
          Everything is stored locally on this device. Export a backup anytime, or move it to another device by importing the file there.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" onClick={handleExport}>
            <Download size={15} /> Export backup (JSON)
          </button>
          <button className="btn" onClick={() => fileInputRef.current?.click()}>
            <Upload size={15} /> Import backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
          <button
            className="btn btn-danger"
            onClick={() => {
              if (confirm("This permanently deletes all local data on this device. Continue?")) resetAllData();
            }}
          >
            Reset all data
          </button>
        </div>
      </div>

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
    </div>
  );
}
