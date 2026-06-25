'use client';

const SEGMENT_COLORS = [
  '#4f9cf9',
  '#34c98e',
  '#f9c74f',
  '#f77f4b',
  '#a259ff',
  '#f94144',
];

export interface AllocationBarSource {
  accountName: string;
  allocatedAmount: number;
  accountBalance: number;
  color?: string;
}

export interface AllocationBarProps {
  sources: AllocationBarSource[];
  totalTarget: number;
  className?: string;
}

export function AllocationBar({ sources, totalTarget, className = '' }: AllocationBarProps) {
  const totalAllocated = sources.reduce((s, src) => s + src.allocatedAmount, 0);
  const base = Math.max(totalTarget, totalAllocated, 1);

  return (
    <div
      className={['allocation-bar', className].filter(Boolean).join(' ')}
      role="img"
      aria-label="Allocation breakdown"
    >
      <div className="allocation-bar__track" aria-hidden>
        {sources.map((src, i) => {
          const width = (src.allocatedAmount / base) * 100;
          return (
            <div
              key={src.accountName}
              className="allocation-bar__segment"
              style={{
                width: `${width}%`,
                backgroundColor: src.color ?? SEGMENT_COLORS[i % SEGMENT_COLORS.length],
              }}
              title={`${src.accountName}: ₹${src.allocatedAmount.toLocaleString('en-IN')}`}
            />
          );
        })}
      </div>
      <ul className="allocation-bar__legend" aria-label="Source accounts">
        {sources.map((src, i) => (
          <li key={src.accountName} className="allocation-bar__legend-item">
            <span
              className="allocation-bar__legend-dot"
              style={{ backgroundColor: src.color ?? SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
              aria-hidden
            />
            <span className="allocation-bar__legend-name">{src.accountName}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
