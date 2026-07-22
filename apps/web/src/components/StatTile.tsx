export function StatTile({
  label,
  value,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "good" | "critical";
}) {
  return (
    <div className="stat-tile">
      <div className="stat-label">{label}</div>
      <div className="stat-value tabular">{value}</div>
      {delta && <div className={`stat-delta ${tone}`}>{delta}</div>}
    </div>
  );
}
