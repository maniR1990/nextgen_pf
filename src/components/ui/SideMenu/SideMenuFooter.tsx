import { formatBudgetMoney } from '@/components/ui/BudgetLedger/formatBudgetMoney';
import type { SideMenuFooterJson } from './schemas';

export interface SideMenuFooterProps {
  footer: SideMenuFooterJson;
  collapsed?: boolean;
}

export function SideMenuFooter({ footer, collapsed = false }: SideMenuFooterProps) {
  const surplus = formatBudgetMoney(footer.surplusAmountMinor, footer.surplusCurrency);

  return (
    <footer className="side-menu__footer" aria-label="Period summary">
      <div className="side-menu__divider" role="separator" />
      <div className="side-menu__footer-body">
        <span className="side-menu__footer-period">{footer.periodLabel}</span>
        <p className="side-menu__footer-surplus">
          <span className="side-menu__footer-surplus-amount">{surplus}</span>
          {!collapsed ? (
            <span className="side-menu__footer-surplus-suffix"> {footer.surplusSuffix}</span>
          ) : null}
        </p>
      </div>
    </footer>
  );
}
