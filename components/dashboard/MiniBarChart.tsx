"use client";

export type ChartItem = { label: string; value: number; color?: string };

export default function MiniBarChart({ title, data, unit = "" }: { title: string; data: ChartItem[]; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  return (
    <div className="panel">
      <h2>{title}</h2>
      <div className="mini-bars">
        {data.length === 0 && <p className="muted">Aucune donnée disponible.</p>}
        {data.map((item) => {
          const pct = Math.max(4, Math.round(((Number(item.value) || 0) / max) * 100));
          return (
            <div className="mini-bar-row" key={item.label}>
              <div className="mini-bar-label" title={item.label}>{item.label}</div>
              <div className="mini-bar-track">
                <div className="mini-bar-fill" style={{ width: `${pct}%`, background: item.color || undefined }} />
              </div>
              <strong>{item.value}{unit}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}
