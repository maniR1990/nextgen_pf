'use client';

import { Button } from '@/components/ui/Button';
import { DATA_TABLE_PAGE_SIZES } from '@/constants/dataTable';

interface DataTablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  startIndex: number;
  endIndex: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function DataTablePagination({
  page,
  totalPages,
  total,
  startIndex,
  endIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  return (
    <div className="data-table__pagination">
      <span className="data-table__pagination-summary">
        {total === 0 ? '0 results' : `${startIndex}–${endIndex} of ${total}`}
      </span>
      <div className="data-table__pagination-controls">
        <label className="data-table__page-size">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            aria-label="Rows per page"
          >
            {DATA_TABLE_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <Button
          size="sm"
          variant="ghost"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          Prev
        </Button>
        <span className="data-table__pagination-page" aria-live="polite">
          Page {page} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="ghost"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
