type StatsGridProps = {
  stats: Array<{ label: string; value: string; delta: string; tone: string }>;
};

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="stats-row cols-4" style={{ marginBottom: 24 }}>
      {stats.map((stat) => (
        <div key={stat.label} className={`stat-card${stat.tone ? ` ${stat.tone}` : ""}`}>
          <div className="stat-label">{stat.label}</div>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-delta">{stat.delta}</div>
        </div>
      ))}
    </div>
  );
}
