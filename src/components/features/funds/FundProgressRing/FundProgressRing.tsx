'use client';

export interface FundProgressRingProps {
  percent: number;
  label: string;
  size?: number;
  color?: string;
  className?: string;
}

export function FundProgressRing({
  percent,
  label,
  size = 44,
  color,
  className = '',
}: FundProgressRingProps) {
  const r = (size - 6) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const fill = (Math.min(Math.max(percent, 0), 100) / 100) * circumference;

  return (
    <div
      role="img"
      aria-label={`${label}: ${percent}%`}
      className={['fund-progress-ring', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          className="fund-progress-ring__track"
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          strokeWidth={4}
          transform={`rotate(-90 ${cx} ${cx})`}
        />
        <circle
          className="fund-progress-ring__bar"
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circumference}`}
          style={color ? { stroke: color } : undefined}
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </svg>
      <span className="fund-progress-ring__label" aria-hidden>
        {percent}%
      </span>
    </div>
  );
}
