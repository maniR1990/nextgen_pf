import { EmptyState } from '@/components/ui/EmptyState';
import { DATA_TABLE_EMPTY_DESCRIPTION, DATA_TABLE_EMPTY_TITLE } from '@/constants/emptyState';
import type { DataTableEmptyState } from './types';

export function DataTableEmpty({
  title = DATA_TABLE_EMPTY_TITLE,
  description = DATA_TABLE_EMPTY_DESCRIPTION,
  actionLabel,
  onAction,
}: DataTableEmptyState) {
  return (
    <EmptyState
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      role="status"
    />
  );
}
