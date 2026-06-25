'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Target, User, Plus } from 'lucide-react';
import { FabRadial } from './FabRadial';
import type { MobileConfig } from '@/lib/schemas/appHeader';

interface BottomTabBarProps {
  config: MobileConfig;
  onFabAction: (transactionType: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  home:      <Home      size={20} aria-hidden />,
  'bar-chart': <BarChart2 size={20} aria-hidden />,
  target:    <Target    size={20} aria-hidden />,
  user:      <User      size={20} aria-hidden />,
  plus:      <Plus      size={24} aria-hidden />,
};

export function BottomTabBar({ config, onFabAction }: BottomTabBarProps) {
  const pathname = usePathname();
  const [radialOpen, setRadialOpen] = useState(false);

  function isActive(href?: string) {
    if (!href) return false;
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  function handleFabAction(type: string) {
    setRadialOpen(false);
    onFabAction(type);
  }

  return (
    <div className="bottom-tab-bar" role="navigation" aria-label="Mobile navigation">
      <FabRadial
        config={config.fabRadial}
        open={radialOpen}
        onAction={handleFabAction}
        onClose={() => setRadialOpen(false)}
      />

      <ul className="bottom-tab-bar__tabs" role="list">
        {config.tabBar.map((item) => {
          if (item.isFab) {
            return (
              <li key={item.id} className="bottom-tab-bar__tab bottom-tab-bar__tab--fab">
                <button
                  type="button"
                  className={['bottom-tab-bar__fab', radialOpen && 'bottom-tab-bar__fab--open'].filter(Boolean).join(' ')}
                  onClick={() => setRadialOpen((v) => !v)}
                  aria-expanded={radialOpen}
                  aria-label="Log transaction"
                >
                  {ICON_MAP[item.icon]}
                </button>
              </li>
            );
          }

          const active = isActive(item.href);
          return (
            <li key={item.id} className="bottom-tab-bar__tab">
              <Link
                href={item.href!}
                className={['bottom-tab-bar__link', active && 'bottom-tab-bar__link--active'].filter(Boolean).join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                <span className="bottom-tab-bar__icon">{ICON_MAP[item.icon]}</span>
                <span className="bottom-tab-bar__label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
