'use client';

import type { FabRadialConfig } from '@/lib/schemas/appHeader';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  TrendingUp,
  X,
} from 'lucide-react';

interface FabRadialProps {
  config: FabRadialConfig;
  open: boolean;
  onAction: (transactionType: string) => void;
  onClose: () => void;
}

const ACTION_ICON: Record<string, React.ReactNode> = {
  'arrow-down-left': <ArrowDownLeft size={22} />,
  'arrow-up-right': <ArrowUpRight size={22} />,
  'arrow-left-right': <ArrowLeftRight size={22} />,
  'trending-up': <TrendingUp size={22} />,
};

const COLOR_CLASS: Record<string, string> = {
  error: 'fab-sheet__action--error',
  success: 'fab-sheet__action--success',
  info: 'fab-sheet__action--info',
  purple: 'fab-sheet__action--purple',
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
      <div className="fab-sheet" role="dialog" aria-modal="true" aria-label="Log transaction">
        <div className="fab-sheet__header">
          <span className="fab-sheet__title">Log transaction</span>
          <button
            type="button"
            className="fab-sheet__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="fab-sheet__grid">
          {config.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={['fab-sheet__action', COLOR_CLASS[action.color] ?? ''].join(' ')}
              onClick={() => onAction(action.transactionType)}
            >
              <span className="fab-sheet__action-icon">
                {ACTION_ICON[action.icon]}
              </span>
              <span className="fab-sheet__action-label">{action.label}</span>
              {action.subtitle && (
                <span className="fab-sheet__action-subtitle">{action.subtitle}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
