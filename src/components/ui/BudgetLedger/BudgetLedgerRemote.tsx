'use client';

import { BudgetLedger, type BudgetLedgerDensity } from './BudgetLedger';
import { useBudgetLedgerApi } from './useBudgetLedgerApi';

export interface BudgetLedgerRemoteProps {
  editable?: boolean;
  density?: BudgetLedgerDensity;
}

export function BudgetLedgerRemote({
  editable = true,
  density = 'comfortable',
}: BudgetLedgerRemoteProps) {
  const api = useBudgetLedgerApi();

  return (
    <BudgetLedger
      payload={api.payload ?? { rows: [], summaries: [] }}
      loading={api.isLoading}
      editable={editable}
      density={density}
      onCreateLine={(parentId, values) =>
        api.createLine({ parentId, values }).then(() => undefined)
      }
      onUpdateLine={(id, values) => api.updateLine(id, values).then(() => undefined)}
      onDeleteLine={(id) => api.deleteLine(id).then(() => undefined)}
    />
  );
}
