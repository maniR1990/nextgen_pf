'use client';

import type { FabRadialConfig } from '@/lib/schemas/appHeader';

interface FabRadialProps {
  config: FabRadialConfig;
  open: boolean;
  onAction: (transactionType: string) => void;
  onClose: () => void;
}

// Spread 4 actions over 180° arc above the FAB (left arc: 90°→270° in CSS coords)
function calcPosition(index: number, total: number, radiusPx: number) {
  const start = 225; // degrees — lower-left
  const end   = -45; // degrees — lower-right (going counter-clockwise)
  const spread = 180;
  const step = total > 1 ? spread / (total - 1) : 0;
  const angle = ((start - step * index) * Math.PI) / 180;
  return {
    x: Math.round(Math.cos(angle) * radiusPx),
    y: Math.round(Math.sin(angle) * radiusPx),
  };
}

const COLOR_CLASS: Record<string, string> = {
  error:   'fab-action--error',
  success: 'fab-action--success',
  info:    'fab-action--info',
  purple:  'fab-action--purple',
  warning: 'fab-action--warning',
};

export function FabRadial({ config, open, onAction, onClose }: FabRadialProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fab-scrim"
        aria-hidden="true"
        onClick={onClose}
        style={{ animationDuration: `${config.animationMs}ms` }}
      />
      <div className="fab-radial" role="menu" aria-label="Quick log actions">
        {config.actions.map((action, i) => {
          const { x, y } = calcPosition(i, config.actions.length, config.radiusPx);
          return (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className={['fab-action', COLOR_CLASS[action.color] ?? ''].join(' ')}
              style={{
                transform: `translate(${x}px, ${-y}px)`,
                transitionDelay: `${(i * config.animationMs) / (config.actions.length * 2)}ms`,
              }}
              onClick={() => onAction(action.transactionType)}
              aria-label={action.label}
            >
              <span className="fab-action__label">{action.label}</span>
              {action.subtitle && (
                <span className="fab-action__subtitle">{action.subtitle}</span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
