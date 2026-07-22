import type { PeriodPoint } from "@compound-interest/core";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "../utils/format";

export function TrendChart({ points, currency }: { points: PeriodPoint[]; currency: string }) {
  if (points.length === 0) {
    return <div className="empty-state">Nothing to show yet — add income and expenses to see trends.</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 12.5 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="dot" style={{ background: "var(--series-1)" }} /> Income
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="dot" style={{ background: "var(--series-2)" }} /> Expenses
        </span>
      </div>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} barGap={4} margin={{ left: -18, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--gridline)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11.5, fill: "var(--text-muted)" }}
              axisLine={{ stroke: "var(--border-strong)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11.5, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatMoney(v, currency)}
              width={72}
            />
            <Tooltip
              cursor={{ fill: "var(--surface-sunken)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div
                    style={{
                      background: "var(--surface-1)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontSize: 12.5,
                      boxShadow: "var(--shadow-1)",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
                    {payload.map((p) => (
                      <div key={p.dataKey as string} style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
                        <span className="muted">{p.dataKey === "income" ? "Income" : "Expenses"}</span>
                        <span className="tabular">{formatMoney(Number(p.value ?? 0), currency)}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Bar dataKey="income" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            <Bar dataKey="expenses" fill="var(--series-2)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
