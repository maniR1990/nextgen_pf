export interface KpiSparklineProps {
  values: number[];
  ariaLabel: string;
}

export function KpiSparkline({ values, ariaLabel }: KpiSparklineProps) {
  const max = Math.max(...values, 1);

  return (
    <div className="kpi-sparkline" role="img" aria-label={ariaLabel}>
      {values.map((value, index) => {
        const heightPercent = Math.round((value / max) * 100);
        return (
          <div
            key={`spark-${index}`}
            className="kpi-sparkline__bar"
            style={{ height: `${heightPercent}%` }}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
