'use client';

export interface AccountHealthRingProps {
  score: number;
  size?: number;
  className?: string;
}

type HealthZone = 'healthy' | 'ok' | 'low';

function resolveZone(score: number): HealthZone {
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'ok';
  return 'low';
}

export function AccountHealthRing({ score, size = 56, className = '' }: AccountHealthRingProps) {
  const zone = resolveZone(score);
  const r = (size - 8) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  return (
    <div
      role="img"
      aria-label={`Health score: ${score} out of 100`}
      className={['account-health-ring', `account-health-ring--${zone}`, className]
        .filter(Boolean)
        .join(' ')}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          className="account-health-ring__track"
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          strokeWidth={5}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
        <circle
          className="account-health-ring__bar"
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </svg>
      <span className="account-health-ring__score" aria-hidden>
        {score}
      </span>
    </div>
  );
}
