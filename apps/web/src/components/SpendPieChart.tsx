import type { CategoryTotal } from "@compound-interest/core";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "../utils/format";

export function SpendPieChart({ rows, currency }: { rows: CategoryTotal[]; currency: string }) {
  if (rows.length === 0) {
    return <div className="empty-state">No spending logged for this period yet.</div>;
  }

  const total = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ width: 200, height: 200, flexShrink: 0, position: "relative" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows}
                dataKey="total"
                nameKey="category.name"
                innerRadius="62%"
                outerRadius="100%"
                paddingAngle={rows.length > 1 ? 2 : 0}
                stroke="var(--surface-1)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {rows.map((r) => (
                  <Cell key={r.category.id} fill={r.category.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as CategoryTotal;
                  return (
                    <div
                      style={{
                        background: "var(--surface-1)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: "6px 10px",
                        fontSize: 12.5,
                        boxShadow: "var(--shadow-1)",
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{row.category.name}</div>
                      <div className="muted">
                        {formatMoney(row.total, currency)} · {row.pctOfSpend}%
                      </div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Total
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{formatMoney(total, currency)}</div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 180 }}>
          {rows.map((r) => (
            <div key={r.category.id} className="list-row" style={{ padding: "7px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span className="dot" style={{ background: r.category.color }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13.5 }}>
                  {r.category.name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span className="muted tabular" style={{ fontSize: 12.5 }}>
                  {r.pctOfSpend}%
                </span>
                <span className="tabular" style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {formatMoney(r.total, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
